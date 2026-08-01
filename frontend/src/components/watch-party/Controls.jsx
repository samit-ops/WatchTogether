import React from 'react';
import { cn } from '@/utils/cn';
import { Phone, PhoneOff, Video, VideoOff, MonitorUp, LogOut } from 'lucide-react';
import { toast } from '@/utils/toast';
import { ScreenShareButton } from './ScreenShareButton';
import { RecordingButton } from './RecordingButton';

export function Controls({
  audioEnabled, videoEnabled, screenSharing, isRecording,
  isHost, roomType,
  onToggleAudio, onToggleVideo, onToggleScreen, onStartRecording, onStopRecording, onLeave,
  micDisabled, cameraDisabled, screenDisabled
}) {
  const handleMicClick = () => {
    if (micDisabled) toast.error('Mic disabled by host');
    else onToggleAudio();
  };

  const handleCameraClick = () => {
    if (cameraDisabled) toast.error('Camera disabled by host');
    else onToggleVideo();
  };

  const handleScreenClick = () => {
    if (screenDisabled) toast.error('Screen sharing disabled by host');
    else onToggleScreen();
  };

  return (
    <div className="h-20 bg-surface border-t border-border flex items-center justify-center gap-4 px-4 w-full">
      <button
        onClick={handleMicClick}
        className={cn(
          "h-12 w-12 rounded-full flex items-center justify-center transition-colors focus:outline-none",
          audioEnabled ? "bg-green-500/20 text-green-500 hover:bg-green-500/30" : "bg-red-500/20 text-red-500 hover:bg-red-500/30",
          micDisabled && "opacity-50 cursor-not-allowed"
        )}
      >
        {audioEnabled ? <Phone className="w-5 h-5" /> : <PhoneOff className="w-5 h-5" />}
      </button>

      <button
        onClick={handleCameraClick}
        className={cn(
          "h-12 w-12 rounded-full flex items-center justify-center transition-colors focus:outline-none",
          videoEnabled ? "bg-green-500/20 text-green-500 hover:bg-green-500/30" : "bg-red-500/20 text-red-500 hover:bg-red-500/30",
          cameraDisabled && "opacity-50 cursor-not-allowed"
        )}
      >
        {videoEnabled ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
      </button>

      <ScreenShareButton 
        active={screenSharing}
        onClick={handleScreenClick}
        disabled={screenDisabled}
      />

      {isHost && (
        <RecordingButton
          isRecording={isRecording}
          onStart={onStartRecording}
          onStop={onStopRecording}
          isHost={isHost}
        />
      )}

      <button
        onClick={onLeave}
        className="h-12 w-12 rounded-full flex items-center justify-center bg-red-500 hover:bg-red-600 text-white transition-colors focus:outline-none ml-4"
        title="Leave Room"
      >
        <LogOut className="w-5 h-5" />
      </button>
    </div>
  );
}
