import os
import re
import unicodedata
from typing import List, Dict, Any, Optional

STYLE_PRESETS = {
    "hormozi": {
        "name": "Alex Hormozi Pro",
        "description": "Bold yellow active bounce with solid black outline & keyword pop",
        "fontname": "Arial",
        "fontsize": 27,
        "primary_color": "&H00FFFFFF",     # White
        "highlight_color": "&H0000FFFF",   # Bright Yellow
        "number_color": "&H0000FF00",      # Green for numbers/money
        "urgent_color": "&H000033FF",      # Red for urgent warnings
        "outline_color": "&H00000000",     # Solid black
        "outline": 4,
        "shadow": 2,
        "bold": 1,
        "uppercase": True,
        "alignment": 2,                    # Bottom Center
        "margin_v": 90,
        "chunk_size": 3,
        "bounce": True
    },
    "beast": {
        "name": "MrBeast Explosive",
        "description": "High contrast yellow & fire red with animated emoji pop",
        "fontname": "Arial",
        "fontsize": 29,
        "primary_color": "&H0000FFFF",     # Yellow base
        "highlight_color": "&H000000FF",   # Fire Red active
        "number_color": "&H0000FF00",      # Green
        "urgent_color": "&H000000FF",      # Red
        "outline_color": "&H00000000",
        "outline": 5,
        "shadow": 3,
        "bold": 1,
        "uppercase": True,
        "alignment": 2,
        "margin_v": 95,
        "chunk_size": 3,
        "bounce": True
    },
    "neon": {
        "name": "Cyber Neon Glow",
        "description": "Futuristic cyan base with hot magenta active pulsing",
        "fontname": "Arial",
        "fontsize": 26,
        "primary_color": "&H00FFFF00",     # Cyan
        "highlight_color": "&H00FF00FF",   # Magenta / Pink
        "number_color": "&H0000FF00",      # Green
        "urgent_color": "&H000000FF",
        "outline_color": "&H00000000",
        "outline": 3,
        "shadow": 1,
        "bold": 1,
        "uppercase": True,
        "alignment": 2,
        "margin_v": 90,
        "chunk_size": 4,
        "bounce": True
    },
    "clean": {
        "name": "Ali Abdaal Clean",
        "description": "Elegant white sans-serif with soft gold highlights",
        "fontname": "Arial",
        "fontsize": 23,
        "primary_color": "&H00FFFFFF",
        "highlight_color": "&H0000D4FF",   # Soft Gold
        "number_color": "&H0050E3C2",      # Soft Mint
        "urgent_color": "&H004A90E2",
        "outline_color": "&H00181818",
        "outline": 2,
        "shadow": 1,
        "bold": 0,
        "uppercase": False,
        "alignment": 2,
        "margin_v": 80,
        "chunk_size": 5,
        "bounce": False
    }
}

# Initialize before aliases; the base English mapping is declared below.
EMOJI_KEYWORDS = {}

