import React, { useEffect, useRef } from 'react';
import { cn } from '@/utils/cn';
import { MicOff, Crown, Shield } from 'lucide-react';

export function ParticipantGrid({ localStream, remoteStreams, participants, currentUserId }) {
  // Deduplicate participants by user ID
  const uniqueParticipants = [];
  const seenUsers = new Set();
  participants.forEach(p => {
    const uid = String(p.user?._id || p.user?.id || p.user || p.socketId);
    if (!seenUsers.has(uid)) {
      seenUsers.add(uid);
      uniqueParticipants.push(p);
    }
  });

  const total = uniqueParticipants.length;
  const cols = total === 1 ? 'grid-cols-1' : total <= 4 ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4';
  const currentId = String(currentUserId || '');

  return (
    <div className={cn("grid gap-4 w-full h-full p-4", cols)}>
      {uniqueParticipants.map(p => {
        const pId = String(p.user?._id || p.user?.id || p.user || '');
        const isLocal = Boolean(currentId && pId && currentId === pId);
        const stream = isLocal ? localStream : remoteStreams[p.socketId];
        
        return (
          <ParticipantTile
            key={p.socketId || pId}
            participant={p}
            stream={stream}
            isLocal={isLocal}
          />
        );
      })}
    </div>
  );
}

function ParticipantTile({ participant, stream, isLocal }) {
  const videoRef = useRef(null);

  const videoTrack = stream && stream.getVideoTracks().find(t => t.readyState === 'live');
  const hasVideo = Boolean(videoTrack && !participant.isCameraOff);
  const isMuted = participant.isMuted || (!stream || stream.getAudioTracks().length === 0);

  useEffect(() => {
    if (hasVideo && videoRef.current && stream) {
      if (videoRef.current.srcObject !== stream) {
        videoRef.current.srcObject = stream;
      }
    }
  }, [hasVideo, stream]);

  return (
    <div className="relative aspect-video rounded-xl bg-surface overflow-hidden border border-border flex items-center justify-center">
      {hasVideo ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={isLocal}
          className={cn("w-full h-full object-cover", isLocal && "transform scale-x-[-1]")}
        />
      ) : (
        <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center text-primary text-2xl font-bold uppercase">
          {participant.user?.name?.charAt(0) || '?'}
        </div>
      )}
      
      <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
        <div className="bg-black/60 backdrop-blur-sm px-2 py-1 rounded text-xs text-white max-w-[80%] truncate flex items-center gap-1">
          {isLocal ? 'You' : participant.user?.name}
          {participant.role === 'host' && <Crown className="w-3 h-3 text-yellow-400" />}
          {participant.role === 'moderator' && <Shield className="w-3 h-3 text-blue-400" />}
        </div>
        
        {isMuted && (
          <div className="bg-red-500/80 backdrop-blur-sm p-1 rounded-full">
            <MicOff className="w-3 h-3 text-white" />
          </div>
        )}
      </div>
    </div>
  );
}
