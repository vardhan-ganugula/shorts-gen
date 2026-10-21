import os
import uuid
import json
import shutil
import asyncio
import time
import traceback
from typing import List, Optional, Dict
from fastapi import FastAPI, UploadFile, File, Form, HTTPException, BackgroundTasks, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse, StreamingResponse, Response
from pydantic import BaseModel

from engine import (
    probe_video,
    download_video,
    extract_url_metadata,
    transcribe_video,
    extract_viral_clips,
    render_clip,
    STYLE_PRESETS
)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, "data")
MEDIA_DIR = os.path.join(DATA_DIR, "media")
PROJECTS_FILE = os.path.join(DATA_DIR, "projects.json")

os.makedirs(MEDIA_DIR, exist_ok=True)

# In-memory render job tracker for async rendering
render_jobs: Dict[str, dict] = {}

app = FastAPI(title="Klap AI Shorts Engine API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def load_projects() -> List[dict]:
    if not os.path.exists(PROJECTS_FILE):
        return []
    try:
        with open(PROJECTS_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return []

def save_projects(projects: List[dict]):
    with open(PROJECTS_FILE, "w", encoding="utf-8") as f:
        json.dump(projects, f, indent=2)

def get_project_by_id(project_id: str) -> Optional[dict]:
    for p in load_projects():
        if p["id"] == project_id:
            return p
    return None

def update_project(project_id: str, updates: dict):
    projects = load_projects()
    for i, p in enumerate(projects):
        if p["id"] == project_id:
            projects[i].update(updates)
            save_projects(projects)
            return projects[i]
    return None

class ImportUrlRequest(BaseModel):
    url: str
    language: Optional[str] = "auto"

class RenderClipRequest(BaseModel):
    clip_id: str
    aspect_ratio: Optional[str] = "9:16"
    caption_preset: Optional[str] = "hormozi"
    caption_position: Optional[str] = "bottom"
    layout_mode: Optional[str] = "single"
    enable_emojis: Optional[bool] = True
    enable_keyword_colors: Optional[bool] = True
    font_scale: Optional[float] = 1.0
    start_time: Optional[float] = None
    end_time: Optional[float] = None

class UpdateClipRequest(BaseModel):
    title: Optional[str] = None
    start: Optional[float] = None
    end: Optional[float] = None
    aspect_ratio: Optional[str] = None
    layout_mode: Optional[str] = None
    caption_preset: Optional[str] = None
    caption_position: Optional[str] = None
    text: Optional[str] = None
    words: Optional[List[dict]] = None

SUPPORTED_TRANSCRIPTION_LANGUAGES = {"auto", "en", "hi", "ur"}

def normalize_transcription_language(language: Optional[str]) -> str:
    value = (language or "auto").strip().lower()
    if value not in SUPPORTED_TRANSCRIPTION_LANGUAGES:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported transcription language '{language}'. Choose auto, en, hi, or ur."
        )
    return value

def run_full_pipeline(project_id: str, video_path: str, language: str = "auto"):
    """
    Background worker: Probe -> Transcribe (Whisper) -> Virality Ranking
    """
    try:
        update_project(project_id, {"status": "analyzing_media", "progress": 25})
        probe_info = probe_video(video_path)
        update_project(project_id, {"probe": probe_info, "status": "transcribing", "progress": 45})

        # Run speech recognition
        whisper_language = None if language == "auto" else language
        whisper_model = os.environ.get("KLAP_WHISPER_MODEL", "small").strip() or "small"
        transcript_data = transcribe_video(video_path, model_size=whisper_model, language=whisper_language)
        update_project(project_id, {
            "status": "scoring_virality",
            "progress": 80,
            "transcript": transcript_data
        })

        # Score hooks and extract clips
        clips = extract_viral_clips(transcript_data.get("segments", []), fallback_duration=probe_info.get("duration", 30.0))

        update_project(project_id, {
            "status": "ready",
            "progress": 100,
            "clips": clips,
            "clip_count": len(clips)
        })
    except Exception as e:
        update_project(project_id, {
            "status": "error",
            "progress": 0,
            "error_message": str(e)
        })

def download_and_process_url(project_id: str, url: str, language: str = "auto"):
    """
    Background worker: Download YouTube video -> run pipeline
    """
    try:
        update_project(project_id, {"status": "downloading", "progress": 15})
        dl_info = download_video(url, MEDIA_DIR)
        filename = os.path.basename(dl_info["file_path"])

        update_project(project_id, {
            "title": dl_info.get("title") or "Imported Video",
            "video_path": dl_info["file_path"],
            "video_url": f"/api/media/{filename}",
            "thumbnail": dl_info.get("thumbnail"),
            "channel": dl_info.get("channel"),
            "duration": dl_info.get("duration"),
            "progress": 25
        })

        run_full_pipeline(project_id, dl_info["file_path"], language)
    except Exception as e:
        update_project(project_id, {
            "status": "error",
            "progress": 0,
            "error_message": f"Download failed: {str(e)}"
        })

@app.get("/api/health")
def health():
    return {
        "status": "online",
        "service": "Klap AI Shorts Engine",
        "features": [
            "yt-dlp video ingestion",
            "faster-whisper word-level transcription",
            "mediapipe face tracking 9:16 reframe",
            "dynamic ASS subtitle burning",
            "virality scoring & social caption generation"
        ]
    }

@app.get("/api/presets")
def get_presets():
    return {"presets": STYLE_PRESETS}

@app.get("/api/projects")
def list_projects():
    return {"projects": load_projects()}

@app.get("/api/projects/{project_id}")
def get_project(project_id: str):
    p = get_project_by_id(project_id)
    if not p:
        raise HTTPException(status_code=404, detail="Project not found")
    return p

@app.post("/api/projects/upload")
async def upload_file(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    language: str = Form("auto")
):
    language = normalize_transcription_language(language)
    project_id = str(uuid.uuid4())
    filename = f"{project_id}_{file.filename}"
    file_path = os.path.join(MEDIA_DIR, filename)

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    project = {
        "id": project_id,
        "title": file.filename or "Uploaded Video",
        "source": "upload",
        "language": language,
        "video_path": file_path,
        "video_url": f"/api/media/{filename}",
        "status": "queued",
        "progress": 10,
        "clips": [],
        "clip_count": 0,
        "created_at": time.time()
    }

    projects = load_projects()
    projects.insert(0, project)
    save_projects(projects)

    background_tasks.add_task(run_full_pipeline, project_id, file_path, language)
    return project

@app.post("/api/projects/url")
def import_from_url(req: ImportUrlRequest, background_tasks: BackgroundTasks):
    url = req.url.strip()
    if not url:
        raise HTTPException(status_code=400, detail="URL cannot be empty")

    language = normalize_transcription_language(req.language)
    project_id = str(uuid.uuid4())

    # Fast metadata check
    title = "YouTube Video"
    thumbnail = None
    try:
        meta = extract_url_metadata(url)
        title = meta.get("title") or title
        thumbnail = meta.get("thumbnail")
    except Exception:
        pass

    project = {
        "id": project_id,
        "title": title,
        "source": url,
        "language": language,
        "thumbnail": thumbnail,
        "video_path": "",
        "video_url": "",
        "status": "downloading",
        "progress": 10,
        "clips": [],
        "clip_count": 0,
        "created_at": time.time()
    }

    projects = load_projects()
    projects.insert(0, project)
    save_projects(projects)

    # Launch background async worker
    background_tasks.add_task(download_and_process_url, project_id, url, language)
    return project

@app.post("/api/projects/{project_id}/analyze")
def trigger_analysis(project_id: str, background_tasks: BackgroundTasks):
    project = get_project_by_id(project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    if not project.get("video_path") or not os.path.exists(project["video_path"]):
        raise HTTPException(status_code=400, detail="Video file does not exist")

    update_project(project_id, {"status": "queued", "progress": 5, "error_message": None})
    language = normalize_transcription_language(project.get("language", "auto"))
    update_project(project_id, {"status": "queued", "progress": 5, "error_message": None, "language": language})
    background_tasks.add_task(run_full_pipeline, project_id, project["video_path"], language)
    return {"success": True, "message": "Analysis started"}

@app.put("/api/projects/{project_id}/clips/{clip_id}")
def update_clip(project_id: str, clip_id: str, req: UpdateClipRequest):
    project = get_project_by_id(project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    clips = project.get("clips", [])
    target = None
    for c in clips:
        if c["id"] == clip_id:
            target = c
            if req.title is not None:
                c["title"] = req.title
            if req.start is not None:
                c["start"] = req.start
            if req.end is not None:
                c["end"] = req.end
            if req.aspect_ratio is not None:
                c["aspect_ratio"] = req.aspect_ratio
            if req.caption_preset is not None:
                c["caption_preset"] = req.caption_preset
            if req.caption_position is not None:
                c["caption_position"] = req.caption_position
            if req.layout_mode is not None:
                c["layout_mode"] = req.layout_mode
            if req.text is not None:
                c["text"] = req.text
            if req.words is not None:
                c["words"] = req.words
            c["duration"] = round(c["end"] - c["start"], 1)
            break

    if not target:
        raise HTTPException(status_code=404, detail="Clip not found")

    update_project(project_id, {"clips": clips})
    return {"success": True, "clip": target}

def _render_worker(job_id: str, project_id: str, video_path: str, output_path: str, output_filename: str,
                    start_time: float, end_time: float, words: list, aspect_ratio: str,
                    caption_preset: str, caption_position: str, layout_mode: str,
                    enable_emojis: bool, enable_keyword_colors: bool, font_scale: float):
    """Background render worker that updates render_jobs status."""
    try:
        render_jobs[job_id]["status"] = "rendering"
        render_res = render_clip(
            source_video_path=video_path,
            output_mp4_path=output_path,
            start_time=start_time,
            end_time=end_time,
            words=words,
            aspect_ratio=aspect_ratio,
            caption_preset=caption_preset,
            caption_position=caption_position,
            layout_mode=layout_mode,
            enable_emojis=enable_emojis,
            enable_keyword_colors=enable_keyword_colors,
            font_scale=font_scale
        )
        render_jobs[job_id].update({
            "status": "done",
            "success": True,
            "download_url": f"/api/media/{output_filename}",
            "filename": output_filename,
            "render_info": render_res
        })
    except Exception as e:
        render_jobs[job_id].update({
            "status": "error",
            "success": False,
            "error": str(e),
            "traceback": traceback.format_exc()
        })

@app.post("/api/projects/{project_id}/render")
def render_project_clip(project_id: str, req: RenderClipRequest, background_tasks: BackgroundTasks):
    project = get_project_by_id(project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    target_clip = next((c for c in project.get("clips", []) if c["id"] == req.clip_id), None)
    if not target_clip:
        raise HTTPException(status_code=404, detail="Clip not found")

    start_time = req.start_time if req.start_time is not None else float(target_clip["start"])
    end_time = req.end_time if req.end_time is not None else float(target_clip["end"])
    aspect_ratio = req.aspect_ratio or target_clip.get("aspect_ratio", "9:16")
    caption_preset = req.caption_preset or target_clip.get("caption_preset", "hormozi")
    caption_position = req.caption_position or target_clip.get("caption_position", "bottom")

    output_filename = f"render_{project_id[:8]}_{req.clip_id}_{caption_preset}_{aspect_ratio.replace(':', 'x')}.mp4"
    output_path = os.path.join(MEDIA_DIR, output_filename)

    # If a completed render already exists on disk, return immediately
    if os.path.exists(output_path) and os.path.getsize(output_path) > 0:
        return {
            "success": True,
            "download_url": f"/api/media/{output_filename}",
            "filename": output_filename,
            "render_info": {"cached": True}
        }

    words = target_clip.get("words") or project.get("transcript", {}).get("words", [])
    layout_mode = req.layout_mode or target_clip.get("layout_mode", "single")
    enable_emojis = req.enable_emojis if req.enable_emojis is not None else True
    enable_keyword_colors = req.enable_keyword_colors if req.enable_keyword_colors is not None else True
    font_scale = req.font_scale if req.font_scale is not None else 1.0

    job_id = f"{project_id}_{req.clip_id}"

    # If already rendering, return the job status
    if job_id in render_jobs and render_jobs[job_id]["status"] == "rendering":
        return {"success": True, "job_id": job_id, "status": "rendering", "message": "Already rendering, poll /render-status"}

    render_jobs[job_id] = {"status": "queued", "success": False}

    background_tasks.add_task(
        _render_worker, job_id, project_id, project["video_path"], output_path, output_filename,
        start_time, end_time, words, aspect_ratio,
        caption_preset, caption_position, layout_mode,
        enable_emojis, enable_keyword_colors, font_scale
    )

    return {"success": True, "job_id": job_id, "status": "queued", "message": "Render started in background"}

@app.get("/api/projects/{project_id}/render-status/{clip_id}")
def render_status(project_id: str, clip_id: str):
    """Poll this endpoint to check if a render job is complete."""
    job_id = f"{project_id}_{clip_id}"
    job = render_jobs.get(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="No render job found for this clip")
    return job

@app.post("/api/projects/{project_id}/render-all")
def render_all_project_clips(project_id: str, background_tasks: BackgroundTasks):
    project = get_project_by_id(project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    clips = project.get("clips", [])
    if not clips:
        raise HTTPException(status_code=400, detail="No clips available to render")

    def _render_all_worker():
        for c in clips:
            try:
                clip_id = c["id"]
                job_id = f"{project_id}_{clip_id}"
                start_time = float(c["start"])
                end_time = float(c["end"])
                aspect_ratio = c.get("aspect_ratio", "9:16")
                caption_preset = c.get("caption_preset", "hormozi")
                caption_position = c.get("caption_position", "bottom")
                layout_mode = c.get("layout_mode", "single")
                words = c.get("words") or project.get("transcript", {}).get("words", [])
                output_filename = f"render_{project_id[:8]}_{clip_id}_{caption_preset}_{aspect_ratio.replace(':', 'x')}.mp4"
                output_path = os.path.join(MEDIA_DIR, output_filename)

                if os.path.exists(output_path) and os.path.getsize(output_path) > 0:
                    continue  # already rendered

                render_jobs[job_id] = {"status": "queued", "success": False}
                _render_worker(
                    job_id, project_id, project["video_path"], output_path, output_filename,
                    start_time, end_time, words, aspect_ratio,
                    caption_preset, caption_position, layout_mode,
                    True, True, 1.0
                )
            except Exception:
                pass

    background_tasks.add_task(_render_all_worker)
    return {"success": True, "message": f"Queued rendering for {len(clips)} clips"}

@app.api_route("/api/media/{filename}", methods=["GET", "HEAD"])
def stream_video(filename: str, request: Request):
    """
    HTTP 206 Partial Content Range streaming for video player scrubbing.
    """
    file_path = os.path.join(MEDIA_DIR, filename)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found")

    file_size = os.path.getsize(file_path)

    if request.method == "HEAD":
        return Response(headers={
            "Accept-Ranges": "bytes",
            "Content-Length": str(file_size),
            "Content-Type": "video/mp4",
        })
    range_header = request.headers.get("range")

    if not range_header:
        return FileResponse(file_path, media_type="video/mp4")

    byte_range = range_header.replace("bytes=", "").split("-")
    start = int(byte_range[0])
    end = int(byte_range[1]) if len(byte_range) > 1 and byte_range[1] else file_size - 1
    content_length = (end - start) + 1

    def iterfile():
        with open(file_path, "rb") as f:
            f.seek(start)
            remaining = content_length
            chunk_size = 1024 * 1024
            while remaining > 0:
                read_size = min(chunk_size, remaining)
                data = f.read(read_size)
                if not data:
                    break
                remaining -= len(data)
                yield data

    headers = {
        "Content-Range": f"bytes {start}-{end}/{file_size}",
        "Accept-Ranges": "bytes",
        "Content-Length": str(content_length),
        "Content-Type": "video/mp4",
    }
    return StreamingResponse(iterfile(), status_code=206, headers=headers)

@app.delete("/api/projects/{project_id}")
def delete_project(project_id: str):
    projects = load_projects()
    to_delete = next((p for p in projects if p["id"] == project_id), None)
    if to_delete:
        try:
            if os.path.exists(to_delete.get("video_path", "")):
                os.remove(to_delete["video_path"])
        except Exception:
            pass

    new_projects = [p for p in projects if p["id"] != project_id]
    save_projects(new_projects)
    return {"success": True}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)
