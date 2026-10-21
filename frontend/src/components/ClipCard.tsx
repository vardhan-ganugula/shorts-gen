'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Play, Flame, Sliders, Download, Check, Share2, Clock, Gauge, Loader2, Users } from 'lucide-react';
import { ClipItem } from '@/lib/types';
import SocialPacksModal from './SocialPacksModal';

interface ClipCardProps {
  projectId: string;
  clip: ClipItem;
  videoUrl: string;
}

export default function ClipCard({ projectId, clip, videoUrl }: ClipCardProps) {
  const [showSocialModal, setShowSocialModal] = useState(false);
  const [rendering, setRendering] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

  const handleQuickRender = async () => {
    setRendering(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/render`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clip_id: clip.id,
          aspect_ratio: clip.aspect_ratio || '9:16',
          layout_mode: clip.layout_mode || 'single',
          caption_preset: clip.caption_preset || 'hormozi',
          caption_position: 'bottom',
        }),
      });
      const data = await res.json();

      // If render returned immediately with download_url (cached), use it
      if (data.success && data.download_url) {
        setDownloadUrl(data.download_url);
        setRendering(false);
        return;
      }

      // Otherwise poll render-status until done
      if (data.success && (data.status === 'queued' || data.status === 'rendering')) {
        const pollInterval = setInterval(async () => {
          try {
            const statusRes = await fetch(`/api/projects/${projectId}/render-status/${clip.id}`);
            const statusData = await statusRes.json();
            if (statusData.status === 'done' && statusData.download_url) {
              clearInterval(pollInterval);
              setDownloadUrl(statusData.download_url);
              setRendering(false);
            } else if (statusData.status === 'error') {
              clearInterval(pollInterval);
              console.error('Render error:', statusData.error);
              setRendering(false);
            }
          } catch {
            clearInterval(pollInterval);
            setRendering(false);
          }
        }, 2000);
        return; // don't setRendering(false) yet - polling will handle it
      }
    } catch (e) {
      console.error('Render failed', e);
    }
    setRendering(false);
  };

  return (
    <>
      <div className="bg-surface border border-cardBorder rounded-2xl overflow-hidden shadow-lg hover:border-indigo-500/40 transition-all flex flex-col group">
        {/* 9:16 Video Aspect Preview Container */}
        <div className="relative bg-black aspect-[9/16] max-h-[380px] w-full flex items-center justify-center overflow-hidden border-b border-cardBorder">
          <video
            src={`${videoUrl}#t=${clip.start},${clip.end}`}
            preload="metadata"
            className="w-full h-full object-cover"
          />

          {/* Virality Score Badge */}
          <div className="absolute top-3 left-3 flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/75 backdrop-blur-md border border-white/10 shadow-lg">
            <Flame className="w-4 h-4 text-emerald-400 fill-emerald-400" />
            <span className="text-xs font-bold text-white tracking-wide">{clip.viral_score}</span>
            <span className="text-[10px] text-emerald-400 uppercase font-semibold">Viral</span>
          </div>

          {/* Duration & Multi-speaker Tag */}
          <div className="absolute top-3 right-3 flex items-center gap-1.5">
            {clip.layout_mode === 'podcast_split' && (
              <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-500/80 backdrop-blur-md text-[10px] font-bold text-white">
                <Users className="w-3 h-3" />
                <span>Split</span>
              </div>
            )}
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/75 backdrop-blur-md border border-white/10 text-[11px] font-medium text-slate-300">
              <Clock className="w-3 h-3 text-slate-400" />
              <span>{clip.duration}s</span>
            </div>
          </div>

          {/* Hover Overlay Play Link */}
          <Link
            href={`/editor/${projectId}?clip=${clip.id}`}
            className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
          >
            <div className="w-12 h-12 rounded-full bg-indigo-600/90 text-white flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform">
              <Play className="w-5 h-5 ml-0.5" />
            </div>
          </Link>
        </div>

        {/* Info & Metrics */}
        <div className="p-4 flex-1 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span
                className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-md"
                style={{
                  backgroundColor: `${clip.badge_color}20`,
                  color: clip.badge_color,
                  border: `1px solid ${clip.badge_color}40`,
                }}
              >
                {clip.tag}
              </span>
            </div>

            <h3 className="text-sm font-bold text-white line-clamp-2 mb-2 group-hover:text-indigo-400 transition-colors">
              {clip.title}
            </h3>

            <p className="text-xs text-slate-400 line-clamp-2 mb-4 leading-relaxed">
              "{clip.text}"
            </p>

            {/* Metric Pills */}
            <div className="grid grid-cols-2 gap-2 mb-4 text-[11px] font-medium bg-surfaceLight/50 p-2.5 rounded-xl border border-cardBorder">
              <div className="flex items-center gap-1.5 text-slate-300">
                <span className="text-slate-500">Hook:</span>
                <span className="text-white font-semibold">{clip.hook_score}/100</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-300">
                <Gauge className="w-3 h-3 text-indigo-400" />
                <span className="text-slate-500">Pace:</span>
                <span className="text-white font-semibold">{clip.pacing_score}/100</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2 pt-2 border-t border-cardBorder">
            <div className="flex gap-2">
              <Link
                href={`/editor/${projectId}?clip=${clip.id}`}
                className="flex-1 py-2 px-3 bg-surfaceLight hover:bg-cardBorder text-slate-200 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-colors"
              >
                <Sliders className="w-3.5 h-3.5 text-indigo-400" />
                Edit Studio
              </Link>

              <button
                onClick={() => setShowSocialModal(true)}
                title="View TikTok / YouTube / Reels publishing pack"
                className="p-2 bg-surfaceLight hover:bg-cardBorder text-indigo-400 rounded-xl transition-colors"
              >
                <Share2 className="w-4 h-4" />
              </button>
            </div>

            {downloadUrl ? (
              <a
                href={downloadUrl}
                download
                className="w-full py-2 px-3 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 shadow transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                Download Ready MP4
              </a>
            ) : (
              <button
                onClick={handleQuickRender}
                disabled={rendering}
                className="w-full py-2 px-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 shadow transition-colors"
              >
                {rendering ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Burning 9:16 & Captions...
                  </>
                ) : (
                  <>
                    <Download className="w-3.5 h-3.5" />
                    Quick Export 9:16
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      <SocialPacksModal
        clip={clip}
        isOpen={showSocialModal}
        onClose={() => setShowSocialModal(false)}
      />
    </>
  );
}
