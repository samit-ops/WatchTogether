import React, { useRef, useEffect } from 'react';
import { Maximize2, LogOut, Mic, MicOff, Video, VideoOff } from 'lucide-react';
import { cn } from '@/utils/cn';

export function MiniPipWindow({
  localStream,
  remoteStreams,
  participants,
  currentUserId,
  audioEnabled,
  videoEnabled,
  onToggleAudio,
  onToggleVideo,
  onExpand,
  onLeave
}) {
  const videoRef = useRef(null);

  // Find active video stream to preview in PiP window
  const currentId = String(currentUserId || '');
  const activeRemoteEntry = Object.entries(remoteStreams).find(([_, stream]) => {
    return stream && stream.getVideoTracks().some(t => t.readyState === 'live');
  });

  const activeStream = activeRemoteEntry ? activeRemoteEntry[1] : localStream;

  useEffect(() => {
    if (videoRef.current && activeStream) {
      if (videoRef.current.srcObject !== activeStream) {
        videoRef.current.srcObject = activeStream;
      }
      videoRef.current.play().catch(e => console.log('[PiP] Play error:', e));
    }
  }, [activeStream]);

  return (
    <div className="fixed bottom-4 right-4 z-50 w-72 h-44 bg-surface border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-slide-up transition-all">
      <div className="relative flex-1 bg-black flex items-center justify-center overflow-hidden">
        {activeStream && activeStream.getVideoTracks().some(t => t.readyState === 'live') ? (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="flex flex-col items-center justify-center gap-1 text-muted">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
              {participants[0]?.user?.name?.charAt(0) || 'W'}
            </div>
            <span className="text-xs">Meeting Active</span>
          </div>
        )}

        <div className="absolute top-2 right-2 flex items-center gap-1.5 bg-black/60 backdrop-blur-md px-2 py-1 rounded-lg">
          <button
            onClick={onExpand}
            className="p-1 text-white hover:text-primary transition-colors"
            title="Expand to Fullscreen Meeting"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>

        <div className="absolute bottom-2 left-2 bg-black/70 backdrop-blur-md px-2 py-0.5 rounded text-[10px] text-white font-medium">
          {participants.length} Participant{participants.length !== 1 ? 's' : ''}
        </div>
      </div>

      <div className="h-10 bg-surface/90 backdrop-blur-md border-t border-border flex items-center justify-between px-3">
        <div className="flex items-center gap-2">
          <button
            onClick={onToggleAudio}
            className={cn(
              "p-1.5 rounded-full text-white transition-colors",
              audioEnabled ? "bg-green-500/20 text-green-500 hover:bg-green-500/30" : "bg-red-500/20 text-red-500 hover:bg-red-500/30"
            )}
          >
            {audioEnabled ? <Mic className="w-3.5 h-3.5" /> : <MicOff className="w-3.5 h-3.5" />}
          </button>

          <button
            onClick={onToggleVideo}
            className={cn(
              "p-1.5 rounded-full text-white transition-colors",
              videoEnabled ? "bg-green-500/20 text-green-500 hover:bg-green-500/30" : "bg-red-500/20 text-red-500 hover:bg-red-500/30"
            )}
          >
            {videoEnabled ? <Video className="w-3.5 h-3.5" /> : <VideoOff className="w-3.5 h-3.5" />}
          </button>
        </div>

        <button
          onClick={onLeave}
          className="p-1.5 rounded-full bg-red-500 hover:bg-red-600 text-white transition-colors"
          title="Leave Room"
        >
          <LogOut className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
