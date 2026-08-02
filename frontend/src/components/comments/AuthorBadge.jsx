import React from 'react';
import { Crown } from 'lucide-react';

/**
 * Author Badge Component
 * Dynamically displays 👑 Creator badge when commenter is the video uploader
 */
export function AuthorBadge({ isCreator }) {
  if (!isCreator) return null;

  return (
    <span 
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30 shadow-sm"
      title="Video Uploader / Creator"
    >
      <Crown className="w-3 h-3 text-amber-400 fill-amber-400" />
      Creator
    </span>
  );
}

export default AuthorBadge;
