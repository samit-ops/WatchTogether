import React from 'react';
import { useNavigate } from 'react-router-dom';
import { PlaySquare, MonitorUp, Users } from 'lucide-react';

export default function CreateWatchParty() {
  const navigate = useNavigate();

  return (
    <div className="container mx-auto px-4 py-12 max-w-5xl min-h-screen">
      <div className="text-center mb-12">
        <div className="inline-flex items-center justify-center p-4 bg-primary/10 rounded-full mb-4">
          <Users className="h-10 w-10 text-primary" />
        </div>
        <h1 className="text-4xl sm:text-5xl font-extrabold text-text tracking-tight mb-4">
          Start a Watch Party
        </h1>
        <p className="text-lg text-muted max-w-2xl mx-auto">
          Invite your friends, sync your playback, and interact in real-time. Choose how you want to broadcast.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        
        {/* Uploaded Video Option */}
        <div 
          onClick={() => navigate('/library')}
          className="group relative cursor-pointer overflow-hidden rounded-2xl border border-border bg-surface/50 p-8 hover:bg-surface transition-all hover:border-primary/50 shadow-xl backdrop-blur-sm"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="relative z-10 flex flex-col items-center text-center">
            <div className="h-20 w-20 rounded-2xl bg-blue-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
              <PlaySquare className="h-10 w-10 text-blue-500" />
            </div>
            <h3 className="text-2xl font-bold text-text mb-3">Use Uploaded Video</h3>
            <p className="text-muted leading-relaxed">
              Select a premium video from your library. Best for movies and shows. Ensures perfect synchronization and high-quality playback for everyone.
            </p>
            <div className="mt-8 px-6 py-2 rounded-full bg-background border border-border text-sm font-medium group-hover:bg-primary group-hover:text-white group-hover:border-primary transition-colors">
              Select Video
            </div>
          </div>
        </div>

        {/* Share Screen Option */}
        <div 
          className="group relative cursor-pointer overflow-hidden rounded-2xl border border-border bg-surface/50 p-8 hover:bg-surface transition-all hover:border-green-500/50 shadow-xl backdrop-blur-sm"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="relative z-10 flex flex-col items-center text-center">
            <div className="absolute top-0 right-0 px-3 py-1 bg-green-500/10 text-green-500 text-xs font-bold rounded-full border border-green-500/20">
              Coming Soon
            </div>
            <div className="h-20 w-20 rounded-2xl bg-green-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
              <MonitorUp className="h-10 w-10 text-green-500" />
            </div>
            <h3 className="text-2xl font-bold text-text mb-3">Share Screen</h3>
            <p className="text-muted leading-relaxed">
              Broadcast any tab or application directly from your device. Great for live events, presentations, or watching videos from other platforms.
            </p>
            <div className="mt-8 px-6 py-2 rounded-full bg-background border border-border text-sm font-medium opacity-50 cursor-not-allowed">
              Phase 4 Feature
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
