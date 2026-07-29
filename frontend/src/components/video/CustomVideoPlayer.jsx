import React, { useState, useRef, useEffect } from 'react';
import { 
  Play, Pause, Volume2, VolumeX, Maximize, Minimize, 
  Settings, SkipBack, SkipForward 
} from 'lucide-react';
import { cn } from '@/utils/cn';

export function CustomVideoPlayer({ src, poster, onEnded }) {
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [isLooping, setIsLooping] = useState(false);
  const pipSupported = typeof document !== 'undefined' && document.pictureInPictureEnabled;
  
  // Auto-hide controls timer
  const controlsTimeoutRef = useRef(null);
  
  const handleMouseMove = () => {
    setShowControls(true);
    clearTimeout(controlsTimeoutRef.current);
    if (isPlaying) {
      controlsTimeoutRef.current = setTimeout(() => setShowControls(false), 3000);
    }
  };
  
  const togglePlay = () => {
    if (videoRef.current.paused) {
      videoRef.current.play().catch(e => console.log("Play interrupted", e));
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  const handleTimeUpdate = () => {
    const current = videoRef.current.currentTime;
    const dur = videoRef.current.duration || 0;
    setCurrentTime(current);
    setProgress((current / dur) * 100);
  };

  const handleLoadedMetadata = () => {
    setDuration(videoRef.current.duration);
  };

  const handleProgressChange = (e) => {
    const newTime = (e.target.value / 100) * duration;
    videoRef.current.currentTime = newTime;
    setProgress(e.target.value);
  };

  const toggleMute = () => {
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
    if (isMuted) videoRef.current.volume = volume || 0.5;
    else videoRef.current.volume = 0;
  };

  const handleVolumeChange = (e) => {
    const newVol = parseFloat(e.target.value);
    videoRef.current.volume = newVol;
    setVolume(newVol);
    setIsMuted(newVol === 0);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(err => {
        console.error("Error attempting to enable fullscreen", err);
      });
    } else {
      document.exitFullscreen();
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const handleSpeedChange = (speed) => {
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
      setPlaybackSpeed(speed);
    }
    setShowSettings(false);
  };

  const toggleLoop = () => {
    if (videoRef.current) {
      videoRef.current.loop = !isLooping;
      setIsLooping(!isLooping);
    }
    setShowSettings(false);
  };

  const togglePip = async () => {
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else if (pipSupported && videoRef.current) {
        await videoRef.current.requestPictureInPicture();
      }
    } catch (err) {
      console.error("PiP error:", err);
    }
    setShowSettings(false);
  };

  const skip = (amount) => {
    videoRef.current.currentTime += amount;
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't trigger if user is typing in an input
      if (['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) return;
      
      switch(e.key.toLowerCase()) {
        case ' ':
        case 'k':
          e.preventDefault();
          togglePlay();
          break;
        case 'j':
          skip(-10);
          break;
        case 'l':
          skip(10);
          break;
        case 'f':
          toggleFullscreen();
          break;
        case 'm':
          toggleMute();
          break;
        case 'arrowright':
          skip(5);
          break;
        case 'arrowleft':
          skip(-5);
          break;
        case 'arrowup':
          e.preventDefault();
          const upVol = Math.min(volume + 0.1, 1);
          setVolume(upVol);
          videoRef.current.volume = upVol;
          if (upVol > 0) setIsMuted(false);
          break;
        case 'arrowdown':
          e.preventDefault();
          const downVol = Math.max(volume - 0.1, 0);
          setVolume(downVol);
          videoRef.current.volume = downVol;
          if (downVol === 0) setIsMuted(true);
          break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, volume, isFullscreen]);

  // Mobile double tap
  const [lastTap, setLastTap] = useState(0);
  
  const handleTouchEnd = (e) => {
    const currentTime = new Date().getTime();
    const tapLength = currentTime - lastTap;
    if (tapLength < 500 && tapLength > 0) {
      // Double tap detected
      const touchX = e.changedTouches[0].clientX;
      const screenWidth = window.innerWidth;
      if (touchX > screenWidth / 2) {
        skip(10);
      } else {
        skip(-10);
      }
      e.preventDefault();
    }
    setLastTap(currentTime);
  };

  const formatTime = (timeInSeconds) => {
    if (isNaN(timeInSeconds)) return '0:00';
    const m = Math.floor(timeInSeconds / 60);
    const s = Math.floor(timeInSeconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div 
      ref={containerRef}
      className="relative group w-full aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl flex items-center justify-center"
      onMouseMove={handleMouseMove}
      onMouseLeave={() => isPlaying && setShowControls(false)}
      onTouchEnd={handleTouchEnd}
      onClick={togglePlay}
    >
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        className="w-full h-full object-contain cursor-pointer"
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={() => { setIsPlaying(false); if(onEnded) onEnded(); }}
        onClick={(e) => { e.stopPropagation(); togglePlay(); }}
        playsInline
      />
      
      {/* Big Center Play Button for Initial State or Paused */}
      {!isPlaying && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none bg-black/20">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/90 shadow-xl backdrop-blur-md transform transition-transform group-hover:scale-110">
            <Play className="h-8 w-8 fill-white text-white ml-1" />
          </div>
        </div>
      )}

      {/* Controls Overlay */}
      <div 
        className={cn(
          "absolute bottom-0 left-0 right-0 p-4 pt-16 bg-gradient-to-t from-black/90 via-black/40 to-transparent transition-opacity duration-300 flex flex-col gap-2",
          showControls || !isPlaying ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={(e) => e.stopPropagation()} // Prevent toggling play when clicking controls
      >
        
        {/* Seek Bar */}
        <div className="relative group/progress h-1.5 flex-1 cursor-pointer rounded-full bg-white/20 hover:h-2 transition-all">
          <div 
            className="absolute top-0 left-0 h-full bg-primary rounded-full"
            style={{ width: `${progress}%` }}
          />
          <input
            type="range"
            min="0"
            max="100"
            value={progress || 0}
            onChange={handleProgressChange}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
        </div>
        
        <div className="flex items-center justify-between text-white pt-1">
          <div className="flex items-center gap-4">
            <button onClick={togglePlay} className="hover:text-primary transition-colors focus:outline-none">
              {isPlaying ? <Pause className="h-5 w-5 fill-current" /> : <Play className="h-5 w-5 fill-current" />}
            </button>
            
            <button onClick={() => skip(-10)} className="hover:text-primary transition-colors focus:outline-none hidden sm:block" title="Rewind 10s (J)">
              <SkipBack className="h-4 w-4" />
            </button>
            <button onClick={() => skip(10)} className="hover:text-primary transition-colors focus:outline-none hidden sm:block" title="Forward 10s (L)">
              <SkipForward className="h-4 w-4" />
            </button>

            <div className="flex items-center gap-2 group/volume">
              <button onClick={toggleMute} className="hover:text-primary transition-colors focus:outline-none">
                {isMuted || volume === 0 ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className="w-0 sm:w-20 opacity-0 sm:opacity-100 transition-all origin-left cursor-pointer accent-primary"
              />
            </div>
            
            <div className="text-xs font-medium font-mono hidden sm:block">
              {formatTime(currentTime)} / {formatTime(duration)}
            </div>
          </div>
          
          <div className="flex items-center gap-4 relative">
            <button 
              onClick={(e) => { e.stopPropagation(); setShowSettings(!showSettings); }}
              className="hover:text-primary transition-colors focus:outline-none" 
              title="Settings"
            >
              <Settings className="h-5 w-5" />
            </button>

            {showSettings && (
              <div 
                className="absolute bottom-10 right-0 sm:right-10 bg-surface/95 backdrop-blur-md border border-border rounded-lg shadow-xl p-2 min-w-[160px] text-sm z-50 text-text"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="py-1">
                  <div className="px-3 py-1 text-xs font-semibold text-muted uppercase">Speed</div>
                  <div className="flex flex-wrap gap-1 px-2 mb-2">
                    {[0.5, 1, 1.5, 2].map(speed => (
                      <button
                        key={speed}
                        onClick={() => handleSpeedChange(speed)}
                        className={cn(
                          "px-2 py-1 rounded text-xs font-medium transition-colors",
                          playbackSpeed === speed ? "bg-primary text-white" : "hover:bg-white/10"
                        )}
                      >
                        {speed}x
                      </button>
                    ))}
                  </div>
                </div>
                <div className="border-t border-border/50 my-1" />
                <button 
                  onClick={toggleLoop}
                  className="w-full text-left px-3 py-2 hover:bg-white/10 rounded flex justify-between items-center transition-colors"
                >
                  <span>Loop</span>
                  <span className="text-xs font-medium text-primary">{isLooping ? 'On' : 'Off'}</span>
                </button>
                {pipSupported && (
                  <button 
                    onClick={togglePip}
                    className="w-full text-left px-3 py-2 hover:bg-white/10 rounded flex justify-between items-center transition-colors"
                  >
                    <span>Picture-in-Picture</span>
                  </button>
                )}
              </div>
            )}

            <button onClick={toggleFullscreen} className="hover:text-primary transition-colors focus:outline-none" title="Fullscreen (F)">
              {isFullscreen ? <Minimize className="h-5 w-5" /> : <Maximize className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
