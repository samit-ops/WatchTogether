import React, { useEffect, useRef } from 'react';
import { cn } from '@/utils/cn';
import { MicOff, Crown, Shield } from 'lucide-react';

export function ParticipantGrid({ localStream, remoteStreams, participants, currentUserId, currentSocketId }) {
  const uniqueParticipants = participants.filter((participant, index, allParticipants) =>
    participant.socketId && allParticipants.findIndex(p => p.socketId === participant.socketId) === index
  );

  // Fallback to local user if participants list is temporarily empty on page refresh
  if (uniqueParticipants.length === 0 && currentUserId) {
    uniqueParticipants.push({
      user: { _id: currentUserId, name: 'You' },
      socketId: 'local',
      role: 'guest',
      isMuted: true,
      isCameraOff: true
    });
  }

  const total = uniqueParticipants.length;
  const currentId = String(currentUserId || '');

  // Dynamic grid styling based on participant count for mobile and desktop
  let gridClasses = "grid gap-2 sm:gap-4 w-full h-full p-2 sm:p-4 place-content-center overflow-y-auto";
  if (total === 1) {
    gridClasses += " grid-cols-1 max-w-4xl mx-auto";
  } else if (total === 2) {
    gridClasses += " grid-cols-1 sm:grid-cols-2 max-w-5xl mx-auto";
  } else if (total <= 4) {
    gridClasses += " grid-cols-2 max-w-6xl mx-auto";
  } else if (total <= 6) {
    gridClasses += " grid-cols-2 sm:grid-cols-3 max-w-7xl mx-auto";
  } else if (total <= 9) {
    gridClasses += " grid-cols-3 sm:grid-cols-3";
  } else {
    gridClasses += " grid-cols-3 sm:grid-cols-4 md:grid-cols-5";
  }

  return (
    <div className={gridClasses}>
      {uniqueParticipants.map(p => {
        const pId = String(p.user?._id || p.user?.id || p.user || '');
        const isLocal = Boolean(currentSocketId ? p.socketId === currentSocketId : (currentId && pId && currentId === pId));
        const stream = isLocal ? localStream : remoteStreams[p.socketId];
        
        return (
          <ParticipantTile
            key={p.socketId || pId}
            participant={p}
            stream={stream}
            isLocal={isLocal}
            totalParticipants={total}
          />
        );
      })}
    </div>
  );
}

function ParticipantTile({ participant, stream, isLocal, totalParticipants }) {
  const videoRef = useRef(null);
  const audioRef = useRef(null);

  const videoTrack = stream && stream.getVideoTracks().find(t => t.readyState === 'live');
  const hasVideo = isLocal ? Boolean(videoTrack) : Boolean(videoTrack && !participant.isCameraOff);
  const isMuted = isLocal ? (!stream || stream.getAudioTracks().length === 0) : (participant.isMuted || (!stream || stream.getAudioTracks().length === 0));

  // Bind video stream and trigger play
  useEffect(() => {
    if (hasVideo && videoRef.current && stream) {
      if (videoRef.current.srcObject !== stream) {
        videoRef.current.srcObject = stream;
      }
      videoRef.current.play().catch(err => {
        console.log('[WebRTC] Video play call error:', err);
      });
    }
  }, [hasVideo, stream]);

  // Always bind and play remote audio stream
  useEffect(() => {
    if (!isLocal && audioRef.current && stream) {
      if (audioRef.current.srcObject !== stream) {
        audioRef.current.srcObject = stream;
      }
      audioRef.current.play().catch(err => {
        console.log('[WebRTC] Remote audio play call error:', err);
      });
    }
  }, [isLocal, stream]);

  return (
    <div className={cn(
      "relative rounded-xl bg-surface overflow-hidden border border-border flex items-center justify-center min-h-[110px] sm:min-h-[160px] w-full transition-all",
      totalParticipants <= 2 ? "aspect-[4/3] sm:aspect-video" : "aspect-video"
    )}>
      {/* Remote Audio Player - Always active for remote participants */}
      {!isLocal && stream && (
        <audio ref={audioRef} autoPlay playsInline className="hidden" />
      )}

      {hasVideo ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={isLocal}
          className={cn("w-full h-full object-cover", isLocal && "transform scale-x-[-1]")}
        />
      ) : (
        <div className="w-10 h-10 sm:w-16 sm:h-16 rounded-full bg-primary/20 flex items-center justify-center text-primary text-base sm:text-2xl font-bold uppercase">
          {participant.user?.name?.charAt(0) || '?'}
        </div>
      )}
      
      <div className="absolute bottom-1.5 left-1.5 right-1.5 sm:bottom-2 sm:left-2 sm:right-2 flex items-center justify-between pointer-events-none">
        <div className="bg-black/70 backdrop-blur-md px-1.5 sm:px-2 py-0.5 sm:py-1 rounded text-[10px] sm:text-xs text-white max-w-[80%] truncate flex items-center gap-1">
          {isLocal ? 'You' : participant.user?.name}
          {participant.role === 'host' && <Crown className="w-3 h-3 text-yellow-400 shrink-0" />}
          {participant.role === 'moderator' && <Shield className="w-3 h-3 text-blue-400 shrink-0" />}
        </div>
        
        {isMuted && (
          <div className="bg-red-500/90 backdrop-blur-md p-1 rounded-full shrink-0">
            <MicOff className="w-3 h-3 text-white" />
          </div>
        )}
      </div>
    </div>
  );
}
