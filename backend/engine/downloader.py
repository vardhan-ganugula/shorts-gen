import os
import yt_dlp
from typing import Dict, Any, Callable, Optional

def _youtube_auth_options() -> Dict[str, Any]:
    """Return explicitly configured, user-provided YouTube auth options."""
    options: Dict[str, Any] = {}
    browser = os.environ.get("KLAP_YTDLP_COOKIES_FROM_BROWSER", "").strip().lower()
    cookie_file = os.environ.get("KLAP_YTDLP_COOKIEFILE", "").strip()

    # Never read browser cookies implicitly; authentication must be opted in.
    if browser:
        options["cookiesfrombrowser"] = (browser,)
    if cookie_file:
        options["cookiefile"] = cookie_file
    return options

def extract_url_metadata(url: str) -> Dict[str, Any]:
    """
    Fast extraction of video metadata without downloading the full video bytes.
    Takes ~1-2 seconds.
    """
    ydl_opts = {
        'skip_download': True,
        'quiet': True,
        'no_warnings': True,
    }
    ydl_opts.update(_youtube_auth_options())
    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        info = ydl.extract_info(url, download=False)
        return {
            "id": info.get("id"),
            "title": info.get("title", "Imported Video"),
            "description": info.get("description", ""),
            "duration": info.get("duration", 0),
            "thumbnail": info.get("thumbnail"),
            "channel": info.get("uploader") or info.get("channel", "Unknown"),
        }

def download_video(url: str, output_dir: str, progress_hook: Optional[Callable[[Dict[str, Any]], None]] = None) -> Dict[str, Any]:
    """
    Downloads video with optimized resolution (up to 1080p, avoiding multi-gigabyte 4K streams).
    """
    os.makedirs(output_dir, exist_ok=True)
    out_template = os.path.join(output_dir, "%(id)s.%(ext)s")

    # Prefer 1080p/720p H.264 mp4 for fast downloading and reliable processing
    ydl_opts = {
        'format': 'bestvideo[height<=1080][ext=mp4]+bestaudio[ext=m4a]/best[height<=1080][ext=mp4]/best[height<=720]/best',
        'outtmpl': out_template,
        'merge_output_format': 'mp4',
        'noplaylist': True,
        'quiet': True,
        'no_warnings': True,
        'socket_timeout': 30,
    }
    ydl_opts.update(_youtube_auth_options())

    if progress_hook:
        ydl_opts['progress_hooks'] = [progress_hook]

    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        info = ydl.extract_info(url, download=True)
        filename = ydl.prepare_filename(info)
        base, _ = os.path.splitext(filename)
        final_filename = f"{base}.mp4"
        if not os.path.exists(final_filename) and os.path.exists(filename):
            final_filename = filename

        return {
            "id": info.get("id"),
            "title": info.get("title", "Imported Video"),
            "description": info.get("description", ""),
            "duration": info.get("duration", 0),
            "thumbnail": info.get("thumbnail"),
            "channel": info.get("uploader") or info.get("channel", "Unknown"),
            "file_path": os.path.abspath(final_filename)
        }
