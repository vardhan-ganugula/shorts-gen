import os
import subprocess
import shutil
from typing import Dict, Any, List, Optional
import av

# Compatibility fix: PyAV 19.x removed metadata_errors parameter expected by faster-whisper
_orig_av_open = av.open
def _safe_av_open(*args, **kwargs):
    kwargs.pop("metadata_errors", None)
    return _orig_av_open(*args, **kwargs)
av.open = _safe_av_open

from faster_whisper import WhisperModel

_MODEL_CACHE: Dict[str, WhisperModel] = {}

def get_whisper_model(model_size: str = "base", device: str = "auto") -> WhisperModel:
    """
    Load or retrieve cached WhisperModel instance.
    """
    key = f"{model_size}_{device}"
    if key not in _MODEL_CACHE:
        actual_device = "cpu"
        compute_type = "int8"
        try:
            # faster-whisper runs on CTranslate2; do not depend on whether
            # PyTorch happens to be installed with CUDA support.
            import ctranslate2
            if ctranslate2.get_cuda_device_count() > 0 and device in ("auto", "cuda"):
                actual_device = "cuda"
                compute_type = "float16"
        except Exception:
            # Keep CPU fallback for machines without a CUDA-enabled runtime.
            pass

        _MODEL_CACHE[key] = WhisperModel(model_size, device=actual_device, compute_type=compute_type)
    return _MODEL_CACHE[key]

def extract_audio(video_path: str, output_audio_path: Optional[str] = None) -> str:
    """
    Extracts 16kHz mono WAV audio from a video using FFmpeg.
    """
    if output_audio_path is None:
        base, _ = os.path.splitext(video_path)
        output_audio_path = f"{base}_audio.wav"

    ffmpeg_cmd = shutil.which("ffmpeg") or "ffmpeg"
    cmd = [
        ffmpeg_cmd,
        "-y",
        "-i", video_path,
        "-vn",
        "-acodec", "pcm_s16le",
        "-ar", "16000",
        "-ac", "1",
        output_audio_path
    ]
    subprocess.run(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=True)
    return output_audio_path

def transcribe_video(video_path: str, model_size: str = "base", language: Optional[str] = None) -> Dict[str, Any]:
    """
    Transcribes video and returns word-level timestamps and segment information.
    """
    audio_path = extract_audio(video_path)
    model = get_whisper_model(model_size=model_size)
    requested_language = language
    if requested_language == "auto":
        requested_language = None

    initial_prompt = None
    if requested_language == "hi":
        initial_prompt = "यह हिंदी भाषा में बोला गया पाठ है। देवनागरी लिपि में लिखें।"
    elif requested_language == "ur":
        initial_prompt = "یہ اردو زبان میں بولا گیا متن ہے۔ اردو رسم الخط میں لکھیں۔"

    segments, info = model.transcribe(
        audio_path,
        beam_size=5,
        word_timestamps=True,
        language=requested_language,
        task="transcribe",
        initial_prompt=initial_prompt
    )

    parsed_segments = []
    all_words = []
    full_text = []

    for seg in segments:
        seg_dict = {
            "id": seg.id,
            "start": round(seg.start, 2),
            "end": round(seg.end, 2),
            "text": seg.text.strip(),
            "words": []
        }
        full_text.append(seg.text.strip())

        if seg.words:
            for w in seg.words:
                word_item = {
                    "word": w.word.strip(),
                    "start": round(w.start, 2),
                    "end": round(w.end, 2),
                    "probability": round(w.probability, 2)
                }
                seg_dict["words"].append(word_item)
                all_words.append(word_item)

        parsed_segments.append(seg_dict)

    # Clean up temporary audio file
    try:
        if os.path.exists(audio_path):
            os.remove(audio_path)
    except Exception:
        pass

    return {
        "language": getattr(info, "language", "en"),
        "language_probability": round(getattr(info, "language_probability", 1.0), 2),
        "duration": round(getattr(info, "duration", 0.0), 2),
        "full_text": " ".join(full_text),
        "segments": parsed_segments,
        "words": all_words
    }
