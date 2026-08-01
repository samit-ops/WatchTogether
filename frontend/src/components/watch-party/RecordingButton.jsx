import React from 'react';
import { cn } from '@/utils/cn';
import { Circle } from 'lucide-react';

export function RecordingButton({ isRecording, onStart, onStop, isHost }) {
  if (!isHost) return null;

  return (
    <button
      onClick={isRecording ? onStop : onStart}
      className={cn(
        "h-12 px-4 rounded-full flex items-center justify-center gap-2 transition-colors focus:outline-none border",
        isRecording 
          ? "bg-red-500/20 text-red-500 border-red-500/50 hover:bg-red-500/30" 
          : "bg-surface hover:bg-white/10 text-text border-border"
      )}
      title={isRecording ? "Stop Recording" : "Start Recording"}
    >
      <Circle className={cn("w-4 h-4", isRecording && "fill-current animate-pulse")} />
      {isRecording && <span className="text-xs font-bold uppercase tracking-wider">Rec</span>}
    </button>
  );
}
