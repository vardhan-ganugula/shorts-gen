'use client';

import React from 'react';
import Link from 'next/link';
import { Sparkles, Video, FolderGit2, Settings, Zap } from 'lucide-react';

export default function Navbar() {
  return (
    <header className="h-16 border-b border-cardBorder bg-surface/80 backdrop-blur-md sticky top-0 z-50 px-6 flex items-center justify-between">
      <div className="flex items-center gap-8">
        <Link href="/spaces?task=shorts" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-xl tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
            klap<span className="text-indigo-400">.ai</span>
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-1 text-sm font-medium text-slate-400">
          <Link
            href="/spaces?task=shorts"
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surfaceLight text-white"
          >
            <Video className="w-4 h-4 text-indigo-400" />
            Shorts
          </Link>
          <a
            href="#templates"
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:text-slate-200 hover:bg-surfaceLight/50 transition-colors"
          >
            <FolderGit2 className="w-4 h-4" />
            Presets
          </a>
          <a
            href="#settings"
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:text-slate-200 hover:bg-surfaceLight/50 transition-colors"
          >
            <Settings className="w-4 h-4" />
            Integrations
          </a>
        </nav>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
          <Zap className="w-3.5 h-3.5" />
          <span>Local Engine Active</span>
        </div>

        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-500 to-indigo-600 flex items-center justify-center text-xs font-bold text-white shadow">
          U
        </div>
      </div>
    </header>
  );
}
