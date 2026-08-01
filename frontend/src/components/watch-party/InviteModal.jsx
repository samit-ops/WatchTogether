import React, { useEffect } from 'react';
import { X, Copy } from 'lucide-react';
import { toast } from '@/utils/toast';

export function InviteModal({ roomId, isOpen, onClose }) {
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const inviteUrl = `${window.location.origin}/watch-party/${roomId}`;

  const copyLink = () => {
    navigator.clipboard.writeText(inviteUrl);
    toast.success('Invite link copied!');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-surface border border-border rounded-xl shadow-2xl max-w-md w-full relative" onClick={e => e.stopPropagation()}>
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-muted hover:text-text"
        >
          <X className="w-5 h-5" />
        </button>
        
        <div className="p-6">
          <h2 className="text-xl font-bold text-text mb-2">Invite Others</h2>
          <p className="text-sm text-muted mb-6">Share this link with friends to join your watch party.</p>
          
          <div className="mb-4">
            <label className="block text-xs font-medium text-muted mb-1">Room ID</label>
            <div className="font-mono text-sm bg-background p-2 rounded border border-border">
              {roomId}
            </div>
          </div>
          
          <div className="mb-6">
            <label className="block text-xs font-medium text-muted mb-1">Invite Link</label>
            <div className="flex gap-2">
              <input
                type="text"
                readOnly
                value={inviteUrl}
                className="flex-1 bg-background border border-border rounded px-3 py-2 text-sm text-text focus:outline-none"
              />
              <button
                onClick={copyLink}
                className="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded flex items-center gap-2 transition-colors"
              >
                <Copy className="w-4 h-4" />
                Copy
              </button>
            </div>
          </div>
          
          <button
            onClick={onClose}
            className="w-full bg-white/10 hover:bg-white/20 text-text py-2 rounded transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
