# Klap AI Shorts Generator (Full Stack)

A self-hosted, reverse-engineered implementation of **Klap.app** (`/spaces?task=shorts`) built with a **Next.js 14 frontend** and a **Python AI backend engine**.

---

## ⚡ Architecture

```
klap_app/
├── backend/
│   ├── app.py                # FastAPI REST API & Async Task Queue
│   └── engine/
│       ├── probe.py          # FFprobe metadata extractor
│       ├── downloader.py     # yt-dlp YouTube video ingestion
│       ├── transcriber.py    # faster-whisper with word-level timestamps
│       ├── virality.py       # Hook detection, pacing score, and virality ranking (0-100)
│       ├── reframe.py        # MediaPipe + OpenCV face-tracking 9:16 smart reframe
│       ├── subtitles.py      # Dynamic ASS subtitle generator (Hormozi, Neon, Beast, Clean)
│       └── renderer.py       # Hardware-accelerated FFmpeg burning engine
├── frontend/                 # Next.js 14 + Tailwind CSS dashboard & video studio
│   ├── src/app/spaces/       # Spaces dashboard (/spaces?task=shorts)
│   ├── src/app/editor/[id]/  # 9:16 In-browser Video Studio & Subtitle Styler
│   └── src/components/       # VideoUploader, ClipCard, Navbar
├── run.bat                   # 1-Click launcher
├── start_backend.bat         # Start Python API (Port 8000)
└── start_frontend.bat        # Start Next.js Frontend (Port 3000)
```

---

## 🚀 Features

1. **Video Ingestion**:
   - YouTube URL downloading via `yt-dlp` (metadata, title, description, channel).
   - Direct video file upload (MP4, MOV, MKV, WebM).
2. **AI Transcription**:
   - `faster-whisper` (word-level timestamps, automatic CPU/CUDA acceleration).
3. **Virality & Moment Extraction**:
   - Hook detection algorithm (emotional trigger words, numbers, questions).
   - Pacing scoring (words-per-second retention analysis).
   - Virality Score (0 to 100) and auto-generated social media captions with trending hashtags.
4. **Smart 9:16 Reframing**:
   - MediaPipe face detection & OpenCV speaker tracking.
   - Smooth horizontal panning interpolation to keep speakers centered.
5. **Dynamic Styled Captions**:
   - Karaoke word-by-word active highlight.
   - Presets: **Alex Hormozi**, **Cyber Neon**, **MrBeast Punch**, **Clean Minimal**.
   - Position selection: Bottom, Middle, Top.
6. **In-Browser Video Studio**:
   - 9:16 interactive player preview with timecode scrubber.
   - Trim boundary adjustment (start time, end time).
   - Instant export to ready-to-post MP4 with loudnorm audio normalization (-14 LUFS).

---

## 🛠️ Quick Start

### 1. Launch Everything
Double click **`run.bat`** or run:
```bash
.\run.bat
```

### 2. Access Web Dashboard
- **Frontend App**: [http://localhost:3000/spaces?task=shorts](http://localhost:3000/spaces?task=shorts)
- **Interactive API Docs**: [http://localhost:8000/docs](http://localhost:8000/docs)
