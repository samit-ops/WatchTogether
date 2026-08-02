import React from 'react';
import { cn } from '@/utils/cn';

export function Loader({ size = 32, className }) {
  return (
    <div className={cn("flex items-center justify-center", className)}>
      <div className="flex items-center gap-1.5">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="rounded-full bg-primary"
            style={{
              width: size * 0.22,
              height: size * 0.22,
              animation: `loader-pulse 1.2s ease-in-out ${i * 0.15}s infinite`,
            }}
          />
        ))}
      </div>
      <style>{`
        @keyframes loader-pulse {
          0%, 80%, 100% { opacity: 0.3; transform: scale(0.8); }
          40% { opacity: 1; transform: scale(1.1); }
        }
      `}</style>
    </div>
  );
}

/* ─── Skeleton Loading Components ─── */

export function SkeletonBlock({ className }) {
  return <div className={cn("skeleton", className)} />;
}

export function SkeletonCard() {
  return (
    <div className="space-y-3">
      <div className="skeleton aspect-video w-full rounded-xl" />
      <div className="flex gap-3">
        <div className="skeleton h-9 w-9 rounded-full flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="skeleton h-4 w-full rounded" />
          <div className="skeleton h-3 w-2/3 rounded" />
        </div>
      </div>
    </div>
  );
}

export function SkeletonText({ lines = 3, className }) {
  return (
    <div className={cn("space-y-2", className)}>
      {[...Array(lines)].map((_, i) => (
        <div
          key={i}
          className="skeleton h-4 rounded"
          style={{ width: i === lines - 1 ? '60%' : '100%' }}
        />
      ))}
    </div>
  );
}

export function SkeletonAvatar({ size = 40 }) {
  return (
    <div
      className="skeleton rounded-full"
      style={{ width: size, height: size }}
    />
  );
}
