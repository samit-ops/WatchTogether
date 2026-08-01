import React from 'react';
import { Link } from 'react-router-dom';
import { Play } from 'lucide-react';

export function VideoCard({ video, onSelect }) {
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

  return (
    <Link to={`/video/${video._id}`} onClick={handleCardClick} className="group block w-full">
      <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-surface">
        <img 
          src={video.thumbnail} 
          alt={video.title}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
        />
        
        {/* Play Overlay / Select Overlay */}
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          {onSelect ? (
            <div className="px-4 py-2 bg-primary text-white font-bold rounded-lg shadow-lg transform scale-90 transition-transform duration-300 group-hover:scale-100 pointer-events-none">
              Use for Watch Party
            </div>
          ) : (
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/90 shadow-lg backdrop-blur-sm transform scale-90 transition-transform duration-300 group-hover:scale-100">
              <Play className="h-6 w-6 fill-white text-white ml-1" />
            </div>
          )}
        </div>
        
        {/* Duration Badge */}
        <div className="absolute bottom-2 right-2 rounded bg-black/80 px-1.5 py-0.5 text-xs font-medium text-white backdrop-blur-md">
          {formatDuration(video.duration)}
        </div>
      </div>
      
      <div className="mt-3 flex gap-3">
        {video.uploadedBy?.avatar ? (
          <img 
            src={video.uploadedBy.avatar} 
            alt={video.uploadedBy.name} 
            className="h-9 w-9 rounded-full object-cover mt-0.5"
          />
        ) : (
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-light text-sm font-medium mt-0.5 uppercase">
            {video.uploadedBy?.name?.charAt(0) || '?'}
          </div>
        )}
        <div className="flex flex-col overflow-hidden">
          <h3 className="line-clamp-2 text-sm font-semibold text-text leading-tight group-hover:text-primary transition-colors">
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
    </Link>
  );
}
