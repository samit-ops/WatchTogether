import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/utils/cn';
import { MoreVertical, Mic, MicOff, Video, VideoOff, Crown, Shield } from 'lucide-react';

export function ParticipantList({ participants, isHost, currentUserId, onKick, onPromote, onDemote, onTransferHost }) {
  const currentId = String(currentUserId || '');

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

  return (
    <div className="flex flex-col h-full bg-surface">
      <div className="p-4 border-b border-border">
        <h3 className="text-sm font-semibold text-text">Participants ({uniqueParticipants.length})</h3>
      </div>
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {uniqueParticipants.map(p => {
          const pId = String(p.user?._id || p.user?.id || p.user || '');
          const isLocal = Boolean(currentId && pId && currentId === pId);
          
          return (
            <ParticipantListItem
              key={p.socketId || pId}
              participant={p}
              isHost={isHost}
              isLocal={isLocal}
              onKick={() => onKick(p.socketId)}
              onPromote={() => onPromote(p.socketId)}
              onDemote={() => onDemote(p.socketId)}
              onTransferHost={() => onTransferHost(p.socketId)}
            />
          );
        })}
      </div>
    </div>
  );
}

function ParticipantListItem({ participant, isHost, isLocal, onKick, onPromote, onDemote, onTransferHost }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    if (menuOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [menuOpen]);

  const nameInitial = participant.user?.name?.charAt(0) || '?';

  return (
    <div className="flex items-center justify-between p-2 hover:bg-background/50 rounded-lg group relative">
      <div className="flex items-center gap-3">
        <div className="relative">
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm">
            {nameInitial}
          </div>
          <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full border border-surface" />
        </div>
        <div className="flex flex-col">
          <div className="text-sm text-text font-medium flex items-center gap-1">
            {isLocal ? 'You' : participant.user?.name}
            {participant.role === 'host' && <Crown className="w-3 h-3 text-yellow-400" />}
            {participant.role === 'moderator' && <Shield className="w-3 h-3 text-blue-400" />}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {participant.isMuted ? <MicOff className="w-4 h-4 text-red-500" /> : <Mic className="w-4 h-4 text-muted" />}
        {participant.isCameraOff ? <VideoOff className="w-4 h-4 text-red-500" /> : <Video className="w-4 h-4 text-muted" />}
        
        {isHost && !isLocal && (
          <div className="relative" ref={menuRef}>
            <button 
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-1 rounded hover:bg-white/10 text-muted"
            >
              <MoreVertical className="w-4 h-4" />
            </button>
            
            {menuOpen && (
              <div className="absolute right-0 top-full mt-1 w-48 bg-surface border border-border rounded-lg shadow-xl z-50 py-1">
                {participant.role === 'guest' ? (
                  <button onClick={() => { onPromote(); setMenuOpen(false); }} className="w-full text-left px-4 py-2 text-sm hover:bg-white/5 text-text">
                    Promote to Moderator
                  </button>
                ) : (
                  <button onClick={() => { onDemote(); setMenuOpen(false); }} className="w-full text-left px-4 py-2 text-sm hover:bg-white/5 text-text">
                    Demote to Guest
                  </button>
                )}
                <button onClick={() => { onTransferHost(); setMenuOpen(false); }} className="w-full text-left px-4 py-2 text-sm hover:bg-white/5 text-text">
                  Transfer Host
                </button>
                <div className="border-t border-border/50 my-1" />
                <button onClick={() => { onKick(); setMenuOpen(false); }} className="w-full text-left px-4 py-2 text-sm hover:bg-white/5 text-red-500">
                  Remove Participant
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
