'use client';

import React, { useState } from 'react';
import { Youtube, UploadCloud, Sparkles, Loader2, AlertCircle } from 'lucide-react';

interface VideoUploaderProps {
  onSuccess: () => void;
}

export default function VideoUploader({ onSuccess }: VideoUploaderProps) {
  const [activeTab, setActiveTab] = useState<'url' | 'upload'>('url');
  const [url, setUrl] = useState('');
  const [language, setLanguage] = useState<'auto' | 'en' | 'hi' | 'ur'>('auto');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUrlSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/projects/url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim(), language }),
      });

      const rawText = await res.text();
      let data: any = {};
      try {
        data = JSON.parse(rawText);
      } catch {
        // If not JSON, use the raw response
        if (!res.ok) {
          throw new Error(rawText || 'Server error occurred');
        }
      }

      if (!res.ok) {
        throw new Error(data.detail || data.message || rawText || 'Failed to process URL');
      }

      setUrl('');
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Error importing video');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('language', language);

    try {
      const res = await fetch('/api/projects/upload', {
        method: 'POST',
        body: formData,
      });

      const rawText = await res.text();
      let data: any = {};
      try {
        data = JSON.parse(rawText);
      } catch {
        if (!res.ok) {
          throw new Error(rawText || 'Server error occurred');
        }
      }

      if (!res.ok) {
        throw new Error(data.detail || data.message || rawText || 'Failed to upload video');
      }

      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Error uploading file');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-surface border border-cardBorder rounded-2xl p-6 shadow-xl mb-8">
      <div className="flex items-center justify-between border-b border-cardBorder pb-4 mb-6">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-400" />
            Create Viral Shorts
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Import any YouTube link or upload a video file. AI handles transcription, 9:16 framing, and subtitles.
          </p>
        </div>

        <div className="flex bg-surfaceLight p-1 rounded-xl text-xs font-semibold">
          <button
            onClick={() => setActiveTab('url')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'url' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Youtube className="w-3.5 h-3.5" />
            YouTube Link
          </button>
          <button
            onClick={() => setActiveTab('upload')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'upload' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            <UploadCloud className="w-3.5 h-3.5" />
            File Upload
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="mb-4 flex items-center gap-3">
        <label htmlFor="transcription-language" className="text-xs font-semibold text-slate-300">
          Spoken language
        </label>
        <select
          id="transcription-language"
          value={language}
          onChange={(e) => setLanguage(e.target.value as 'auto' | 'en' | 'hi' | 'ur')}
          disabled={loading}
          className="bg-surfaceLight border border-cardBorder rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
        >
          <option value="auto">Auto-detect</option>
          <option value="hi">Hindi</option>
          <option value="ur">Urdu</option>
          <option value="en">English</option>
        </select>
        <span className="text-[10px] text-slate-500">Choose the audio language for better transcription.</span>
      </div>

      {activeTab === 'url' ? (
        <form onSubmit={handleUrlSubmit} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
              <Youtube className="w-4 h-4 text-red-500" />
            </div>
            <input
              type="url"
              placeholder="Paste YouTube video link (e.g. https://www.youtube.com/watch?v=...)"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              disabled={loading}
              className="w-full pl-10 pr-4 py-3 bg-surfaceLight/60 border border-cardBorder rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>
          <button
            type="submit"
            disabled={loading || !url.trim()}
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold text-sm rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 transition-all shrink-0"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Importing...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Generate Shorts
              </>
            )}
          </button>
        </form>
      ) : (
        <div className="border-2 border-dashed border-cardBorder hover:border-indigo-500/50 rounded-xl p-8 text-center transition-colors">
          <input
            type="file"
            id="video-upload"
            accept="video/mp4,video/quicktime,video/x-matroska,video/webm"
            onChange={handleFileUpload}
            disabled={loading}
            className="hidden"
          />
          <label htmlFor="video-upload" className="cursor-pointer flex flex-col items-center">
            {loading ? (
              <div className="flex flex-col items-center py-4">
                <Loader2 className="w-8 h-8 text-indigo-400 animate-spin mb-2" />
                <span className="text-sm text-slate-300 font-medium">Uploading video to backend engine...</span>
              </div>
            ) : (
              <>
                <div className="w-12 h-12 rounded-full bg-surfaceLight flex items-center justify-center mb-3 text-indigo-400">
                  <UploadCloud className="w-6 h-6" />
                </div>
                <span className="text-sm font-semibold text-white mb-1">Click to upload or drag & drop</span>
                <span className="text-xs text-slate-400">MP4, MOV, MKV, WebM up to 2GB</span>
              </>
            )}
          </label>
        </div>
      )}
    </div>
  );
}
