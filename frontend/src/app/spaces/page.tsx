'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import VideoUploader from '@/components/VideoUploader';
import ClipCard from '@/components/ClipCard';
import { ProjectItem } from '@/lib/types';
import { Video, Loader2, Sparkles, Trash2, RefreshCw, AlertCircle, CheckCircle2, DownloadCloud, Filter } from 'lucide-react';

export default function SpacesPage() {
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<'all' | 'high_viral' | 'split'>('all');
  const [batchQueuing, setBatchQueuing] = useState(false);
  const [batchMsg, setBatchMsg] = useState<string | null>(null);

  const fetchProjects = async () => {
    try {
      const res = await fetch('/api/projects');
      const data = await res.json();
      const list = data.projects || [];
      setProjects(list);
      if (list.length > 0 && !selectedProjectId) {
        setSelectedProjectId(list[0].id);
      }
    } catch (e) {
      console.error('Failed to fetch projects', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
    const interval = setInterval(() => {
      fetchProjects();
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this video project?')) return;
    try {
      await fetch(`/api/projects/${id}`, { method: 'DELETE' });
      fetchProjects();
      if (selectedProjectId === id) {
        setSelectedProjectId(null);
      }
    } catch (e) {
      console.error('Failed to delete', e);
    }
  };

  const handleBatchExport = async () => {
    if (!selectedProjectId) return;
    setBatchQueuing(true);
    setBatchMsg(null);
    try {
      const res = await fetch(`/api/projects/${selectedProjectId}/render-all`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setBatchMsg('Batch export started! Clips are rendering in the background.');
        setTimeout(() => setBatchMsg(null), 4000);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setBatchQueuing(false);
    }
  };

  const selectedProject = projects.find((p) => p.id === selectedProjectId) || projects[0];

  // Filter clips
  let displayedClips = selectedProject?.clips || [];
  if (activeFilter === 'high_viral') {
    displayedClips = displayedClips.filter((c) => c.viral_score >= 80);
  } else if (activeFilter === 'split') {
    displayedClips = displayedClips.filter((c) => c.layout_mode === 'podcast_split');
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Top Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
              <span>Shorts Workspace</span>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                AI Pipeline Active
              </span>
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Extract viral 9:16 vertical clips from long podcasts, webinars, and YouTube videos.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchProjects}
              className="flex items-center gap-2 px-4 py-2 bg-surfaceLight hover:bg-cardBorder text-slate-200 text-xs font-semibold rounded-xl border border-cardBorder transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5 text-indigo-400" />
              Refresh Status
            </button>
          </div>
        </div>

        {/* Video Ingestion Box */}
        <VideoUploader onSuccess={fetchProjects} />

        {/* Projects & Clips Section */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-500">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-500 mb-2" />
            <span className="text-sm">Connecting to backend engine...</span>
          </div>
        ) : projects.length === 0 ? (
          <div className="bg-surface border border-cardBorder rounded-2xl p-12 text-center">
            <div className="w-16 h-16 rounded-2xl bg-surfaceLight flex items-center justify-center mx-auto mb-4 text-indigo-400">
              <Video className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-white mb-1">No videos imported yet</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Paste a YouTube URL above or upload a video file to automatically detect viral hooks and generate 9:16 shorts.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Left Sidebar: Projects List */}
            <div className="lg:col-span-1 space-y-3">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                Your Projects ({projects.length})
              </h2>

              <div className="space-y-2">
                {projects.map((project) => {
                  const isSelected = selectedProject?.id === project.id;
                  const isProcessing = project.status !== 'ready' && project.status !== 'error';

                  return (
                    <div
                      key={project.id}
                      onClick={() => setSelectedProjectId(project.id)}
                      className={`p-3.5 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                        isSelected
                          ? 'bg-surfaceLight border-indigo-500 shadow-md'
                          : 'bg-surface border-cardBorder hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h4 className="text-xs font-bold text-white line-clamp-1">
                          {project.title}
                        </h4>
                        <button
                          onClick={(e) => handleDelete(project.id, e)}
                          title="Delete Project"
                          className="text-slate-500 hover:text-red-400 transition-colors p-0.5"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="flex items-center justify-between text-[11px]">
                        {isProcessing ? (
                          <div className="flex items-center gap-1.5 text-indigo-400 font-medium">
                            <Loader2 className="w-3 h-3 animate-spin" />
                            <span className="capitalize">{project.status.replace('_', ' ')}</span>
                          </div>
                        ) : project.status === 'error' ? (
                          <div className="flex items-center gap-1.5 text-red-400 font-medium">
                            <AlertCircle className="w-3 h-3" />
                            <span>Error</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 text-emerald-400 font-medium">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>{project.clip_count} Shorts ready</span>
                          </div>
                        )}

                        <span className="text-slate-500 text-[10px] uppercase font-semibold">
                          {project.source === 'upload' ? 'Upload' : 'YouTube'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right: Selected Project Clips Grid */}
            <div className="lg:col-span-3">
              {selectedProject && (
                <div>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-cardBorder">
                    <div>
                      <h2 className="text-lg font-bold text-white line-clamp-1">
                        {selectedProject.title}
                      </h2>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {selectedProject.status === 'ready'
                          ? `Generated ${selectedProject.clips?.length || 0} clips ranked by viral engagement`
                          : `Status: ${selectedProject.status.replace('_', ' ')}...`}
                      </p>
                    </div>

                    {selectedProject.status === 'ready' && (
                      <div className="flex items-center gap-2">
                        {/* Batch Export Button */}
                        <button
                          onClick={handleBatchExport}
                          disabled={batchQueuing || !selectedProject.clips?.length}
                          className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow transition-all"
                        >
                          {batchQueuing ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <DownloadCloud className="w-3.5 h-3.5" />
                          )}
                          Batch Export All
                        </button>
                      </div>
                    )}
                  </div>

                  {batchMsg && (
                    <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-xs font-medium">
                      {batchMsg}
                    </div>
                  )}

                  {/* Filter chips bar */}
                  {selectedProject.status === 'ready' && selectedProject.clips?.length > 0 && (
                    <div className="flex items-center gap-2 mb-6">
                      <span className="text-xs text-slate-500 flex items-center gap-1 font-medium mr-1">
                        <Filter className="w-3.5 h-3.5" /> Filter:
                      </span>
                      <button
                        onClick={() => setActiveFilter('all')}
                        className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                          activeFilter === 'all'
                            ? 'bg-indigo-600 text-white'
                            : 'bg-surface border border-cardBorder text-slate-400 hover:text-white'
                        }`}
                      >
                        All ({selectedProject.clips.length})
                      </button>
                      <button
                        onClick={() => setActiveFilter('high_viral')}
                        className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                          activeFilter === 'high_viral'
                            ? 'bg-emerald-600 text-white'
                            : 'bg-surface border border-cardBorder text-slate-400 hover:text-white'
                        }`}
                      >
                        🔥 Viral 80+ ({selectedProject.clips.filter((c) => c.viral_score >= 80).length})
                      </button>
                    </div>
                  )}

                  {selectedProject.status !== 'ready' && selectedProject.status !== 'error' ? (
                    <div className="bg-surface border border-cardBorder rounded-2xl p-12 text-center">
                      <Loader2 className="w-10 h-10 animate-spin text-indigo-500 mx-auto mb-4" />
                      <h3 className="text-base font-bold text-white mb-1 capitalize">
                        {selectedProject.status.replace('_', ' ')}
                      </h3>
                      <p className="text-xs text-slate-400 max-w-sm mx-auto mb-4">
                        Running faster-whisper speech recognition, extracting sentence boundaries, and scoring virality.
                      </p>
                      <div className="w-64 h-2 bg-surfaceLight rounded-full mx-auto overflow-hidden">
                        <div
                          className="h-full bg-indigo-600 transition-all duration-500 rounded-full"
                          style={{ width: `${selectedProject.progress || 30}%` }}
                        />
                      </div>
                    </div>
                  ) : displayedClips.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                      {displayedClips.map((clip) => (
                        <ClipCard
                          key={clip.id}
                          projectId={selectedProject.id}
                          clip={clip}
                          videoUrl={selectedProject.video_url}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="bg-surface border border-cardBorder rounded-2xl p-10 text-center text-slate-400 text-xs">
                      No clips match the selected filter.
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
