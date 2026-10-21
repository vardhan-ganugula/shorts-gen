import cv2
import numpy as np
from typing import Dict, Any, List, Tuple, Optional

def detect_faces_mediapipe(frame_rgb: np.ndarray) -> List[Tuple[float, float, float, float]]:
    """
    Detect faces using MediaPipe Face Detection.
    Returns list of (x_center, y_center, width, height) normalized to [0.0, 1.0].
    """
    try:
        import mediapipe as mp
        mp_face_detection = mp.solutions.face_detection
        with mp_face_detection.FaceDetection(model_selection=0, min_detection_confidence=0.5) as face_detection:
            results = face_detection.process(frame_rgb)
            faces = []
            if results.detections:
                for detection in results.detections:
                    box = detection.location_data.relative_bounding_box
                    x_center = box.xmin + box.width / 2.0
                    y_center = box.ymin + box.height / 2.0
                    faces.append((x_center, y_center, box.width, box.height))
            return faces
    except Exception:
        return []

def detect_faces_opencv(frame_bgr: np.ndarray) -> List[Tuple[float, float, float, float]]:
    """
    Fallback OpenCV Haar Cascade face detection.
    """
    try:
        face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
        gray = cv2.cvtColor(frame_bgr, cv2.COLOR_BGR2GRAY)
        detected = face_cascade.detectMultiScale(gray, scaleFactor=1.2, minNeighbors=4, minSize=(40, 40))
        h, w = frame_bgr.shape[:2]
        faces = []
        for (x, y, fw, fh) in detected:
            x_center = (x + fw / 2.0) / w
            y_center = (y + fh / 2.0) / h
            faces.append((x_center, y_center, fw / w, fh / h))
        return faces
    except Exception:
        return []

def sample_video_speakers(
    video_path: str,
    start_time: float,
    end_time: float,
    sample_interval_sec: float = 1.5
) -> Dict[str, Any]:
    """
    High-speed frame sampling to detect single vs multi-speaker (podcast) setups.
    Downscales frames to 640px for 5x faster face detection.
    """
    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        return {"single_centers": [(start_time, 0.5)], "is_podcast": False, "left_x": 0.25, "right_x": 0.75}

    fps = cap.get(cv2.CAP_PROP_FPS) or 30.0
    single_centers: List[Tuple[float, float]] = []
    all_detected_xs: List[float] = []

    current_t = start_time
    while current_t <= end_time:
        frame_idx = int(round(current_t * fps))
        cap.set(cv2.CAP_PROP_POS_FRAMES, frame_idx)
        ret, frame = cap.read()
        if not ret:
            break

        # Fast downscale for real-time tracking speed
        h, w = frame.shape[:2]
        target_w = 640
        target_h = int(round(h * 640.0 / w))
        small_frame = cv2.resize(frame, (target_w, target_h), interpolation=cv2.INTER_LINEAR)

        frame_rgb = cv2.cvtColor(small_frame, cv2.COLOR_BGR2RGB)
        faces = detect_faces_mediapipe(frame_rgb)
        if not faces:
            faces = detect_faces_opencv(small_frame)

        if faces:
            for f in faces:
                all_detected_xs.append(f[0])

            # Dominant face
            faces.sort(key=lambda f: f[2] * f[3], reverse=True)
            chosen_x = faces[0][0]
        else:
            chosen_x = 0.5

        chosen_x = max(0.15, min(0.85, chosen_x))
        single_centers.append((round(current_t, 2), chosen_x))
        current_t += sample_interval_sec

    cap.release()

    if not single_centers:
        single_centers = [(start_time, 0.5)]

    # Check for multi-speaker / podcast layout (distinct left & right clusters)
    is_podcast = False
    left_x = 0.25
    right_x = 0.75

    if len(all_detected_xs) >= 4:
        left_faces = [x for x in all_detected_xs if x < 0.48]
        right_faces = [x for x in all_detected_xs if x > 0.52]

        if len(left_faces) >= len(all_detected_xs) * 0.25 and len(right_faces) >= len(all_detected_xs) * 0.25:
            is_podcast = True
            left_x = float(np.median(left_faces))
            right_x = float(np.median(right_faces))

    return {
        "single_centers": single_centers,
        "is_podcast": is_podcast,
        "left_x": max(0.15, min(0.45, left_x)),
        "right_x": max(0.55, min(0.85, right_x))
    }

