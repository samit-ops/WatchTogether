import React from 'react';
import { cn } from '@/utils/cn';
import { Phone, PhoneOff, Video, VideoOff, LogOut, MessageSquare, Users } from 'lucide-react';
import { toast } from '@/utils/toast';
import { ScreenShareButton } from './ScreenShareButton';
import { RecordingButton } from './RecordingButton';

export function Controls({
  audioEnabled, videoEnabled, screenSharing, isRecording,
  isHost, roomType, activeTab, unreadCount = 0, onToggleTab,
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
    <div className="h-20 bg-surface border-t border-border flex items-center justify-center gap-3 sm:gap-4 px-4 w-full shrink-0 z-40">
      <button
        onClick={handleMicClick}
        className={cn(
          "h-12 w-12 rounded-full flex items-center justify-center transition-colors focus:outline-none",
          audioEnabled ? "bg-green-500/20 text-green-500 hover:bg-green-500/30" : "bg-red-500/20 text-red-500 hover:bg-red-500/30",
          micDisabled && "opacity-50 cursor-not-allowed"
        )}
        title={audioEnabled ? "Mute Mic" : "Unmute Mic"}
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
        title={videoEnabled ? "Turn Off Camera" : "Turn On Camera"}
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

      {/* Chat toggle button with unread message badge */}
      <button
        onClick={() => onToggleTab('chat')}
        className={cn(
          "h-12 w-12 rounded-full flex items-center justify-center transition-colors focus:outline-none relative",
          activeTab === 'chat' ? "bg-primary text-white" : "bg-surface border border-border text-text hover:bg-white/10"
        )}
        title="Toggle Chat"
      >
        <MessageSquare className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-extrabold rounded-full h-5 min-w-[20px] px-1 flex items-center justify-center border-2 border-surface animate-bounce shadow-lg">
            {unreadCount > 10 ? '10+' : unreadCount}
          </span>
        )}
      </button>

      {/* Participants toggle button */}
      <button
        onClick={() => onToggleTab('participants')}
        className={cn(
          "h-12 w-12 rounded-full flex items-center justify-center transition-colors focus:outline-none relative md:hidden",
          activeTab === 'participants' ? "bg-primary text-white" : "bg-surface border border-border text-text hover:bg-white/10"
        )}
        title="Toggle Participants"
      >
        <Users className="w-5 h-5" />
      </button>

      <button
        onClick={onLeave}
        className="h-12 w-12 rounded-full flex items-center justify-center bg-red-500 hover:bg-red-600 text-white transition-colors focus:outline-none ml-2 sm:ml-4"
        title="Leave Room"
      >
        <LogOut className="w-5 h-5" />
      </button>
    </div>
  );
}
