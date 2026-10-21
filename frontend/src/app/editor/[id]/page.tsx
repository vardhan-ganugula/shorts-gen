'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { 
  ArrowLeft, Play, Pause, Download, Sparkles, Sliders, Type, 
  Smartphone, Square, Monitor, Check, Loader2, Scissors, Edit3, 
  Smile, Palette, Users, Share2, Save
} from 'lucide-react';
import { ProjectItem, ClipItem, WordItem } from '@/lib/types';
import SocialPacksModal from '@/components/SocialPacksModal';

const PREVIEW_EMOJIS: Record<string, string> = {
  money: '\u{1F4B0}', cash: '\u{1F4B8}', dollar: '\u{1F4B5}', dollars: '\u{1F4B5}',
  fire: '\u{1F525}', crazy: '\u{1F92F}', insane: '\u{1F92F}', mindblown: '\u{1F92F}',
  success: '\u{1F680}', win: '\u{1F3C6}', winner: '\u{1F3C6}', best: '\u{1F947}',
  grow: '\u{1F4C8}', scale: '\u{1F4C8}', fast: '\u26A1', power: '\u26A1',
  warning: '\u26A0\uFE0F', stop: '\u{1F6D1}', danger: '\u{1F6A8}', alert: '\u{1F514}',
  attention: '\u{1F440}', look: '\u{1F440}', secret: '\u{1F92B}', hidden: '\u{1F92B}',
};

Object.assign(PREVIEW_EMOJIS, {
  '\u092a\u0948\u0938\u093e': '\u{1F4B0}', '\u092a\u0948\u0938\u0947': '\u{1F4B0}',
  '\u0927\u0928': '\u{1F4B0}', '\u0926\u094c\u0932\u0924': '\u{1F4B0}',
  '\u067e\u06cc\u0633\u06c1': '\u{1F4B0}', '\u067e\u06cc\u0633\u06d2': '\u{1F4B0}', '\u062f\u0648\u0644\u062a': '\u{1F4B0}',
  '\u0906\u0917': '\u{1F525}', '\u0622\u06af': '\u{1F525}',
  '\u092a\u093e\u0917\u0932': '\u{1F92F}', '\u067e\u0627\u06af\u0644': '\u{1F92F}',
  '\u0938\u092b\u0932\u0924\u093e': '\u{1F680}', '\u0915\u093e\u092e\u092f\u093e\u092c\u0940': '\u{1F680}', '\u06a9\u0627\u0645\u06cc\u0627\u0628\u06cc': '\u{1F680}',
  '\u091a\u0947\u0924\u093e\u0935\u0928\u0940': '\u26A0\uFE0F', '\u062e\u0628\u0631\u062f\u0627\u0631': '\u26A0\uFE0F',
  '\u0930\u0941\u0915\u064b': '\u{1F6D1}', '\u0631\u06a9\u0648': '\u{1F6D1}', '\u0631\u06a9\u06cc\u06ba': '\u{1F6D1}',
  '\u0916\u0924\u0930\u093e': '\u{1F6A8}', '\u062e\u0637\u0631\u06c1': '\u{1F6A8}',
  '\u0927\u094d\u092f\u093e\u0928': '\u{1F440}', '\u062a\u0648\u062c\u06c1': '\u{1F440}',
  '\u092c\u0922\u093c\u0928\u093e': '\u{1F4C8}', '\u0935\u093f\u0915\u093e\u0938': '\u{1F4C8}', '\u062a\u0631\u0642\u06cc': '\u{1F4C8}',
  '\u0924\u0947\u091c': '\u26A1', '\u062a\u06cc\u0632': '\u26A1', '\u0938\u0935\u093e\u0932': '\u2753', '\u0633\u0648\u0627\u0644': '\u2753',
});

