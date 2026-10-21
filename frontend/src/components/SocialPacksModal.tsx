'use client';

import React, { useState } from 'react';
import { X, Copy, Check, Share2 } from 'lucide-react';
import { ClipItem } from '@/lib/types';

interface SocialPacksModalProps {
  clip: ClipItem;
  isOpen: boolean;
  onClose: () => void;
}

export default function SocialPacksModal({ clip, isOpen, onClose }: SocialPacksModalProps) {
  const [activePlatform, setActivePlatform] = useState<'tiktok' | 'youtube' | 'instagram'>('tiktok');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const packs = clip.social_packs || {
    tiktok: clip.social_caption || `${clip.title} #shorts #viral #fyp`,
    youtube: `${clip.title} | Viral Short\n\n"${clip.text}"\n\n#Shorts #YouTubeShorts`,
    instagram: `${clip.title}\n\nSave this reel for later! 📌\n\n#reels #trending #viralreels`
  };

  const currentContent = packs[activePlatform] || '';

  const handleCopy = () => {
    navigator.clipboard.writeText(currentContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="bg-surface border border-cardBorder rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-cardBorder">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-600/20 text-indigo-400 flex items-center justify-center">
              <Share2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Social Publishing Pack</h3>
              <p className="text-[11px] text-slate-400">Tailored metadata & hashtags for each platform</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-surfaceLight transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Platform Selector Tabs */}
        <div className="flex border-b border-cardBorder p-2 gap-2 bg-surfaceLight/30">
          <button
            onClick={() => setActivePlatform('tiktok')}
            className={`flex-1 py-2 text-xs font-semibold rounded-xl transition-all ${
              activePlatform === 'tiktok'
                ? 'bg-indigo-600 text-white shadow'
                : 'text-slate-400 hover:text-white hover:bg-surfaceLight'
            }`}
          >
            TikTok
          </button>
          <button
            onClick={() => setActivePlatform('youtube')}
            className={`flex-1 py-2 text-xs font-semibold rounded-xl transition-all ${
              activePlatform === 'youtube'
                ? 'bg-red-600 text-white shadow'
                : 'text-slate-400 hover:text-white hover:bg-surfaceLight'
            }`}
          >
            YouTube Shorts
          </button>
          <button
            onClick={() => setActivePlatform('instagram')}
            className={`flex-1 py-2 text-xs font-semibold rounded-xl transition-all ${
              activePlatform === 'instagram'
                ? 'bg-gradient-to-r from-pink-600 to-purple-600 text-white shadow'
                : 'text-slate-400 hover:text-white hover:bg-surfaceLight'
            }`}
          >
            Instagram Reels
          </button>
        </div>

        {/* Content Box */}
        <div className="p-4 space-y-3">
          <div className="relative">
            <textarea
              readOnly
              rows={8}
              value={currentContent}
              className="w-full p-3 bg-surfaceLight/70 border border-cardBorder rounded-xl text-xs text-slate-200 font-mono resize-none focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex items-center justify-between pt-1">
            <span className="text-[11px] text-slate-400 font-mono">
              {currentContent.length} characters
            </span>

            <button
              onClick={handleCopy}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow transition-all"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  Copied to Clipboard!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  Copy Copy & Tags
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
