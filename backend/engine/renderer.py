import os
import shutil
import subprocess
from typing import Dict, Any, List, Optional
from .probe import probe_video
from .reframe import sample_video_speakers, calculate_smooth_crop
from .subtitles import generate_ass_subtitles

def check_nvenc_available() -> bool:
    """Check if NVIDIA NVENC H.264 encoder is supported on this machine."""
    try:
        ffmpeg_cmd = shutil.which("ffmpeg") or "ffmpeg"
        res = subprocess.run([ffmpeg_cmd, "-encoders"], stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
        return "h264_nvenc" in res.stdout
    except Exception:
        return False

def render_clip(
    source_video_path: str,
    output_mp4_path: str,
    start_time: float,
    end_time: float,
    words: List[Dict[str, Any]],
    aspect_ratio: str = "9:16",
    caption_preset: str = "hormozi",
    caption_position: str = "bottom",
    layout_mode: str = "single",  # "single" or "podcast_split"
    enable_emojis: bool = True,
    enable_keyword_colors: bool = True,
    font_scale: float = 1.0,
    target_width: int = 1080,
    target_height: int = 1920
) -> Dict[str, Any]:
    """
    Renders high-retention short with optional podcast split-screen,
    face-tracking crop, animated subtitles, and broadcast audio normalization.
    """
    os.makedirs(os.path.dirname(os.path.abspath(output_mp4_path)), exist_ok=True)
    probe_info = probe_video(source_video_path)

    # 1. Sample speaker face positions
    speaker_data = sample_video_speakers(source_video_path, start_time, end_time, sample_interval_sec=0.5)

    # If podcast_split requested or auto-detected with 2 speakers
    effective_layout = layout_mode
    if layout_mode == "auto":
        effective_layout = "podcast_split" if speaker_data["is_podcast"] else "single"

    crop_data = calculate_smooth_crop(
        video_width=probe_info["width"],
        video_height=probe_info["height"],
        centers=speaker_data["single_centers"],
        target_aspect=aspect_ratio,
        layout_mode=effective_layout,
        left_x=speaker_data["left_x"],
        right_x=speaker_data["right_x"]
    )

    # 2. Generate ASS dynamic subtitles
    ass_path = os.path.splitext(output_mp4_path)[0] + ".ass"
    clip_words = [w for w in words if start_time <= float(w.get("start", 0)) <= end_time]

    generate_ass_subtitles(
        words=clip_words,
        clip_start_offset=start_time,
        output_ass_path=ass_path,
        preset_name=caption_preset,
        video_width=target_width,
        video_height=target_height,
        vertical_position=caption_position,
        enable_emojis=enable_emojis,
        enable_keyword_colors=enable_keyword_colors,
        font_scale=font_scale
    )

    ffmpeg_cmd = shutil.which("ffmpeg") or "ffmpeg"
    duration = max(0.5, end_time - start_time)

    # Escape path for FFmpeg subtitles filter on Windows
    escaped_ass = ass_path.replace("\\", "/").replace(":", "\\:")

    has_nvenc = check_nvenc_available()
    v_encoder = "h264_nvenc" if has_nvenc else "libx264"
    preset_arg = "p4" if has_nvenc else "fast"

    if crop_data.get("is_split"):
        # Stacked podcast layout: top speaker (1080x960) + bottom speaker (1080x960)
        filter_complex = f"{crop_data['filter_complex']}; [vstacked]ass='{escaped_ass}'[vout]"
        cmd = [
            ffmpeg_cmd,
            "-y",
            "-ss", str(start_time),
            "-t", str(duration),
            "-i", source_video_path,
            "-filter_complex", filter_complex,
            "-map", "[vout]",
            "-map", "0:a?",
            "-c:v", v_encoder,
            "-preset", preset_arg,
            "-pix_fmt", "yuv420p",
            "-c:a", "aac",
            "-b:a", "192k",
            "-ar", "44100",
            "-af", "loudnorm=I=-14:LRA=11:TP=-1.5",
            "-movflags", "+faststart",
            output_mp4_path
        ]
    else:
        # Single speaker layout
        filter_chain = [
            crop_data["filter_string"],
            f"scale={target_width}:{target_height}:force_original_aspect_ratio=decrease",
            f"pad={target_width}:{target_height}:(ow-iw)/2:(oh-ih)/2:black",
            f"ass='{escaped_ass}'"
        ]
        vf_string = ",".join(filter_chain)
        cmd = [
            ffmpeg_cmd,
            "-y",
            "-ss", str(start_time),
            "-t", str(duration),
            "-i", source_video_path,
            "-vf", vf_string,
            "-c:v", v_encoder,
            "-preset", preset_arg,
            "-pix_fmt", "yuv420p",
            "-c:a", "aac",
            "-b:a", "192k",
            "-ar", "44100",
            "-af", "loudnorm=I=-14:LRA=11:TP=-1.5",
            "-movflags", "+faststart",
            output_mp4_path
        ]

    result = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
    if result.returncode != 0:
        # Fallback to libx264 without loudnorm if needed
        fallback_vf = [
            crop_data.get("filter_string", "scale=1080:1920"),
            f"scale={target_width}:{target_height}:force_original_aspect_ratio=decrease",
            f"pad={target_width}:{target_height}:(ow-iw)/2:(oh-ih)/2:black"
        ]
        cmd_fallback = [
            ffmpeg_cmd,
            "-y",
            "-ss", str(start_time),
            "-t", str(duration),
            "-i", source_video_path,
            "-vf", ",".join(fallback_vf),
            "-c:v", "libx264",
            "-preset", "fast",
            "-crf", "22",
            "-pix_fmt", "yuv420p",
            "-c:a", "aac",
            "-b:a", "192k",
            output_mp4_path
        ]
        subprocess.run(cmd_fallback, check=True)

    return {
        "output_path": output_mp4_path,
        "duration": duration,
        "aspect_ratio": aspect_ratio,
        "layout_mode": effective_layout,
        "caption_preset": caption_preset,
        "crop_metadata": crop_data,
        "file_size": os.path.getsize(output_mp4_path) if os.path.exists(output_mp4_path) else 0
    }