def calculate_smooth_crop(
    video_width: int,
    video_height: int,
    centers: List[Tuple[float, float]],
    target_aspect: str = "9:16",
    layout_mode: str = "single",
    left_x: float = 0.25,
    right_x: float = 0.75
) -> Dict[str, Any]:
    """
    Computes smoothed crop coordinates for 9:16 vertical video.
    Supports single speaker focus or stacked podcast split-screen.
    """
    if layout_mode == "podcast_split" and target_aspect == "9:16":
        half_h = video_height
        half_w = int(round(half_h * 1080.0 / 960.0))
        if half_w > video_width:
            half_w = video_width
        if half_w % 2 != 0:
            half_w -= 1

        top_pixel_x = int(round(left_x * video_width - half_w / 2.0))
        top_pixel_x = max(0, min(video_width - half_w, top_pixel_x))
        if top_pixel_x % 2 != 0:
            top_pixel_x = max(0, top_pixel_x - 1)

        bottom_pixel_x = int(round(right_x * video_width - half_w / 2.0))
        bottom_pixel_x = max(0, min(video_width - half_w, bottom_pixel_x))
        if bottom_pixel_x % 2 != 0:
            bottom_pixel_x = max(0, bottom_pixel_x - 1)

        return {
            "is_split": True,
            "crop_w": half_w,
            "crop_h": half_h,
            "top_x": top_pixel_x,
            "bottom_x": bottom_pixel_x,
            "target_aspect": "9:16",
            "filter_complex": (
                f"[0:v]crop={half_w}:{half_h}:{top_pixel_x}:0,scale=1080:960[vtop]; "
                f"[0:v]crop={half_w}:{half_h}:{bottom_pixel_x}:0,scale=1080:960[vbot]; "
                f"[vtop][vbot]vstack=inputs=2[vstacked]"
            )
        }

    # Standard single speaker reframe
    if target_aspect == "9:16":
        crop_h = video_height
        crop_w = int(round(video_height * 9.0 / 16.0))
        if crop_w % 2 != 0:
            crop_w -= 1
        if crop_w > video_width:
            crop_w = video_width
    elif target_aspect == "1:1":
        crop_h = min(video_width, video_height)
        crop_w = crop_h
        if crop_w % 2 != 0:
            crop_w -= 1
    elif target_aspect == "4:5":
        crop_h = video_height
        crop_w = int(round(video_height * 4.0 / 5.0))
        if crop_w % 2 != 0:
            crop_w -= 1
        if crop_w > video_width:
            crop_w = video_width
    else:  # 16:9
        crop_w = video_width
        crop_h = video_height

    max_x = max(0, video_width - crop_w)

    raw_xs = [c[1] for c in centers]
    smoothed_xs: List[float] = []
    current_smoothed = raw_xs[0]
    alpha = 0.35

    for x in raw_xs:
        current_smoothed = alpha * x + (1.0 - alpha) * current_smoothed
        smoothed_xs.append(current_smoothed)

    median_x = float(np.median(smoothed_xs))
    pixel_x = int(round(median_x * video_width - crop_w / 2.0))
    pixel_x = max(0, min(max_x, pixel_x))

    if pixel_x % 2 != 0:
        pixel_x = max(0, pixel_x - 1)

    return {
        "is_split": False,
        "crop_w": crop_w,
        "crop_h": crop_h,
        "crop_x": pixel_x,
        "crop_y": 0,
        "median_speaker_x": round(median_x, 3),
        "target_aspect": target_aspect,
        "filter_string": f"crop={crop_w}:{crop_h}:{pixel_x}:0"
    }
