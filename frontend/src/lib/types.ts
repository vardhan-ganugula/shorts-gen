export interface WordItem {
  word: string;
  start: number;
  end: number;
  probability?: number;
}

export interface SegmentItem {
  id: number;
  start: number;
  end: number;
  text: string;
  words: WordItem[];
}

export interface ClipItem {
  id: string;
  title: string;
  start: number;
  end: number;
  duration: number;
  viral_score: number;
  hook_score: number;
  pacing_score: number;
  engagement_score: number;
  tag: string;
  badge_color: string;
  explanation: string;
  social_caption?: string;
  social_packs?: {
    tiktok: string;
    youtube: string;
    instagram: string;
  };
  text: string;
  words: WordItem[];
  aspect_ratio: string;
  layout_mode?: 'single' | 'podcast_split';
  caption_preset: string;
  caption_position?: string;
  enable_emojis?: boolean;
  enable_keyword_colors?: boolean;
  font_scale?: number;
  wps?: number;
}

export interface ProjectItem {
  id: string;
  title: string;
  description?: string;
  channel?: string;
  thumbnail?: string;
  source: string;
  video_url: string;
  video_path: string;
  status: 'queued' | 'downloading' | 'analyzing_media' | 'transcribing' | 'scoring_virality' | 'ready' | 'error';
  progress: number;
  error_message?: string;
  clips: ClipItem[];
  clip_count: number;
  created_at: number;
  probe?: {
    duration: number;
    width: number;
    height: number;
    fps: number;
    is_vertical: boolean;
  };
  transcript?: {
    duration: number;
    language: string;
    full_text: string;
    segments: SegmentItem[];
    words: WordItem[];
  };
}