# Hindi and Urdu keyword aliases. These are deliberately data-only aliases;
# the same detector can be extended with additional language packs later.
EMOJI_KEYWORDS.update({
    "\u092a\u0948\u0938\u093e": "\U0001F4B0", "\u092a\u0948\u0938\u0947": "\U0001F4B0",
    "\u0927\u0928": "\U0001F4B0", "\u0926\u094c\u0932\u0924": "\U0001F4B0",
    "\u067e\u06cc\u0633\u06c1": "\U0001F4B0", "\u067e\u06cc\u0633\u06d2": "\U0001F4B0", "\u062f\u0648\u0644\u062a": "\U0001F4B0",
    "\u0906\u0917": "\U0001F525", "\u0622\u06af": "\U0001F525",
    "\u092a\u093e\u0917\u0932": "\U0001F92F", "\u067e\u0627\u06af\u0644": "\U0001F92F",
    "\u0938\u092b\u0932\u0924\u093e": "\U0001F680", "\u0915\u093e\u092e\u092f\u093e\u092c\u0940": "\U0001F680", "\u06a9\u0627\u0645\u06cc\u0627\u0628\u06cc": "\U0001F680",
    "\u091a\u0947\u0924\u093e\u0935\u0928\u0940": "\u26A0\uFE0F", "\u062e\u0628\u0631\u062f\u0627\u0631": "\u26A0\uFE0F",
    "\u0930\u0941\u0915\u094b": "\U0001F6D1", "\u0930\u0941\u0915\u093f\u090f": "\U0001F6D1", "\u0631\u06a9\u0648": "\U0001F6D1", "\u0631\u06a9\u06cc\u06ba": "\U0001F6D1",
    "\u0916\u0924\u0930\u093e": "\U0001F6A8", "\u062e\u0637\u0631\u06c1": "\U0001F6A8",
    "\u0927\u094d\u092f\u093e\u0928": "\U0001F440", "\u062a\u0648\u062c\u06c1": "\U0001F440",
    "\u092c\u0922\u093c\u0928\u093e": "\U0001F4C8", "\u0935\u093f\u0915\u093e\u0938": "\U0001F4C8", "\u062a\u0631\u0642\u06cc": "\U0001F4C8",
    "\u0924\u0947\u091c": "\u26A1", "\u062a\u06cc\u0632": "\u26A1", "\u0938\u0935\u093e\u0932": "\u2753", "\u0633\u0648\u0627\u0644": "\u2753",
    "\u0938\u091a": "\U0001F50D", "\u0633\u0686": "\U0001F50D", "\u0926\u0941\u0928\u093f\u092f\u093e": "\U0001F30D", "\u062f\u0646\u06cc\u0627": "\U0001F30D",
})

EMOJI_KEYWORDS = {
    # Money & Business
    "money": "💰", "dollar": "💵", "dollars": "💵", "cash": "💸", "rich": "🤑", "wealth": "💎",
    "cost": "🏷️", "price": "🏷️", "pay": "💳", "buy": "🛍️", "business": "💼", "invest": "📈",
    # Reactions & Mindset
    "fire": "🔥", "crazy": "🤯", "insane": "🤯", "mindblown": "🤯", "secret": "🤫", "hidden": "🤫",
    "smart": "🧠", "brain": "🧠", "neural": "🧠", "think": "🤔", "idea": "💡", "learn": "📚",
    # Urgency & Attention
    "warning": "⚠️", "stop": "🛑", "danger": "🚨", "alert": "🔔", "attention": "👀", "look": "👀",
    # Success & Growth
    "win": "🏆", "winner": "🏆", "best": "🥇", "success": "🚀", "grow": "📈", "scale": "📈",
    "fast": "⚡", "power": "⚡", "love": "❤️", "great": "🌟", "magic": "✨",
    # Health & Lifestyle
    "sleep": "😴", "tired": "🥱", "energy": "⚡", "eat": "🥗", "food": "🍔", "drink": "🥤",
    "water": "💧", "body": "💪", "gym": "🏋️", "health": "❤️",
    # Time & Questions
    "time": "⏳", "clock": "⏰", "now": "⏱️", "year": "📅", "day": "☀️", "night": "🌙",
    "question": "❓", "truth": "🔍", "rule": "📜", "life": "🌱", "world": "🌍"
}

# Hindi and Urdu aliases are applied after the base English mapping exists.
EMOJI_KEYWORDS.update({
    "\u092a\u0948\u0938\u093e": "\U0001F4B0", "\u092a\u0948\u0938\u0947": "\U0001F4B0", "\u0927\u0928": "\U0001F4B0", "\u0926\u094c\u0932\u0924": "\U0001F4B0",
    "\u067e\u06cc\u0633\u06c1": "\U0001F4B0", "\u067e\u06cc\u0633\u06d2": "\U0001F4B0", "\u062f\u0648\u0644\u062a": "\U0001F4B0",
    "\u0906\u0917": "\U0001F525", "\u0622\u06af": "\U0001F525", "\u092a\u093e\u0917\u0932": "\U0001F92F", "\u067e\u0627\u06af\u0644": "\U0001F92F",
    "\u0938\u092b\u0932\u0924\u093e": "\U0001F680", "\u0915\u093e\u092e\u092f\u093e\u0628\u0940": "\U0001F680", "\u06a9\u0627\u0645\u06cc\u0627\u0628\u06cc": "\U0001F680",
    "\u091a\u0947\u0924\u0627\u0648\u0646\u06cc": "\u26A0\uFE0F", "\u062e\u0628\u0631\u062f\u0627\u0631": "\u26A0\uFE0F", "\u0930\u0941\u06a9\u064b": "\U0001F6D1", "\u0631\u06a9\u0648": "\U0001F6D1",
    "\u0916\u0637\u0631\u0627": "\U0001F6A8", "\u062e\u0637\u0631\u06c1": "\U0001F6A8", "\u0927\u094d\u092f\u093e\u0928": "\U0001F440", "\u062a\u0648\u062c\u06c1": "\U0001F440",
    "\u092c\u0922\u093c\u0928\u0627": "\U0001F4C8", "\u0935\u093f\u0915\u093e\u0938": "\U0001F4C8", "\u062a\u0631\u0642\u06cc": "\U0001F4C8", "\u0924\u0947\u091c": "\u26A1", "\u062a\u06cc\u0632": "\u26A1",
    "\u0938\u0935\u0627\u0644": "\u2753", "\u0633\u0648\u0627\u0644": "\u2753", "\u0938\u091a": "\U0001F50D", "\u0633\u0686": "\U0001F50D", "\u0926\u0941\u0928\u093f\u092f\u093e": "\U0001F30D", "\u062f\u0646\u06cc\u0627": "\U0001F30D",
})

