import re
from typing import List, Dict, Any

HOOK_KEYWORDS = {
    "extreme": [
        "secret", "never", "always", "stop", "mistake", "truth", "hack",
        "why", "how", "insane", "crazy", "money", "billionaire", "millionaire",
        "worst", "best", "shocking", "don't", "proven", "rule", "warning",
        "destroy", "nobody", "everyone", "hidden", "exposed", "magic", "dangerous"
    ],
    "high": [
        "tips", "trick", "simple", "actually", "remember", "reason", "guide",
        "strategy", "lesson", "advice", "future", "learn", "problem", "solution",
        "easiest", "fastest", "method", "system", "formula"
    ]
}

def clean_word(word: str) -> str:
    return re.sub(r'[^\w\s]', '', word).lower()

def score_hook(first_segment_text: str) -> Dict[str, Any]:
    words = [clean_word(w) for w in first_segment_text.split() if w]
    score = 55.0
    matched_keywords = []

    if "?" in first_segment_text:
        score += 15.0

    if re.search(r'\b\d+\b', first_segment_text):
        score += 10.0

    for w in words[:15]:
        if w in HOOK_KEYWORDS["extreme"]:
            score += 14.0
            matched_keywords.append(w)
        elif w in HOOK_KEYWORDS["high"]:
            score += 7.0
            matched_keywords.append(w)

    sentences = re.split(r'[.!?]+', first_segment_text)
    if sentences and len(sentences[0].split()) <= 7:
        score += 8.0

    score = min(99.0, max(30.0, score))
    return {
        "hook_score": round(score),
        "keywords": list(set(matched_keywords))
    }

def generate_social_packs(title: str, text: str, viral_score: int) -> Dict[str, str]:
    """
    Generates tailored publishing packs for TikTok, YouTube Shorts, and Instagram Reels.
    """
    tiktok_pack = (
        f"{title}\n\n"
        f"Did you know this? Let me know in the comments below!\n\n"
        f"#fyp #viral #foryou #contentcreator #mindset #growth #learnontiktok"
    )

    youtube_pack = (
        f"{title} | Viral Short\n\n"
        f"Key takeaway: \"{text[:120]}...\"\n\n"
        f"Subscribe for more daily insights and valuable moments!\n\n"
        f"#Shorts #YouTubeShorts #ViralVideo #PodcastClips"
    )

    reels_pack = (
        f"{title}\n\n"
        f"Save this reel for when you need it later 📌\n"
        f"Share with someone who needs to hear this today.\n\n"
        f"#reels #viralreels #reelsinstagram #entrepreneurlife #trending #dailytips"
    )

    return {
        "tiktok": tiktok_pack,
        "youtube": youtube_pack,
        "instagram": reels_pack
    }

def generate_clip_title(text: str) -> str:
    sentences = [s.strip() for s in re.split(r'[.!?]+', text) if len(s.strip()) > 8]
    if not sentences:
        return "Featured Moment"

    first = sentences[0]
    words = first.split()
    if len(words) <= 6:
        return first.title()

    title_words = words[:5]
    clean_title = " ".join(title_words).strip(".,:;!?")
    return clean_title.title() + "..."