const PREVIEW_URGENT_WORDS = new Set([
  'never', 'stop', 'worst', 'mistake', 'warning', 'destroy', 'avoid', 'danger',
  'fake', 'hate', 'kill', 'bad', 'wrong', 'trap', 'fail', 'failure', 'crisis',
  'tired', 'sinister', 'problem', 'critical', 'urgent', 'huge',
  '\u0915\u092d\u0940', '\u0930\u0941\u0915\u064b', '\u0917\u0932\u0924', '\u091a\u0947\u0924\u093e\u0935\u0928\u0940', '\u0916\u0924\u0930\u093e',
  '\u092c\u091a\u094b', '\u0928\u0915\u0932\u0940', '\u0935\u093f\u092b\u0932', '\u0938\u0902\u0915\u091f', '\u0938\u092e\u0938\u094d\u092f\u093e',
  '\u0631\u06a9\u0648', '\u063a\u0644\u0637', '\u062e\u0628\u0631\u062f\u0627\u0631', '\u062e\u0637\u0631\u06c1', '\u0628\u0686\u06cc\u06ba',
  '\u0646\u0642\u0644\u06cc', '\u0646\u0627\u06a9\u0627\u0645', '\u0628\u062d\u0631\u0627\u0646', '\u0645\u0633\u0626\u0644\u06c1',
]);

const PREVIEW_CURRENCY_WORDS = new Set([
  'money', 'cash', 'dollar', 'dollars', 'usd', 'euro', 'euros', 'eur',
  'pound', 'pounds', 'gbp', 'rupee', 'rupees', 'inr',
  '\u092a\u0948\u0938\u0627', '\u092a\u0948\u0938\u0947', '\u0927\u0928', '\u0926\u094c\u0932\u0924',
  '\u067e\u06cc\u0633\u06c1', '\u067e\u06cc\u0633\u06d2', '\u062f\u0648\u0644\u062a',
]);