URGENT_WORDS = {
    "never", "stop", "worst", "mistake", "warning", "destroy", "avoid", "danger",
    "fake", "hate", "kill", "bad", "wrong", "trap", "fail", "failure", "crisis",
    "tired", "sinister", "problem", "critical", "urgent", "huge",
    "\u0915\092d\0940", "\u0930\0941\0915\094b", "\u0917\0932\0924", "\u091a\0947\0924\093e\0935\0928\0940", "\u0916\0924\0930\093e",
    "\u092c\091a\094b", "\u0928\0915\0932\0940", "\u0935\093f\092b\0932", "\u0938\0902\0915\091f", "\u0938\092e\0938\094d\092f\093e",
    "\u0631\06a9\0648", "\u063a\0644\0637", "\u062e\0628\0631\062f\0627\0631", "\u062e\0637\0631\06c1", "\u0628\0686\06cc\06ba",
    "\u0646\0642\0644\06cc", "\u0646\0627\06a9\0627\0645", "\u0628\062d\0631\0627\0646", "\u0645\0633\0626\0644\06c1"
}

CURRENCY_WORDS = {
    "money", "cash", "dollar", "dollars", "usd", "euro", "euros",
    "eur", "pound", "pounds", "gbp", "rupee", "rupees", "inr",
    "\u092a\0948\u0938\093e", "\u092a\0948\0938\093e", "\u092a\0948\0938\0947", "\u0927\0928", "\u0926\094c\0932\0924",
    "\u067e\06cc\0633\06c1", "\u067e\06cc\0633\06d2", "\u062f\0648\0644\062a"
}

