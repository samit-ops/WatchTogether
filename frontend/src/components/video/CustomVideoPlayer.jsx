import React, { useState, useRef, useEffect } from 'react';
import { 
  Play, Pause, Volume2, VolumeX, Maximize, Minimize, 
  Settings, RotateCcw, RotateCw, SkipForward, X, RefreshCw
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { Loader } from '@/components/ui/Loader';
import { useSocket } from '@/contexts/SocketContext';

export function CustomVideoPlayer({ 
  src, poster, onEnded, isWatchParty = false, isHost = false, 
  roomId = null, playbackPermission = 'host', currentUserId = null,
  nextVideo = null, onNextVideo = null
}) {
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
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
  
  // Double tap gesture feedback (-10s / +10s overlay)
  const [gestureOverlay, setGestureOverlay] = useState(null); // { type: 'rewind' | 'forward', key: number }
  const [lastTapTime, setLastTapTime] = useState(0);

  // Next video auto-play overlay
  const [showNextOverlay, setShowNextOverlay] = useState(false);
  const [nextCountdown, setNextCountdown] = useState(5);
  const countdownTimerRef = useRef(null);

  const pipSupported = typeof document !== 'undefined' && document.pictureInPictureEnabled;
  
  const remoteSyncingRef = useRef(false);
  const { socket } = useSocket();

  const isController = playbackPermission === 'everyone' ? true : isHost;

  // Socket synchronization for Watch Party mode
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
    if (showNextOverlay) {
      cancelNextOverlay();
    }
    
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
    setIsBuffering(false);
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
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
    if (isMuted) videoRef.current.volume = volume || 0.5;
    else videoRef.current.volume = 0;
  };

  const handleVolumeChange = (e) => {
    if (!videoRef.current) return;
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
    if (!videoRef.current) return;
    videoRef.current.currentTime = Math.max(0, Math.min(realDuration, videoRef.current.currentTime + amount));
    if (isWatchParty && isController && !remoteSyncingRef.current) {
      socket?.emit('seek', { roomId, currentTime: videoRef.current.currentTime });
    }
    
    // Trigger visual ripple gesture indicator
    const type = amount < 0 ? 'rewind' : 'forward';
    setGestureOverlay({ type, key: Date.now() });
    setTimeout(() => setGestureOverlay(null), 800);
  };

  // Keyboard shortcut listener
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
          if (videoRef.current) videoRef.current.volume = upVol;
          if (upVol > 0) setIsMuted(false);
          break;
        case 'arrowdown':
          e.preventDefault();
          const downVol = Math.max(volume - 0.1, 0);
          setVolume(downVol);
          if (videoRef.current) videoRef.current.volume = downVol;
          if (downVol === 0) setIsMuted(true);
          break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, volume, isFullscreen, isController, realDuration]);

  // Touch / Mobile double tap gesture handler
  const handleContainerClick = (e) => {
    const now = Date.now();
    const tapDelay = now - lastTapTime;

    if (tapDelay < 300 && tapDelay > 0) {
      // Double tap detected
      const rect = containerRef.current.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const width = rect.width;

      if (clickX > width / 2) {
        skip(10); // Double tap right -> forward 10s
      } else {
        skip(-10); // Double tap left -> rewind 10s
      }
    } else {
      // Single click toggle play
      togglePlay();
    }

    setLastTapTime(now);
  };

  // Video completion & Next Video Countdown handler
  const handleVideoEnded = () => {
    setIsPlaying(false);
    if (onEnded) onEnded();
    if (isWatchParty && isController) {
      socket?.emit('video-ended', { roomId });
    }

    if (nextVideo && onNextVideo) {
      setShowNextOverlay(true);
      setNextCountdown(5);
      
      clearInterval(countdownTimerRef.current);
      let count = 5;
      countdownTimerRef.current = setInterval(() => {
        count -= 1;
        setNextCountdown(count);
        if (count <= 0) {
          clearInterval(countdownTimerRef.current);
          setShowNextOverlay(false);
          onNextVideo();
        }
      }, 1000);
    }
  };

  const cancelNextOverlay = () => {
    clearInterval(countdownTimerRef.current);
    setShowNextOverlay(false);
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
      className="relative group w-full aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl flex items-center justify-center select-none"
      onMouseMove={handleMouseMove}
      onMouseLeave={() => isPlaying && setShowControls(false)}
      onClick={handleContainerClick}
    >
      {/* HTML5 Video element */}
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        className={cn("w-full h-full object-contain cursor-pointer", !isController && "cursor-default")}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onWaiting={() => setIsBuffering(true)}
        onPlaying={() => { setIsBuffering(false); setIsPlaying(true); }}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onCanPlay={() => setIsBuffering(false)}
        onSeeking={() => setIsBuffering(true)}
        onSeeked={() => setIsBuffering(false)}
        onEnded={handleVideoEnded}
        playsInline
      />

      {/* Buffering Loader Overlay */}
      {isBuffering && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-xs pointer-events-none z-30">
          <Loader size={54} className="text-primary animate-spin" />
        </div>
      )}

      {/* Gesture Double Tap Indicator (-10s / +10s) */}
      {gestureOverlay && (
        <div 
          className={cn(
            "absolute top-1/2 -translate-y-1/2 flex flex-col items-center justify-center w-28 h-28 rounded-full bg-black/70 backdrop-blur-md text-white border border-white/20 z-40 pointer-events-none transition-all duration-300 animate-in fade-in zoom-in-75",
            gestureOverlay.type === 'rewind' ? "left-12" : "right-12"
          )}
        >
          {gestureOverlay.type === 'rewind' ? (
            <>
              <RotateCcw className="w-8 h-8 text-primary mb-1 animate-spin-reverse" />
              <span className="text-sm font-bold font-mono">-10 sec</span>
            </>
          ) : (
            <>
              <RotateCw className="w-8 h-8 text-primary mb-1 animate-spin" />
              <span className="text-sm font-bold font-mono">+10 sec</span>
            </>
          )}
        </div>
      )}

      {/* Center Big Play Icon when Paused */}
      {!isPlaying && !isBuffering && !showNextOverlay && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none bg-black/30 transition-opacity">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/90 shadow-2xl backdrop-blur-md transform transition-transform group-hover:scale-110">
            <Play className="h-10 w-10 fill-white text-white ml-1.5" />
          </div>
        </div>
      )}

      {/* Auto-Play Next Video Overlay */}
      {showNextOverlay && nextVideo && (
        <div 
          className="absolute inset-0 bg-black/85 backdrop-blur-md z-50 flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-300"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="max-w-md w-full bg-surface border border-border rounded-2xl p-6 shadow-2xl flex flex-col items-center">
            <span className="text-xs font-semibold text-primary uppercase tracking-wider mb-2">Up Next in {nextCountdown}s</span>
            <div className="relative w-full aspect-video rounded-xl overflow-hidden mb-4 border border-border">
              <img 
                src={nextVideo.thumbnail || nextVideo.thumbnailUrl} 
                alt={nextVideo.title} 
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                <Play className="w-12 h-12 text-white fill-current" />
              </div>
            </div>
            <h3 className="font-bold text-text text-base line-clamp-1 mb-4">{nextVideo.title}</h3>
            
            <div className="flex items-center gap-3 w-full">
              <button
                onClick={cancelNextOverlay}
                className="flex-1 py-2.5 px-4 bg-background hover:bg-surface-light border border-border text-text font-medium text-xs rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => { cancelNextOverlay(); onNextVideo(); }}
                className="flex-1 py-2.5 px-4 bg-primary hover:bg-blue-600 text-white font-medium text-xs rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                <SkipForward className="w-4 h-4 fill-current" />
                Play Now ({nextCountdown}s)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Controls Bar Overlay */}
      <div 
        className={cn(
          "absolute bottom-0 left-0 right-0 p-4 pt-12 bg-gradient-to-t from-black/95 via-black/60 to-transparent transition-opacity duration-300 flex flex-col gap-3 z-30",
          showControls || !isPlaying ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={(e) => e.stopPropagation()} 
      >
        {/* Video Progress Timeline Slider */}
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
        
        {/* Control Buttons Toolbar */}
        <div className="flex items-center justify-between text-white">
          <div className="flex items-center gap-3">
            {/* Play / Pause Toggle */}
            <button 
              onClick={togglePlay} 
              disabled={!isController && isWatchParty}
              className={cn("transition-colors focus:outline-none", isController ? "hover:text-primary" : "opacity-50 cursor-not-allowed")}
              title={isPlaying ? "Pause (Space/K)" : "Play (Space/K)"}
            >
              {isPlaying ? <Pause className="h-5 w-5 fill-current" /> : <Play className="h-5 w-5 fill-current" />}
            </button>
            
            {/* 10s Rewind Button */}
            <button 
              onClick={() => skip(-10)} 
              disabled={!isController && isWatchParty}
              className={cn("transition-colors focus:outline-none flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded hover:bg-white/10", isController ? "hover:text-primary" : "opacity-50 cursor-not-allowed")}
              title="Rewind 10s (Left Arrow / J)"
            >
              <RotateCcw className="h-4 w-4" />
              <span className="hidden sm:inline">-10s</span>
            </button>

            {/* 10s Forward Button */}
            <button 
              onClick={() => skip(10)} 
              disabled={!isController && isWatchParty}
              className={cn("transition-colors focus:outline-none flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded hover:bg-white/10", isController ? "hover:text-primary" : "opacity-50 cursor-not-allowed")}
              title="Forward 10s (Right Arrow / L)"
            >
              <RotateCw className="h-4 w-4" />
              <span className="hidden sm:inline">+10s</span>
            </button>

            {/* Next Video Button */}
            {nextVideo && onNextVideo && (
              <button
                onClick={onNextVideo}
                className="transition-colors focus:outline-none hover:text-primary flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded hover:bg-white/10"
                title={`Next: ${nextVideo.title}`}
              >
                <SkipForward className="h-4 w-4 fill-current" />
                <span className="hidden sm:inline">Next</span>
              </button>
            )}

            {/* Volume Control */}
            <div className="flex items-center gap-2 ml-1">
              <button onClick={toggleMute} className="hover:text-primary transition-colors focus:outline-none" title="Mute/Unmute (M)">
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
            
            {/* Playback Time Display */}
            <div className="text-xs font-medium font-mono ml-2">
              {formatTime(currentTime)} / {formatTime(realDuration)}
            </div>
          </div>
          
          <div className="flex items-center gap-4 relative">
            {/* Settings Menu Button */}
            <button 
              onClick={(e) => { e.stopPropagation(); setShowSettings(!showSettings); }}
              className="hover:text-primary transition-colors focus:outline-none" 
              title="Settings"
            >
              <Settings className="h-5 w-5" />
            </button>

            {/* Settings Popover */}
            {showSettings && (
              <div 
                className="absolute bottom-10 right-0 sm:right-10 bg-surface/95 backdrop-blur-md border border-border rounded-xl shadow-2xl p-2 min-w-[180px] text-sm z-50 text-text animate-in fade-in zoom-in-95 duration-150"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="py-1">
                  <div className="px-3 py-1 text-xs font-semibold text-muted uppercase">Playback Speed</div>
                  <div className="flex flex-wrap gap-1 px-2 mb-2">
                    {[0.5, 1, 1.25, 1.5, 2].map(speed => (
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
                  <span>Loop Video</span>
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

            {/* Fullscreen Toggle Button */}
            <button onClick={toggleFullscreen} className="hover:text-primary transition-colors focus:outline-none" title="Fullscreen (F)">
              {isFullscreen ? <Minimize className="h-5 w-5" /> : <Maximize className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
