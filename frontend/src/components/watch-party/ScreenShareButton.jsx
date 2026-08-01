import React from 'react';
import { cn } from '@/utils/cn';
import { MonitorUp } from 'lucide-react';
import { toast } from '@/utils/toast';

export function ScreenShareButton({ active, onClick, disabled }) {
  const handleClick = () => {
    if (disabled) {
      toast.error('Screen sharing disabled by host');
    } else {
      onClick();
    }
  };

  return (
    <button
      onClick={handleClick}
      className={cn(
        "h-12 w-12 rounded-full flex items-center justify-center transition-colors focus:outline-none",
        active 
          ? "bg-blue-500 text-white shadow-[0_0_15px_rgba(59,130,246,0.5)]" 
          : "bg-surface hover:bg-white/10 text-text border border-border",
        disabled && "opacity-50 cursor-not-allowed"
      )}
      title={active ? "Stop Screen Share" : "Share Screen"}
    >
      <MonitorUp className="w-5 h-5" />
    </button>
  );
}
