import React, { useState, useRef, useEffect } from 'react';
import { 
  Play, Pause, Volume2, VolumeX, Maximize, Minimize, 
  Settings, SkipBack, SkipForward
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { useSocket } from '@/contexts/SocketContext';

export function CustomVideoPlayer({ 
  src, poster, onEnded, isWatchParty = false, isHost = false, 
  roomId = null, playbackPermission = 'host', currentUserId = null
}) {
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
  
  const remoteSyncingRef = useRef(false);
  const { socket } = useSocket();

  const isController = playbackPermission === 'everyone' ? true : isHost;

  useEffect(() => {
    if (!socket || !isWatchParty) return;

    socket.emit('request-sync', { roomId });

    const handleSyncTime = (data) => {
      if (videoRef.current) {
        remoteSyncingRef.current = true;
        
        if (Math.abs(videoRef.current.currentTime - data.currentTime) > 1) {
          videoRef.current.currentTime = data.currentTime;
        }
        
        videoRef.current.playbackRate = data.playbackRate;
        setPlaybackSpeed(data.playbackRate);
        
        if (data.isPlaying && videoRef.current.paused) {
          videoRef.current.play().catch(console.error);
          setIsPlaying(true);
        } else if (!data.isPlaying && !videoRef.current.paused) {
          videoRef.current.pause();
          setIsPlaying(false);
        }
        setTimeout(() => { remoteSyncingRef.current = false; }, 500);
      }
    };

    const handlePlay = (data) => {
      if (data.updatedBy === currentUserId) return;
      if (videoRef.current) {
        remoteSyncingRef.current = true;
        if (Math.abs(videoRef.current.currentTime - data.currentTime) > 1) {
          videoRef.current.currentTime = data.currentTime;
        }
        videoRef.current.play().catch(console.error);
        setIsPlaying(true);
        setTimeout(() => { remoteSyncingRef.current = false; }, 500);
      }
    };

    const handlePause = (data) => {
      if (data.updatedBy === currentUserId) return;
      if (videoRef.current) {
        remoteSyncingRef.current = true;
        videoRef.current.pause();
        videoRef.current.currentTime = data.currentTime;
        setIsPlaying(false);
        setTimeout(() => { remoteSyncingRef.current = false; }, 500);
      }
    };

    const handleSeek = (data) => {
      if (data.updatedBy === currentUserId) return;
      if (videoRef.current) {
        remoteSyncingRef.current = true;
        videoRef.current.currentTime = data.currentTime;
        setTimeout(() => { remoteSyncingRef.current = false; }, 500);
      }
    };

    const handlePlaybackRate = (data) => {
      if (data.updatedBy === currentUserId) return;
      if (videoRef.current) {
        videoRef.current.playbackRate = data.rate;
        setPlaybackSpeed(data.rate);
      }
    };

    socket.on('sync-time', handleSyncTime);
    socket.on('play', handlePlay);
    socket.on('pause', handlePause);
    socket.on('seek', handleSeek);
    socket.on('playback-rate', handlePlaybackRate);

    return () => {
      socket.off('sync-time', handleSyncTime);
      socket.off('play', handlePlay);
      socket.off('pause', handlePause);
      socket.off('seek', handleSeek);
      socket.off('playback-rate', handlePlaybackRate);
    };
  }, [socket, isWatchParty, roomId, currentUserId]);
  
  const controlsTimeoutRef = useRef(null);
  
  const handleMouseMove = () => {
    setShowControls(true);
    clearTimeout(controlsTimeoutRef.current);
    if (isPlaying) {
      controlsTimeoutRef.current = setTimeout(() => setShowControls(false), 3000);
    }
  };
  
  const togglePlay = () => {
    if (isWatchParty && !isController) return;
    
    if (videoRef.current.paused) {
      videoRef.current.play().catch(e => console.log("Play interrupted", e));
      setIsPlaying(true);
      if (isWatchParty && isController && !remoteSyncingRef.current) {
        socket?.emit('play', { roomId, currentTime: videoRef.current.currentTime });
      }
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
      if (isWatchParty && isController && !remoteSyncingRef.current) {
        socket?.emit('pause', { roomId, currentTime: videoRef.current.currentTime });
      }
    }
  };

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const current = videoRef.current.currentTime;
    const dur = videoRef.current.duration;
    setCurrentTime(current);
    if (dur && !isNaN(dur) && dur > 0 && duration !== dur) {
      setDuration(dur);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current && videoRef.current.duration) {
      setDuration(videoRef.current.duration);
    }
  };

  const realDuration = (videoRef.current && !isNaN(videoRef.current.duration) && videoRef.current.duration > 0)
    ? videoRef.current.duration
    : duration;

  const currentProgress = realDuration > 0 ? (currentTime / realDuration) * 100 : 0;

  const handleProgressChange = (e) => {
    if (isWatchParty && !isController) return;
    const val = parseFloat(e.target.value);
    if (realDuration > 0 && videoRef.current) {
      const newTime = (val / 100) * realDuration;
      videoRef.current.currentTime = newTime;
      setCurrentTime(newTime);
      if (isWatchParty && isController && !remoteSyncingRef.current) {
        socket?.emit('seek', { roomId, currentTime: newTime });
      }
    }
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
    if (isWatchParty && !isController) return;
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
      setPlaybackSpeed(speed);
      if (isWatchParty && isController && !remoteSyncingRef.current) {
        socket?.emit('playback-rate', { roomId, rate: speed });
      }
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
    if (isWatchParty && !isController) return;
    videoRef.current.currentTime += amount;
    if (isWatchParty && isController && !remoteSyncingRef.current) {
      socket?.emit('seek', { roomId, currentTime: videoRef.current.currentTime });
    }
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
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
          e.preventDefault();
          skip(10);
          break;
        case 'arrowleft':
          e.preventDefault();
          skip(-10);
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
  }, [isPlaying, volume, isFullscreen, isController]);

  const [lastTap, setLastTap] = useState(0);
  
  const handleTouchEnd = (e) => {
    const currentTimeTap = new Date().getTime();
    const tapLength = currentTimeTap - lastTap;
    if (tapLength < 500 && tapLength > 0) {
      const touchX = e.changedTouches[0].clientX;
      const screenWidth = window.innerWidth;
      if (touchX > screenWidth / 2) {
        skip(10);
      } else {
        skip(-10);
      }
      e.preventDefault();
    }
    setLastTap(currentTimeTap);
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
        className={cn("w-full h-full object-contain cursor-pointer", !isController && "cursor-default")}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={() => { 
          setIsPlaying(false); 
          if(onEnded) onEnded(); 
          if(isWatchParty && isController) {
            socket?.emit('video-ended', { roomId });
          }
        }}
        onClick={(e) => { e.stopPropagation(); togglePlay(); }}
        playsInline
      />
      
      {!isPlaying && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none bg-black/20">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/90 shadow-xl backdrop-blur-md transform transition-transform group-hover:scale-110">
            <Play className="h-8 w-8 fill-white text-white ml-1" />
          </div>
        </div>
      )}

      <div 
        className={cn(
          "absolute bottom-0 left-0 right-0 p-4 pt-12 bg-gradient-to-t from-black/90 via-black/50 to-transparent transition-opacity duration-300 flex flex-col gap-3",
          showControls || !isPlaying ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={(e) => e.stopPropagation()} 
      >
        {/* Video Progress Bar */}
        <div className="w-full flex items-center gap-2 group/progress">
          <div className={cn("relative h-2 flex-1 rounded-full bg-white/20 transition-all overflow-hidden", isController && "cursor-pointer group-hover/progress:h-2.5")}>
            <div 
              className="absolute top-0 left-0 h-full bg-primary rounded-full transition-all duration-75"
              style={{ width: `${Math.min(100, Math.max(0, currentProgress))}%` }}
            />
            {isController && (
              <input
                type="range"
                min="0"
                max="100"
                step="0.1"
                value={currentProgress || 0}
                onChange={handleProgressChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
            )}
          </div>
        </div>
        
        {/* Control Buttons Row */}
        <div className="flex items-center justify-between text-white">
          <div className="flex items-center gap-3">
            <button 
              onClick={togglePlay} 
              disabled={!isController && isWatchParty}
              className={cn("transition-colors focus:outline-none", isController ? "hover:text-primary" : "opacity-50 cursor-not-allowed")}
            >
              {isPlaying ? <Pause className="h-5 w-5 fill-current" /> : <Play className="h-5 w-5 fill-current" />}
            </button>
            
            <button 
              onClick={() => skip(-10)} 
              disabled={!isController && isWatchParty}
              className={cn("transition-colors focus:outline-none hidden sm:block", isController ? "hover:text-primary" : "opacity-50 cursor-not-allowed")}
              title="Rewind 10s (J)"
            >
              <SkipBack className="h-4 w-4" />
            </button>
            <button 
              onClick={() => skip(10)} 
              disabled={!isController && isWatchParty}
              className={cn("transition-colors focus:outline-none hidden sm:block", isController ? "hover:text-primary" : "opacity-50 cursor-not-allowed")}
              title="Forward 10s (L)"
            >
              <SkipForward className="h-4 w-4" />
            </button>

            {/* Volume Control */}
            <div className="flex items-center gap-2">
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
                className="w-16 sm:w-20 h-1 accent-primary cursor-pointer rounded-lg bg-white/20"
              />
            </div>
            
            <div className="text-xs font-medium font-mono ml-1">
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
                        disabled={!isController && isWatchParty}
                        className={cn(
                          "px-2 py-1 rounded text-xs font-medium transition-colors",
                          playbackSpeed === speed ? "bg-primary text-white" : "hover:bg-white/10",
                          !isController && isWatchParty && "opacity-50 cursor-not-allowed"
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