def format_ass_time(seconds: float) -> str:
    """Format seconds into ASS timestamp: H:MM:SS.cs"""
    h = int(seconds // 3600)
    m = int((seconds % 3600) // 60)
    s = int(seconds % 60)
    cs = int(round((seconds - int(seconds)) * 100))
    if cs >= 100:
        s += 1
        cs = 0
    return f"{h}:{m:02d}:{s:02d}.{cs:02d}"

def is_number_word(word: str) -> bool:
    clean = re.sub(r'[\$€£₹₽₺₩¥,%]', '', word)
    return bool(re.search(r'\d', clean))

def normalize_keyword(word: str) -> str:
    return unicodedata.normalize("NFKC", word).replace("\u200c", "").replace("\u200d", "").lower().strip(".,!?:;\"'()[]{}")

def keyword_color(word: str, preset: Dict[str, Any], enabled: bool) -> str:
    """Return a semantic keyword color, or the preset's normal color."""
    if not enabled:
        return preset["primary_color"]

    clean = normalize_keyword(word)
    if is_number_word(clean) or clean in CURRENCY_WORDS:
        return preset.get("number_color", preset["primary_color"])
    if clean.lstrip("$") in URGENT_WORDS:
        return preset.get("urgent_color", preset["primary_color"])
    return preset["primary_color"]

def ass_color(color: str) -> str:
    """ASS override colors require a trailing ampersand."""
    return color if color.endswith("&") else f"{color}&"

def generate_ass_subtitles(
    words: List[Dict[str, Any]],
    clip_start_offset: float,
    output_ass_path: str,
    preset_name: str = "hormozi",
    video_width: int = 1080,
    video_height: int = 1920,
    vertical_position: str = "bottom",
    enable_emojis: bool = True,
    enable_keyword_colors: bool = True,
    font_scale: float = 1.0
) -> str:
    """
    Generates high-retention ASS subtitle file with dynamic active word pop,
    keyword color differentiation, and auto-emoji injection.
    """
    preset = STYLE_PRESETS.get(preset_name.lower(), STYLE_PRESETS["hormozi"]).copy()
    fontsize = int(round(preset["fontsize"] * font_scale))

    margin_v = preset["margin_v"]
    alignment = 2  # Bottom Center
    if vertical_position == "middle":
        alignment = 5  # Middle Center
        margin_v = 0
    elif vertical_position == "top":
        alignment = 8  # Top Center
        margin_v = 110

    header = f"""[Script Info]
Title: Klap Dynamic Dynamic Subtitles
ScriptType: v4.00+
PlayResX: {video_width}
PlayResY: {video_height}
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: KlapStyle,{preset['fontname']},{fontsize},{preset['primary_color']},{preset['highlight_color']},{preset['outline_color']},{preset['outline_color']},{preset['bold']},0,0,0,100,100,0,0,1,{preset['outline']},{preset['shadow']},{alignment},30,30,{margin_v},1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""

    events = []
    chunk_size = preset.get("chunk_size", 3)

    if not words:
        with open(output_ass_path, "w", encoding="utf-8") as f:
            f.write(header)
        return output_ass_path

    sorted_words = sorted(words, key=lambda w: float(w.get("start", 0)))

    for i in range(0, len(sorted_words), chunk_size):
        chunk = sorted_words[i:i + chunk_size]
        if not chunk:
            continue

        for active_idx, active_word in enumerate(chunk):
            w_start = max(0.0, float(active_word.get("start", 0.0)) - clip_start_offset)
            w_end = max(w_start + 0.12, float(active_word.get("end", 0.0)) - clip_start_offset)

            # Keep seamless flow between words
            if active_idx + 1 < len(chunk):
                next_start = max(0.0, float(chunk[active_idx + 1].get("start", 0.0)) - clip_start_offset)
                if next_start > w_start:
                    w_end = min(w_end, next_start)

            formatted_tokens = []
            for idx, w in enumerate(chunk):
                raw = str(w.get("word", "")).strip()
                if not raw:
                    continue

                display_word = raw.upper() if preset["uppercase"] else raw
                lower_clean = normalize_keyword(raw)

                # Preserve semantic colors even while a keyword is active.
                default_color = keyword_color(raw, preset, enable_keyword_colors)
                active_color = default_color if default_color != preset["primary_color"] else preset["highlight_color"]

                # Context emoji injection
                if enable_emojis:
                    if lower_clean in EMOJI_KEYWORDS:
                        # Arial is used for the normal caption text, but does
                        # not contain emoji glyphs on most systems.
                        display_word += f" {{\\fnSegoe UI Emoji}}{EMOJI_KEYWORDS[lower_clean]}{{\\fn{preset['fontname']}}}"

                if idx == active_idx:
                    # Pop animation: 115% scale with highlight color
                    pop_tag = "\\fscx115\\fscy115" if preset.get("bounce") else "\\fscx108\\fscy108"
                    formatted_tokens.append(f"{{\\c{ass_color(active_color)}{pop_tag}}}{display_word}{{\\c{ass_color(preset['primary_color'])}\\fscx100\\fscy100}}")
                else:
                    if default_color != preset["primary_color"]:
                        formatted_tokens.append(f"{{\\c{ass_color(default_color)}}}{display_word}{{\\c{ass_color(preset['primary_color'])}}}")
                    else:
                        formatted_tokens.append(display_word)

            if formatted_tokens:
                line_text = " ".join(formatted_tokens)
                events.append(f"Dialogue: 0,{format_ass_time(w_start)},{format_ass_time(w_end)},KlapStyle,,0,0,0,,{line_text}")

    with open(output_ass_path, "w", encoding="utf-8") as f:
        f.write(header)
        f.write("\n".join(events))
        f.write("\n")

    return output_ass_path