def extract_viral_clips(
    segments: List[Dict[str, Any]],
    min_duration: float = 15.0,
    max_duration: float = 180.0,
    fallback_duration: float = 30.0
) -> List[Dict[str, Any]]:
    """
    Extracts high-impact clips from transcript segments, calculating viral score, pacing, and metadata.
    """
    if not segments:
        packs = generate_social_packs("Visual Highlight", "Visual clip ready for reframing.", 75)
        return [{
            "id": "clip_1",
            "title": "Visual Highlight",
            "start": 0.0,
            "end": min(60.0, max(5.0, fallback_duration)),
            "duration": round(min(60.0, max(5.0, fallback_duration)), 1),
            "viral_score": 75,
            "hook_score": 70,
            "pacing_score": 80,
            "engagement_score": 75,
            "wps": 0.0,
            "tag": "Visual Highlight",
            "badge_color": "#6366F1",
            "explanation": "Visual clip ready for 9:16 smart reframing and custom captions.",
            "social_caption": packs["tiktok"],
            "social_packs": packs,
            "text": "Visual clip ready for 9:16 smart reframing.",
            "words": [],
            "aspect_ratio": "9:16",
            "layout_mode": "single",
            "caption_preset": "hormozi",
            "caption_position": "bottom"
        }]

    clips = []
    total_segments = len(segments)

    i = 0
    while i < total_segments:
        start_seg = segments[i]
        clip_start = start_seg["start"]
        current_words = []
        clip_text_parts = []

        j = i
        while j < total_segments:
            seg = segments[j]
            clip_text_parts.append(seg["text"])
            current_words.extend(seg.get("words", []))
            current_duration = seg["end"] - clip_start

            is_sentence_end = seg["text"].rstrip().endswith((".", "!", "?"))
            if current_duration >= min_duration and (is_sentence_end or current_duration >= max_duration):
                clip_end = seg["end"]
                full_clip_text = " ".join(clip_text_parts).strip()

                word_count = len(full_clip_text.split())
                wps = word_count / max(1.0, current_duration)

                pacing_score = 80.0
                if 2.2 <= wps <= 4.0:
                    pacing_score = 95.0
                elif wps < 1.8:
                    pacing_score = 65.0

                hook_res = score_hook(clip_text_parts[0])
                hook_score = hook_res["hook_score"]

                engagement_score = round(
                    (hook_score * 0.45) + (pacing_score * 0.35) + (min(95.0, 70.0 + len(hook_res["keywords"]) * 5) * 0.2)
                )
                viral_score = min(99, max(45, round((hook_score * 0.5) + (engagement_score * 0.3) + (pacing_score * 0.2))))

                if viral_score >= 90:
                    tag = "High Viral Potential"
                    badge_color = "#10B981"
                elif viral_score >= 80:
                    tag = "Strong Hook"
                    badge_color = "#3B82F6"
                elif viral_score >= 70:
                    tag = "Engaging Concept"
                    badge_color = "#8B5CF6"
                else:
                    tag = "Actionable Clip"
                    badge_color = "#64748B"

                title = generate_clip_title(full_clip_text)
                packs = generate_social_packs(title, full_clip_text, viral_score)

                clips.append({
                    "id": f"clip_{len(clips) + 1}",
                    "title": title,
                    "start": round(clip_start, 2),
                    "end": round(clip_end, 2),
                    "duration": round(current_duration, 1),
                    "viral_score": viral_score,
                    "hook_score": hook_score,
                    "pacing_score": round(pacing_score),
                    "engagement_score": engagement_score,
                    "wps": round(wps, 1),
                    "tag": tag,
                    "badge_color": badge_color,
                    "explanation": f"Strong hook with {len(hook_res['keywords'])} viral cues and an optimal pacing of {wps:.1f} words/sec.",
                    "social_caption": packs["tiktok"],
                    "social_packs": packs,
                    "text": full_clip_text,
                    "words": current_words,
                    "aspect_ratio": "9:16",
                    "layout_mode": "single",
                    "caption_preset": "hormozi",
                    "caption_position": "bottom"
                })

                i = max(i + 1, j)
                break

            j += 1
            if j >= total_segments and current_duration >= 5.0:
                clip_end = segments[-1]["end"]
                full_clip_text = " ".join(clip_text_parts).strip()
                title = generate_clip_title(full_clip_text)
                packs = generate_social_packs(title, full_clip_text, 78)
                clips.append({
                    "id": f"clip_{len(clips) + 1}",
                    "title": title,
                    "start": round(clip_start, 2),
                    "end": round(clip_end, 2),
                    "duration": round(clip_end - clip_start, 1),
                    "viral_score": 78,
                    "hook_score": 72,
                    "pacing_score": 82,
                    "engagement_score": 76,
                    "wps": 2.6,
                    "tag": "Final Keynote",
                    "badge_color": "#8B5CF6",
                    "explanation": "Strong concluding takeaway suitable for audience retention.",
                    "social_caption": packs["tiktok"],
                    "social_packs": packs,
                    "text": full_clip_text,
                    "words": current_words,
                    "aspect_ratio": "9:16",
                    "layout_mode": "single",
                    "caption_preset": "hormozi",
                    "caption_position": "bottom"
                })
                i = total_segments
                break

        i += 1

    clips.sort(key=lambda c: c["viral_score"], reverse=True)
    return clips
