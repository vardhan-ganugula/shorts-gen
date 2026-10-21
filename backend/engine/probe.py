import json
import subprocess
import shutil
from typing import Dict, Any, Optional

def probe_video(file_path: str) -> Dict[str, Any]:
    """
    Probe a media file using ffprobe and return resolution, duration, fps, and audio details.
    """
    ffprobe_cmd = shutil.which("ffprobe") or "ffprobe"
    cmd = [
        ffprobe_cmd,
        "-v", "quiet",
        "-print_format", "json",
        "-show_format",
        "-show_streams",
        file_path
    ]
    
    result = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, check=True)
    info = json.loads(result.stdout)
    
    video_stream = next((s for s in info.get("streams", []) if s.get("codec_type") == "video"), None)
    audio_stream = next((s for s in info.get("streams", []) if s.get("codec_type") == "audio"), None)
    
    duration = float(info.get("format", {}).get("duration", 0.0))
    if duration == 0.0 and video_stream:
        duration = float(video_stream.get("duration", 0.0))
        
    width = int(video_stream.get("width", 1920)) if video_stream else 1920
    height = int(video_stream.get("height", 1080)) if video_stream else 1080
    
    fps = 30.0
    if video_stream and "r_frame_rate" in video_stream:
        parts = video_stream["r_frame_rate"].split('/')
        if len(parts) == 2 and float(parts[1]) > 0:
            fps = float(parts[0]) / float(parts[1])
        elif len(parts) == 1:
            fps = float(parts[0])
            
    return {
        "file_path": file_path,
        "duration": duration,
        "width": width,
        "height": height,
        "aspect_ratio": f"{width}:{height}",
        "is_vertical": height > width,
        "fps": round(fps, 2),
        "has_audio": audio_stream is not None,
        "audio_codec": audio_stream.get("codec_name") if audio_stream else None,
        "video_codec": video_stream.get("codec_name") if video_stream else None,
        "file_size_bytes": int(info.get("format", {}).get("size", 0))
    }
