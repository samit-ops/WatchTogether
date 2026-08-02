import React, { memo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Play } from 'lucide-react';
import { usePrefersReducedMotion } from '@/components/motion';

export const VideoCard = memo(function VideoCard({ video, onSelect }) {
  const prefersReducedMotion = usePrefersReducedMotion();

  // Format duration
  const formatDuration = (seconds) => {
    if (!seconds) return '0:00';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  // Format views
  const formatViews = (views) => {
    if (views >= 1000000) return `${(views / 1000000).toFixed(1)}M`;
    if (views >= 1000) return `${(views / 1000).toFixed(1)}K`;
    return views;
  };

  const handleCardClick = (e) => {
    if (onSelect) {
      e.preventDefault();
      onSelect(video);
    }
  };

  const MotionWrapper = prefersReducedMotion ? 'div' : motion.div;
  const motionProps = prefersReducedMotion ? {} : {
    whileHover: { scale: 1.015, y: -3 },
    whileTap: { scale: 0.98 },
    transition: { duration: 0.3, ease: [0.25, 0.4, 0, 1] },
  };

  return (
    <Link to={`/video/${video._id}`} onClick={handleCardClick} className="group block w-full">
      <MotionWrapper {...motionProps}>
        <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-surface card-hover">
          <img 
            src={video.thumbnail} 
            alt={video.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
          
          {/* Play Overlay / Select Overlay */}
          <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/30 transition-all duration-300">
            {onSelect ? (
              <div className="px-4 py-2 btn-gradient font-bold rounded-lg shadow-lg transform scale-0 opacity-0 transition-all duration-300 group-hover:scale-100 group-hover:opacity-100 pointer-events-none">
                <span>Use for Watch Party</span>
              </div>
            ) : (
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-[var(--gradient-start)] to-[var(--gradient-end)] shadow-lg transform scale-0 opacity-0 transition-all duration-300 group-hover:scale-100 group-hover:opacity-100">
                <Play className="h-5 w-5 fill-white text-white ml-0.5" />
              </div>
            )}
          </div>
          
          {/* Duration Badge */}
          <div className="absolute bottom-2 right-2 rounded-lg bg-black/70 px-2 py-0.5 text-xs font-medium text-white backdrop-blur-sm border border-white/10">
            {formatDuration(video.duration)}
          </div>
        </div>
        
        <div className="mt-3 flex gap-3">
          {video.uploadedBy?.avatar ? (
            <img 
              src={video.uploadedBy.avatar} 
              alt={video.uploadedBy.name} 
              className="h-9 w-9 rounded-full object-cover mt-0.5 ring-2 ring-transparent group-hover:ring-[rgba(var(--primary-rgb),0.3)] transition-all duration-300"
            />
          ) : (
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-light text-sm font-medium mt-0.5 uppercase ring-2 ring-transparent group-hover:ring-[rgba(var(--primary-rgb),0.3)] transition-all duration-300">
              {video.uploadedBy?.name?.charAt(0) || '?'}
            </div>
          )}
          <div className="flex flex-col overflow-hidden">
            <h3 className="line-clamp-2 text-sm font-semibold text-text leading-tight group-hover:text-primary transition-colors duration-200">
              {video.title}
            </h3>
            <p className="mt-1 text-xs text-muted">
              {video.uploadedBy?.name || 'Unknown User'}
            </p>
            <div className="flex items-center text-xs text-muted mt-0.5">
              <span>{formatViews(video.views)} views</span>
              <span className="mx-1.5">•</span>
              <span>{new Date(video.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
            </div>
          </div>
        </div>
      </MotionWrapper>
    </Link>
  );
});