function previewWordKey(word: string): string {
  return word.toLowerCase().trim().replace(/[\u200c\u200d]/g, '').replace(/^[.,!?;:'\"([{]+|[.,!?;:'\"\])}]+$/g, '');
}

function previewEmoji(word: string): string {
  return PREVIEW_EMOJIS[previewWordKey(word)] || '';
}

function previewKeywordColor(word: string, enabled: boolean): string | undefined {
  if (!enabled) return undefined;
  const clean = previewWordKey(word);
  if (/[$€£₹%]?\d/.test(clean) || PREVIEW_CURRENCY_WORDS.has(clean)) return '#22c55e';
  if (PREVIEW_URGENT_WORDS.has(clean)) return '#ef4444';
  return undefined;
}

export default function EditorPage({ params }: { params: { id: string } }) {
  const searchParams = useSearchParams();
  const initialClipId = searchParams.get('clip');

  const [project, setProject] = useState<ProjectItem | null>(null);
  const [selectedClip, setSelectedClip] = useState<ClipItem | null>(null);
  const [loading, setLoading] = useState(true);

  // Studio configuration states
  const [startTime, setStartTime] = useState<number>(0);
  const [endTime, setEndTime] = useState<number>(0);
  const [aspectRatio, setAspectRatio] = useState<string>('9:16');
  const [layoutMode, setLayoutMode] = useState<'single' | 'podcast_split'>('single');
  const [captionPreset, setCaptionPreset] = useState<string>('hormozi');
  const [captionPosition, setCaptionPosition] = useState<string>('bottom');
  const [enableEmojis, setEnableEmojis] = useState<boolean>(true);
  const [enableKeywordColors, setEnableKeywordColors] = useState<boolean>(true);
  const [fontScale, setFontScale] = useState<number>(1.0);

  // Playback & words
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [editableWords, setEditableWords] = useState<WordItem[]>([]);
  const [editingWordIdx, setEditingWordIdx] = useState<number | null>(null);
  const [editingWordText, setEditingWordText] = useState<string>('');

  // Export & Social Modal
  const [rendering, setRendering] = useState<boolean>(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [showSocialModal, setShowSocialModal] = useState<boolean>(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const secondaryVideoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    fetchProject();
  }, [params.id]);

  const fetchProject = async () => {
    try {
      const res = await fetch(`/api/projects/${params.id}`);
      const data = await res.json();
      setProject(data);

      if (data.clips && data.clips.length > 0) {
        const found = data.clips.find((c: ClipItem) => c.id === initialClipId) || data.clips[0];
        initClip(found);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const initClip = (clip: ClipItem) => {
    setSelectedClip(clip);
    setStartTime(clip.start);
    setEndTime(clip.end);
    setAspectRatio(clip.aspect_ratio || '9:16');
    setLayoutMode(clip.layout_mode || 'single');
    setCaptionPreset(clip.caption_preset || 'hormozi');
    setCaptionPosition(clip.caption_position || 'bottom');
    setEnableEmojis(clip.enable_emojis ?? true);
    setEnableKeywordColors(clip.enable_keyword_colors ?? true);
    setFontScale(clip.font_scale ?? 1.0);
    setEditableWords(clip.words || []);
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const t = videoRef.current.currentTime;
      setCurrentTime(t);
      if (secondaryVideoRef.current) {
        secondaryVideoRef.current.currentTime = t;
      }
      if (t >= endTime) {
        videoRef.current.currentTime = startTime;
        if (secondaryVideoRef.current) {
          secondaryVideoRef.current.currentTime = startTime;
        }
      }
    }
  };

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      if (videoRef.current.currentTime < startTime || videoRef.current.currentTime >= endTime) {
        videoRef.current.currentTime = startTime;
      }
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  // Click-to-edit word in transcript
  const handleWordClick = (idx: number) => {
    setEditingWordIdx(idx);
    setEditingWordText(editableWords[idx].word);
  };

  const handleSaveWordEdit = async () => {
    if (editingWordIdx === null || !selectedClip) return;
    const updated = [...editableWords];
    updated[editingWordIdx] = {
      ...updated[editingWordIdx],
      word: editingWordText.trim(),
    };
    setEditableWords(updated);
    setEditingWordIdx(null);

    // Persist to backend
    try {
      await fetch(`/api/projects/${params.id}/clips/${selectedClip.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          words: updated,
          text: updated.map((w) => w.word).join(' '),
        }),
      });
    } catch (e) {
      console.error('Failed to save word edit', e);
    }
  };

  const handleExport = async () => {
    if (!selectedClip) return;
    setRendering(true);
    setDownloadUrl(null);

    try {
      const res = await fetch(`/api/projects/${params.id}/render`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clip_id: selectedClip.id,
          start_time: startTime,
          end_time: endTime,
          aspect_ratio: aspectRatio,
          layout_mode: layoutMode,
          caption_preset: captionPreset,
          caption_position: captionPosition,
          enable_emojis: enableEmojis,
          enable_keyword_colors: enableKeywordColors,
          font_scale: fontScale,
        }),
      });

      const data = await res.json();

      // Cached render returns download_url immediately
      if (data.success && data.download_url) {
        setDownloadUrl(data.download_url);
        setRendering(false);
        return;
      }

      // Poll render-status until done
      if (data.success && (data.status === 'queued' || data.status === 'rendering')) {
        const pollInterval = setInterval(async () => {
          try {
            const statusRes = await fetch(`/api/projects/${params.id}/render-status/${selectedClip.id}`);
            const statusData = await statusRes.json();
            if (statusData.status === 'done' && statusData.download_url) {
              clearInterval(pollInterval);
              setDownloadUrl(statusData.download_url);
              setRendering(false);
            } else if (statusData.status === 'error') {
              clearInterval(pollInterval);
              console.error('Export render error:', statusData.error);
              setRendering(false);
            }
          } catch {
            clearInterval(pollInterval);
            setRendering(false);
          }
        }, 2000);
        return;
      }
    } catch (e) {
      console.error('Export failed', e);
    }
    setRendering(false);
  };

  // Find active word for live subtitle preview
  const activeWord = editableWords.find(
    (w) => w.start <= currentTime && currentTime <= w.end
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500 mb-2" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-background p-8 text-center text-white">
        Project not found. <Link href="/spaces?task=shorts" className="text-indigo-400 underline">Back to Spaces</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top Bar */}
      <header className="h-14 border-b border-cardBorder bg-surface px-6 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-4">
          <Link
            href="/spaces?task=shorts"
            className="flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Spaces
          </Link>
          <div className="h-4 w-px bg-cardBorder" />
          <h1 className="text-sm font-bold text-white line-clamp-1 max-w-md">
            {selectedClip ? selectedClip.title : project.title}
          </h1>
        </div>

        <div className="flex items-center gap-3">
          {selectedClip && (
            <button
              onClick={() => setShowSocialModal(true)}
              className="px-3 py-1.5 bg-surfaceLight hover:bg-cardBorder text-slate-200 text-xs font-semibold rounded-xl flex items-center gap-1.5 border border-cardBorder transition-colors"
            >
              <Share2 className="w-3.5 h-3.5 text-indigo-400" />
              Social Pack
            </button>
          )}

          {downloadUrl ? (
            <a
              href={downloadUrl}
              download
              className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              Download MP4
            </a>
          ) : (
            <button
              onClick={handleExport}
              disabled={rendering}
              className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-lg shadow-indigo-600/20 transition-all"
            >
              {rendering ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Rendering Video...
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  Export Short (MP4)
                </>
              )}
            </button>
          )}
        </div>
      </header>

      {/* Main Studio Body */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
        {/* Left: Clips Switcher */}
        <div className="lg:col-span-3 border-r border-cardBorder bg-surface p-4 overflow-y-auto max-h-[calc(100vh-3.5rem)] space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
            AI Generated Clips ({project.clips?.length || 0})
          </h2>

          <div className="space-y-2">
            {project.clips?.map((c) => (
              <div
                key={c.id}
                onClick={() => {
                  initClip(c);
                  if (videoRef.current) {
                    videoRef.current.currentTime = c.start;
                  }
                }}
                className={`p-3 rounded-xl border cursor-pointer transition-all ${
                  selectedClip?.id === c.id
                    ? 'bg-surfaceLight border-indigo-500 shadow-md'
                    : 'bg-surfaceLight/30 border-cardBorder hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span
                    className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded"
                    style={{ backgroundColor: `${c.badge_color}20`, color: c.badge_color }}
                  >
                    Score {c.viral_score}
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium">{c.duration}s</span>
                </div>
                <h4 className="text-xs font-bold text-white line-clamp-1">{c.title}</h4>
                <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">"{c.text}"</p>
              </div>
            ))}
          </div>
        </div>

        {/* Center: Live Video Player Preview & Interactive Transcript */}
        <div className="lg:col-span-5 bg-background p-6 flex flex-col items-center justify-between overflow-y-auto max-h-[calc(100vh-3.5rem)]">
          {/* Player Container */}
          <div
            className={`relative bg-black rounded-2xl overflow-hidden shadow-2xl border border-cardBorder transition-all flex items-center justify-center ${
              aspectRatio === '9:16'
                ? 'aspect-[9/16] w-[280px] sm:w-[310px] max-h-[520px]'
                : aspectRatio === '1:1'
                ? 'aspect-square w-[340px]'
                : 'aspect-video w-[480px]'
            }`}
          >
            {layoutMode === 'podcast_split' && aspectRatio === '9:16' ? (
              /* Stacked Podcast preview */
              <div className="w-full h-full flex flex-col">
                <div className="flex-1 relative overflow-hidden border-b border-indigo-500/40">
                  <video
                    ref={videoRef}
                    src={project.video_url}
                    onTimeUpdate={handleTimeUpdate}
                    onClick={togglePlay}
                    className="w-full h-full object-cover object-left cursor-pointer"
                  />
                  <div className="absolute top-2 left-2 px-2 py-0.5 bg-black/70 rounded text-[9px] font-bold text-white uppercase">
                    Host (Left)
                  </div>
                </div>
                <div className="flex-1 relative overflow-hidden">
                  <video
                    ref={secondaryVideoRef}
                    src={project.video_url}
                    className="w-full h-full object-cover object-right pointer-events-none"
                  />
                  <div className="absolute top-2 left-2 px-2 py-0.5 bg-black/70 rounded text-[9px] font-bold text-white uppercase">
                    Guest (Right)
                  </div>
                </div>
              </div>
            ) : (
              /* Single Speaker Preview */
              <video
                ref={videoRef}
                src={project.video_url}
                onTimeUpdate={handleTimeUpdate}
                onClick={togglePlay}
                className="w-full h-full object-cover cursor-pointer"
              />
            )}

            {/* In-Player Play / Pause button overlay */}
            <button
              onClick={togglePlay}
              className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 hover:opacity-100 transition-opacity"
            >
              <div className="w-14 h-14 rounded-full bg-indigo-600/90 text-white flex items-center justify-center shadow-lg">
                {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-1" />}
              </div>
            </button>

            {/* Dynamic Captions Live Overlay Preview */}
            <div
              className={`absolute left-0 right-0 px-4 text-center pointer-events-none transition-all ${
                captionPosition === 'top'
                  ? 'top-8'
                  : captionPosition === 'middle'
                  ? 'top-1/2 -translate-y-1/2'
                  : 'bottom-8'
              }`}
            >
              {activeWord ? (
                <div
                    style={{
                      transform: `scale(${fontScale})`,
                      color: previewKeywordColor(activeWord.word, enableKeywordColors),
                    }}
                  className={`inline-block font-extrabold uppercase tracking-wide drop-shadow-lg px-3 py-1.5 rounded-lg transition-transform ${
                    captionPreset === 'hormozi'
                      ? 'text-yellow-400 bg-black/70 text-lg sm:text-xl border border-yellow-400/30'
                      : captionPreset === 'neon'
                      ? 'text-pink-400 bg-black/70 text-lg sm:text-xl border border-cyan-400/50'
                      : captionPreset === 'beast'
                      ? 'text-red-500 bg-yellow-400 font-black text-xl sm:text-2xl shadow-xl'
                      : 'text-white bg-black/50 text-base'
                  }`}
                >
                  {activeWord.word}
                    {enableEmojis && previewEmoji(activeWord.word) ? ` ${previewEmoji(activeWord.word)}` : ''}
                </div>
              ) : (
                <div className="text-slate-400 text-xs italic bg-black/50 px-2.5 py-1 rounded-full inline-block">
                  [Captions preview]
                </div>
              )}
            </div>
          </div>

          {/* Time Scrubber */}
          <div className="w-full max-w-md my-4 flex items-center gap-3 bg-surface p-2.5 rounded-xl border border-cardBorder">
            <button onClick={togglePlay} className="p-1.5 text-white hover:text-indigo-400 transition-colors">
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </button>
            <span className="text-[11px] font-mono text-slate-400">
              {currentTime.toFixed(1)}s / {endTime.toFixed(1)}s
            </span>
            <input
              type="range"
              min={startTime}
              max={endTime || 1}
              step={0.1}
              value={currentTime}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                setCurrentTime(val);
                if (videoRef.current) videoRef.current.currentTime = val;
              }}
              className="flex-1 accent-indigo-500 cursor-pointer"
            />
          </div>

          {/* Interactive Word-by-Word Click-to-Edit Transcript */}
          <div className="w-full max-w-lg bg-surface border border-cardBorder rounded-2xl p-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Edit3 className="w-3.5 h-3.5 text-indigo-400" />
                Click-to-Edit Transcript Words
              </h4>
              <span className="text-[10px] text-slate-500">Click any word to fix typos</span>
            </div>

            <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-1">
              {editableWords.length > 0 ? (
                editableWords.map((w, idx) => {
                  const isActive = w.start <= currentTime && currentTime <= w.end;
                  return (
                    <button
                      key={idx}
                      onClick={() => handleWordClick(idx)}
                      className={`text-xs px-2 py-0.5 rounded-md transition-all ${
                        isActive
                          ? 'bg-yellow-400 text-black font-extrabold shadow'
                          : 'bg-surfaceLight hover:bg-cardBorder text-slate-200'
                      }`}
                    >
                      {w.word}
                    </button>
                  );
                })
              ) : (
                <span className="text-xs text-slate-500 italic">No transcript words in this segment.</span>
              )}
            </div>

            {/* Inline Word Edit Popover */}
            {editingWordIdx !== null && (
              <div className="mt-3 pt-3 border-t border-cardBorder flex items-center gap-2 animate-in fade-in">
                <input
                  type="text"
                  value={editingWordText}
                  onChange={(e) => setEditingWordText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSaveWordEdit()}
                  className="flex-1 px-3 py-1.5 bg-surfaceLight border border-indigo-500 rounded-lg text-xs text-white focus:outline-none"
                  autoFocus
                />
                <button
                  onClick={handleSaveWordEdit}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg flex items-center gap-1 shadow"
                >
                  <Save className="w-3 h-3" />
                  Save
                </button>
                <button
                  onClick={() => setEditingWordIdx(null)}
                  className="px-2.5 py-1.5 text-slate-400 hover:text-white text-xs"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right: Studio Settings (Trimming, Presets, Split Screen, Effects) */}
        <div className="lg:col-span-4 border-l border-cardBorder bg-surface p-6 overflow-y-auto max-h-[calc(100vh-3.5rem)] space-y-6">
          {/* Trimming Section */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Scissors className="w-3.5 h-3.5 text-indigo-400" />
              Clip Boundaries & Trim
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] text-slate-400 font-medium block mb-1">Start Time (sec)</label>
                <input
                  type="number"
                  step="0.5"
                  value={startTime}
                  onChange={(e) => setStartTime(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-surfaceLight border border-cardBorder rounded-xl text-sm text-white font-mono"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-400 font-medium block mb-1">End Time (sec)</label>
                <input
                  type="number"
                  step="0.5"
                  value={endTime}
                  onChange={(e) => setEndTime(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-surfaceLight border border-cardBorder rounded-xl text-sm text-white font-mono"
                />
              </div>
            </div>
            <div className="text-right text-[11px] text-slate-500 font-medium">
              Duration: {(endTime - startTime).toFixed(1)} seconds
            </div>
          </div>

          {/* Camera Layout: Single Focus vs Podcast Split */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-indigo-400" />
              Camera Framing Layout
            </h3>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setLayoutMode('single')}
                className={`p-3 rounded-xl border flex flex-col items-center gap-1 transition-all ${
                  layoutMode === 'single'
                    ? 'bg-indigo-600/20 border-indigo-500 text-white font-semibold'
                    : 'bg-surfaceLight/50 border-cardBorder text-slate-400 hover:text-white'
                }`}
              >
                <Smartphone className="w-4 h-4 text-indigo-400" />
                <span className="text-xs">Single Speaker</span>
                <span className="text-[10px] text-slate-500">Face Center Pan</span>
              </button>

              <button
                onClick={() => setLayoutMode('podcast_split')}
                className={`p-3 rounded-xl border flex flex-col items-center gap-1 transition-all ${
                  layoutMode === 'podcast_split'
                    ? 'bg-indigo-600/20 border-indigo-500 text-white font-semibold'
                    : 'bg-surfaceLight/50 border-cardBorder text-slate-400 hover:text-white'
                }`}
              >
                <Users className="w-4 h-4 text-purple-400" />
                <span className="text-xs">Podcast Split</span>
                <span className="text-[10px] text-slate-500">Stacked Top & Bottom</span>
              </button>
            </div>
          </div>

          {/* Aspect Ratio */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Smartphone className="w-3.5 h-3.5 text-indigo-400" />
              Aspect Ratio
            </h3>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => setAspectRatio('9:16')}
                className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all ${
                  aspectRatio === '9:16'
                    ? 'bg-indigo-600/20 border-indigo-500 text-white font-semibold'
                    : 'bg-surfaceLight/50 border-cardBorder text-slate-400 hover:text-white'
                }`}
              >
                <Smartphone className="w-4 h-4 text-indigo-400" />
                <span className="text-xs">9:16 Vertical</span>
              </button>
              <button
                onClick={() => setAspectRatio('1:1')}
                className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all ${
                  aspectRatio === '1:1'
                    ? 'bg-indigo-600/20 border-indigo-500 text-white font-semibold'
                    : 'bg-surfaceLight/50 border-cardBorder text-slate-400 hover:text-white'
                }`}
              >
                <Square className="w-4 h-4 text-indigo-400" />
                <span className="text-xs">1:1 Square</span>
              </button>
              <button
                onClick={() => setAspectRatio('16:9')}
                className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all ${
                  aspectRatio === '16:9'
                    ? 'bg-indigo-600/20 border-indigo-500 text-white font-semibold'
                    : 'bg-surfaceLight/50 border-cardBorder text-slate-400 hover:text-white'
                }`}
              >
                <Monitor className="w-4 h-4 text-indigo-400" />
                <span className="text-xs">16:9 Landscape</span>
              </button>
            </div>
          </div>

          {/* Subtitle Style Presets */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Type className="w-3.5 h-3.5 text-indigo-400" />
              Dynamic Subtitle Style
            </h3>
            <div className="space-y-2">
              {[
                { id: 'hormozi', name: 'Alex Hormozi Pro', tag: 'High Virality', color: '#FACC15', desc: 'Yellow pop with solid black stroke & bounce' },
                { id: 'beast', name: 'MrBeast Explosive', tag: 'High Energy', color: '#EF4444', desc: 'Punchy fire red on bold yellow text' },
                { id: 'neon', name: 'Cyber Neon Glow', tag: 'Trending', color: '#EC4899', desc: 'Cyan text with glowing magenta active pulse' },
                { id: 'clean', name: 'Ali Abdaal Clean', tag: 'Podcast', color: '#E2E8F0', desc: 'Subtle white sans-serif with soft gold highlights' },
              ].map((p) => (
                <div
                  key={p.id}
                  onClick={() => setCaptionPreset(p.id)}
                  className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                    captionPreset === p.id
                      ? 'bg-indigo-600/10 border-indigo-500 shadow-sm'
                      : 'bg-surfaceLight/40 border-cardBorder hover:border-slate-700'
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white">{p.name}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-surfaceLight text-slate-400 font-medium">
                        {p.tag}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">{p.desc}</p>
                  </div>
                  {captionPreset === p.id && <Check className="w-4 h-4 text-indigo-400" />}
                </div>
              ))}
            </div>
          </div>

          {/* Visual Effects Switches */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              Dynamic Effects
            </h3>
            <div className="space-y-2">
              <label className="flex items-center justify-between p-3 bg-surfaceLight/40 rounded-xl border border-cardBorder cursor-pointer">
                <div className="flex items-center gap-2">
                  <Smile className="w-4 h-4 text-yellow-400" />
                  <div>
                    <span className="text-xs font-bold text-white block">Auto-Emoji Stickers</span>
                    <span className="text-[10px] text-slate-400">Add context emojis (💰, 🔥, 🤯, 🚀) to key hook words</span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={enableEmojis}
                  onChange={(e) => setEnableEmojis(e.target.checked)}
                  className="w-4 h-4 accent-indigo-600 cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between p-3 bg-surfaceLight/40 rounded-xl border border-cardBorder cursor-pointer">
                <div className="flex items-center gap-2">
                  <Palette className="w-4 h-4 text-emerald-400" />
                  <div>
                    <span className="text-xs font-bold text-white block">Keyword Color Pop</span>
                    <span className="text-[10px] text-slate-400">Green for numbers & currency, Red for urgent cues</span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={enableKeywordColors}
                  onChange={(e) => setEnableKeywordColors(e.target.checked)}
                  className="w-4 h-4 accent-indigo-600 cursor-pointer"
                />
              </label>
            </div>
          </div>

          {/* Font Scale Slider */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-400">
              <span>Font Size Scale</span>
              <span className="text-white font-mono">{Math.round(fontScale * 100)}%</span>
            </div>
            <input
              type="range"
              min={0.8}
              max={1.4}
              step={0.05}
              value={fontScale}
              onChange={(e) => setFontScale(parseFloat(e.target.value))}
              className="w-full accent-indigo-500 cursor-pointer"
            />
          </div>

          {/* Caption Position */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Subtitle Position
            </h3>
            <div className="grid grid-cols-3 gap-2 text-xs">
              {['bottom', 'middle', 'top'].map((pos) => (
                <button
                  key={pos}
                  onClick={() => setCaptionPosition(pos)}
                  className={`py-2 rounded-xl border capitalize font-semibold transition-all ${
                    captionPosition === pos
                      ? 'bg-indigo-600 text-white border-indigo-500'
                      : 'bg-surfaceLight/50 border-cardBorder text-slate-400 hover:text-white'
                  }`}
                >
                  {pos}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {selectedClip && (
        <SocialPacksModal
          clip={selectedClip}
          isOpen={showSocialModal}
          onClose={() => setShowSocialModal(false)}
        />
      )}
    </div>
  );
}
