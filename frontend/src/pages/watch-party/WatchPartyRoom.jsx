import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSocket } from '@/contexts/SocketContext';
import { useAuth } from '@/contexts/AuthContext';
import { useRoom } from '@/hooks/useRoom';
import { useWebRTC } from '@/hooks/useWebRTC';
import { useRecording } from '@/hooks/useRecording';
import { toast } from '@/utils/toast';
import { CustomVideoPlayer } from '@/components/video/CustomVideoPlayer';
import { Loader } from '@/components/ui/Loader';
import { ChatPanel } from '@/components/watch-party/ChatPanel';
import { ParticipantGrid } from '@/components/watch-party/ParticipantGrid';
import { ParticipantList } from '@/components/watch-party/ParticipantList';
import { Controls } from '@/components/watch-party/Controls';
import { InviteModal } from '@/components/watch-party/InviteModal';
import { LeaveConfirmModal } from '@/components/watch-party/LeaveConfirmModal';
import { MiniPipWindow } from '@/components/watch-party/MiniPipWindow';
import { Copy, Users, Activity, Link2, Settings, Shield, Lock, Unlock, MonitorUp, Maximize2, Minimize2, MessageSquare, ArrowLeft, Smartphone, Monitor } from 'lucide-react';
import { cn } from '@/utils/cn';

export default function WatchPartyRoom() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { socket } = useSocket();
  const { user } = useAuth();
  
  const roomState = useRoom(socket, roomId);
  const { room, participants, isHost, myRole, isLocked, playbackPermission, meetingPermissions, roomType, error, loading, leaveRoom, kickParticipant, promoteParticipant, demoteParticipant, transferHost, lockRoom, unlockRoom, endRoom, updatePlaybackPermission, updateMeetingPermissions, setRecording: setRoomRecording } = roomState;
  
  const webrtc = useWebRTC(socket, roomId, participants, socket?.id);
  const { localStream, remoteStreams, remoteScreenStreams, screenStream, audioEnabled, videoEnabled, screenSharing, toggleAudio, toggleVideo, startScreenShare, stopScreenShare, cleanup } = webrtc;
  
  const recording = useRecording();
  
  const [activeScreenShare, setActiveScreenShare] = useState(null);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [isPipActive, setIsPipActive] = useState(false);
  const [activeTab, setActiveTab] = useState('grid'); // 'grid' | 'chat' | 'participants'
  const [showSettings, setShowSettings] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [screenOrientation, setScreenOrientation] = useState('landscape');

  const toggleScreenOrientation = async () => {
    const nextMode = screenOrientation === 'landscape' ? 'portrait' : 'landscape';
    setScreenOrientation(nextMode);

    if (window.screen?.orientation?.lock) {
      try {
        await window.screen.orientation.lock(nextMode);
      } catch (err) {
        console.log("[ScreenShare] Orientation lock unsupported/restricted:", err);
      }
    }
  };
  const [unreadCount, setUnreadCount] = useState(0);

  const activeTabRef = useRef(activeTab);
  activeTabRef.current = activeTab;

  const settingsRef = useRef(null);
  const screenShareVideoRef = useRef(null);
  const screenContainerRef = useRef(null);

  // Unread Chat Message Counter Badge
  useEffect(() => {
    if (!socket) return;
    const handleReceiveMessage = () => {
      if (activeTabRef.current !== 'chat') {
        setUnreadCount(prev => prev + 1);
      }
    };
    socket.on('receive-message', handleReceiveMessage);
    return () => socket.off('receive-message', handleReceiveMessage);
  }, [socket]);

  // Native Browser / System Picture-in-Picture on App Exit / Minimization / Visibility Change
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        const videoEl = document.querySelector('video');
        if (videoEl && document.pictureInPictureEnabled && !document.pictureInPictureElement) {
          videoEl.requestPictureInPicture().catch(e => console.log('[System PiP]', e));
        }
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  // Mobile Hardware / Browser Back Button Interception -> Picture in Picture Mode
  useEffect(() => {
    window.history.pushState({ roomSession: true }, '');

    const handlePopState = () => {
      // Intercept mobile back button press: minimize into floating PiP mode instead of disconnecting!
      setIsPipActive(true);
      toast.info('Meeting minimized to Picture-in-Picture mode');
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const toggleFullscreen = () => {
    if (!screenContainerRef.current) return;
    if (!document.fullscreenElement) {
      screenContainerRef.current.requestFullscreen().then(() => setIsFullscreen(true)).catch(err => console.error(err));
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(err => console.error(err));
    }
  };

  useEffect(() => {
    if (!socket) return;
    
    const handleScreenStarted = ({ socketId }) => setActiveScreenShare(socketId);
    const handleScreenStopped = ({ socketId }) => {
      setActiveScreenShare(prev => prev === socketId ? null : prev);
    };

    socket.on('screen-share-started', handleScreenStarted);
    socket.on('screen-share-stopped', handleScreenStopped);

    return () => {
      socket.off('screen-share-started', handleScreenStarted);
      socket.off('screen-share-stopped', handleScreenStopped);
    };
  }, [socket]);

  const screenSharerParticipant = participants.find(p => p.isScreenSharing);
  const effectiveScreenShareId = activeScreenShare || screenSharerParticipant?.socketId;
  const isLocalScreenShare = screenSharing || (effectiveScreenShareId && effectiveScreenShareId === socket?.id);
  const currentScreenStream = isLocalScreenShare ? screenStream : (effectiveScreenShareId ? remoteScreenStreams[effectiveScreenShareId] : null);

  useEffect(() => {
    if (effectiveScreenShareId && !isLocalScreenShare && screenShareVideoRef.current && currentScreenStream) {
      screenShareVideoRef.current.srcObject = currentScreenStream;
    }
  }, [effectiveScreenShareId, isLocalScreenShare, currentScreenStream]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (settingsRef.current && !settingsRef.current.contains(e.target)) {
        setShowSettings(false);
      }
    };
    if (showSettings) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showSettings]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-4rem)] bg-background">
        <h2 className="text-2xl font-bold text-red-500 mb-4">{error}</h2>
        <button onClick={() => navigate('/')} className="px-6 py-2 bg-primary text-white rounded-lg">Go Home</button>
      </div>
    );
  }

  if (loading || !room) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)] bg-background">
        <Loader className="w-8 h-8 text-primary" />
      </div>
    );
  }

  const handleToggleAudio = () => {
    if (!meetingPermissions?.mic && !isHost && myRole !== 'moderator') {
      toast.error('Mic disabled by host');
      return;
    }
    toggleAudio();
  };

  const handleToggleVideo = () => {
    if (!meetingPermissions?.camera && !isHost && myRole !== 'moderator') {
      toast.error('Camera disabled by host');
      return;
    }
    toggleVideo();
  };

  const handleToggleScreen = () => {
    if (!meetingPermissions?.screenShare && !isHost && myRole !== 'moderator') {
      toast.error('Screen sharing disabled by host');
      return;
    }
    if (screenSharing) stopScreenShare();
    else startScreenShare();
  };

  const handleStartRecording = async () => {
    let streamToRecord = localStream;
    if (!streamToRecord || streamToRecord.getTracks().length === 0) {
      try {
        streamToRecord = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
      } catch (err) {
        toast.error('Local recording requires screen or media permissions');
        return;
      }
    }
    recording.startRecording(streamToRecord);
    setRoomRecording(true);
    socket?.emit('recording-start', { roomId });
  };

  const handleStopRecording = () => {
    recording.stopRecording();
    setRoomRecording(false);
    socket?.emit('recording-stop', { roomId });
  };

  const handleConfirmLeave = () => {
    cleanup();
    leaveRoom();
    setShowLeaveModal(false);
    setIsPipActive(false);
    navigate('/');
  };

  const safeEndRoom = () => {
    endRoom();
    cleanup();
    toast.success('Room ended');
    navigate('/');
  };

  const handleToggleTab = (tab) => {
    setActiveTab(prev => {
      const next = prev === tab ? 'grid' : tab;
      if (next === 'chat') setUnreadCount(0);
      return next;
    });
  };

  const renderVideoArea = () => {
    if (effectiveScreenShareId) {
      return (
        <div 
          ref={screenContainerRef} 
          className={cn(
            "w-full h-full bg-black flex items-center justify-center relative p-2 sm:p-4 group transition-all",
            isFullscreen && (screenOrientation === 'portrait' ? "max-w-[540px] aspect-[9/16] mx-auto border-x border-border/40" : "w-full h-full aspect-video")
          )}
        >
          <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
            {isFullscreen && (
              <button
                onClick={toggleScreenOrientation}
                className="p-2.5 rounded-xl bg-black/60 hover:bg-black/80 text-white backdrop-blur-sm transition-all opacity-80 hover:opacity-100 shadow-lg flex items-center gap-1.5 text-xs font-semibold"
                title={`Switch to ${screenOrientation === 'landscape' ? 'Portrait' : 'Landscape'} mode`}
              >
                {screenOrientation === 'portrait' ? <Smartphone className="w-4 h-4 text-primary" /> : <Monitor className="w-4 h-4 text-primary" />}
                <span className="capitalize hidden sm:inline">{screenOrientation}</span>
              </button>
            )}
            <button
              onClick={toggleFullscreen}
              className="p-2.5 rounded-xl bg-black/60 hover:bg-black/80 text-white backdrop-blur-sm transition-all opacity-80 hover:opacity-100 shadow-lg"
              title={isFullscreen ? "Exit Fullscreen" : "Fullscreen Screen Share"}
            >
              {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
            </button>
          </div>

          {isLocalScreenShare ? (
            <div className="flex flex-col items-center justify-center text-center max-w-lg bg-surface border border-border p-6 rounded-3xl shadow-2xl">
              <div className="w-16 h-16 rounded-full bg-blue-500/20 text-blue-500 flex items-center justify-center mb-4 animate-pulse">
                <MonitorUp className="w-8 h-8" />
              </div>
              <h2 className="text-xl font-bold text-text mb-2">You are sharing your screen</h2>
              <p className="text-muted text-sm mb-6">
                Your screen is being broadcast live to all participants.
              </p>
              <button
                onClick={stopScreenShare}
                className="px-6 py-2.5 bg-red-500 hover:bg-red-600 text-white font-medium text-sm rounded-xl transition-colors"
              >
                Stop Presenting
              </button>
            </div>
          ) : (
            <video 
              ref={(node) => {
                screenShareVideoRef.current = node;
                if (node && currentScreenStream && node.srcObject !== currentScreenStream) {
                  node.srcObject = currentScreenStream;
                }
              }} 
              autoPlay 
              playsInline 
              muted={false}
              className={cn("w-full h-full max-w-full max-h-full object-contain rounded-xl shadow-2xl", isFullscreen && screenOrientation === 'portrait' && "max-h-[90vh]")}
            />
          )}
        </div>
      );
    }

    if (roomType === 'live') {
      return (
        <div className="w-full h-full overflow-y-auto">
          <ParticipantGrid 
            localStream={localStream} 
            remoteStreams={remoteStreams} 
            participants={participants} 
            currentUserId={user?._id || user?.id} 
          />
        </div>
      );
    } else {
      return (
        <div className="w-full h-full flex items-center justify-center p-2 sm:p-4">
          <CustomVideoPlayer 
            src={room.video?.videoUrl} 
            poster={room.video?.thumbnailUrl || room.video?.thumbnail} 
            isWatchParty={true} 
            isHost={isHost} 
            roomId={roomId} 
            playbackPermission={playbackPermission} 
            currentUserId={user?._id || user?.id} 
          />
        </div>
      );
    }
  };

  // Render Picture in Picture Floating Window if minimized
  if (isPipActive) {
    return (
      <div className="min-h-[calc(100vh-4rem)] bg-background p-8 flex flex-col items-center justify-center text-center">
        <h2 className="text-2xl font-bold text-text mb-2">Meeting Active in Background</h2>
        <p className="text-muted text-sm mb-6 max-w-md">
          You are currently in Watch Party room <span className="font-mono font-bold text-primary">{roomId}</span>. Your audio and video streams remain active in floating Picture-in-Picture mode.
        </p>
        <button
          onClick={() => setIsPipActive(false)}
          className="px-6 py-3 bg-primary hover:bg-primary/90 text-white font-semibold rounded-xl flex items-center gap-2 transition-colors shadow-xl"
        >
          <Maximize2 className="w-5 h-5" />
          Return to Meeting
        </button>

        <MiniPipWindow
          localStream={localStream}
          remoteStreams={remoteStreams}
          participants={participants}
          currentUserId={user?._id || user?.id}
          audioEnabled={audioEnabled}
          videoEnabled={videoEnabled}
          onToggleAudio={handleToggleAudio}
          onToggleVideo={handleToggleVideo}
          onExpand={() => setIsPipActive(false)}
          onLeave={() => setShowLeaveModal(true)}
        />

        <LeaveConfirmModal
          isOpen={showLeaveModal}
          onClose={() => setShowLeaveModal(false)}
          onConfirm={handleConfirmLeave}
          isHost={isHost}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-background overflow-hidden relative">
      {/* Top Bar */}
      <div className="h-14 sm:h-16 border-b border-border bg-surface flex items-center justify-between px-3 sm:px-4 shrink-0 z-30">
        <div className="flex items-center gap-3 sm:gap-4">
          <button
            onClick={() => setIsPipActive(true)}
            className="p-1.5 rounded-lg hover:bg-white/10 text-muted hover:text-text transition-colors"
            title="Minimize to Picture-in-Picture"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <h1 className="text-base sm:text-lg font-bold text-text truncate max-w-[150px] sm:max-w-xs md:max-w-md">
            {room.video?.title || 'Live Watch Party'}
          </h1>
          
          <div className="hidden md:flex items-center gap-2 bg-background px-3 py-1 rounded-full border border-border text-xs font-mono text-muted">
            <Activity className="w-3.5 h-3.5 text-green-500" />
            {roomId}
          </div>

          <button 
            onClick={() => setShowInviteModal(true)}
            className="flex items-center gap-1.5 text-xs sm:text-sm text-primary hover:text-primary/80 transition-colors bg-primary/10 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full"
          >
            <Link2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Invite</span>
          </button>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-text text-xs sm:text-sm bg-background px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full border border-border">
            <Users className="w-3.5 h-3.5 text-primary" />
            {participants.length}
          </div>
          
          {isHost && (
            <div className="relative" ref={settingsRef}>
              <button 
                onClick={() => setShowSettings(!showSettings)}
                className="p-2 rounded-full hover:bg-white/10 text-muted hover:text-text transition-colors focus:outline-none"
              >
                <Settings className="w-5 h-5" />
              </button>
              
              {showSettings && (
                <div className="absolute right-0 top-full mt-2 w-64 bg-surface border border-border rounded-xl shadow-2xl z-50 py-2">
                  <div className="px-4 py-2 border-b border-border/50">
                    <h3 className="font-semibold text-text text-sm">Host Settings</h3>
                  </div>
                  
                  <div className="px-4 py-2 border-b border-border/50">
                    <button 
                      onClick={() => { isLocked ? unlockRoom() : lockRoom(); setShowSettings(false); }}
                      className="w-full flex items-center justify-between py-1.5 text-sm hover:text-primary transition-colors text-text"
                    >
                      <span>Room Lock</span>
                      {isLocked ? <Lock className="w-4 h-4 text-red-500" /> : <Unlock className="w-4 h-4 text-green-500" />}
                    </button>
                  </div>

                  {roomType === 'video' && (
                    <div className="px-4 py-2 border-b border-border/50">
                      <div className="text-xs text-muted mb-2 font-medium">Playback Permission</div>
                      <select 
                        value={playbackPermission} 
                        onChange={(e) => updatePlaybackPermission(e.target.value)}
                        className="w-full bg-background border border-border rounded px-2 py-1 text-sm text-text"
                      >
                        <option value="host">Host Only</option>
                        <option value="moderator">Moderators</option>
                        <option value="everyone">Everyone</option>
                      </select>
                    </div>
                  )}

                  <div className="px-4 py-2 border-b border-border/50">
                    <div className="text-xs text-muted mb-2 font-medium">Meeting Permissions</div>
                    <label className="flex items-center justify-between py-1 text-sm text-text cursor-pointer">
                      <span>Allow Mic</span>
                      <input type="checkbox" checked={meetingPermissions?.mic} onChange={(e) => updateMeetingPermissions({ mic: e.target.checked })} className="accent-primary" />
                    </label>
                    <label className="flex items-center justify-between py-1 text-sm text-text cursor-pointer">
                      <span>Allow Camera</span>
                      <input type="checkbox" checked={meetingPermissions?.camera} onChange={(e) => updateMeetingPermissions({ camera: e.target.checked })} className="accent-primary" />
                    </label>
                    <label className="flex items-center justify-between py-1 text-sm text-text cursor-pointer">
                      <span>Allow Screen Share</span>
                      <input type="checkbox" checked={meetingPermissions?.screenShare} onChange={(e) => updateMeetingPermissions({ screenShare: e.target.checked })} className="accent-primary" />
                    </label>
                  </div>

                  <div className="px-4 py-2 mt-1">
                    <button onClick={safeEndRoom} className="w-full text-center py-1.5 text-sm font-medium text-red-500 hover:bg-red-500/10 rounded transition-colors">
                      End Watch Party
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
        {/* Mobile View with Chat Open -> Compact PiP Top Preview + Bottom Chat */}
        {activeTab !== 'grid' && (
          <div className="md:hidden flex flex-col h-full w-full">
            {/* Top Compact Mini Video Preview */}
            <div className="h-44 shrink-0 bg-black relative border-b border-border">
              {renderVideoArea()}
            </div>

            {/* Bottom Panel */}
            <div className="flex-1 overflow-hidden bg-surface">
              {activeTab === 'chat' && (
                <ChatPanel 
                  socket={socket} 
                  roomId={roomId} 
                  user={user} 
                  chatEnabled={meetingPermissions?.chat !== false} 
                />
              )}
              {activeTab === 'participants' && (
                <ParticipantList 
                  participants={participants} 
                  isHost={isHost} 
                  currentUserId={user?._id || user?.id}
                  onKick={kickParticipant}
                  onPromote={promoteParticipant}
                  onDemote={demoteParticipant}
                  onTransferHost={transferHost}
                />
              )}
            </div>
          </div>
        )}

        {/* Primary Desktop Layout / Mobile Full Grid View */}
        <div className={cn("flex-1 flex flex-col bg-black relative transition-all", activeTab !== 'grid' && "hidden md:flex")}>
          {renderVideoArea()}
        </div>

        {/* Desktop Sidebar Panel */}
        <div className={cn("hidden md:flex w-80 lg:w-96 flex-col border-l border-border bg-surface shrink-0 transition-all", activeTab === 'grid' && "md:hidden lg:flex")}>
          {(roomType === 'video' || Boolean(activeScreenShare)) && (
            <div className="h-48 shrink-0 border-b border-border p-2 overflow-y-auto">
              <ParticipantGrid 
                localStream={localStream} 
                remoteStreams={remoteStreams} 
                participants={participants} 
                currentUserId={user?._id || user?.id} 
              />
            </div>
          )}
          
          <div className="flex items-center border-b border-border h-12 shrink-0">
            <button 
              onClick={() => setActiveTab('chat')}
              className={cn("flex-1 h-full text-sm font-medium transition-colors border-b-2", activeTab === 'chat' ? "border-primary text-primary" : "border-transparent text-muted hover:text-text")}
            >
              Chat
            </button>
            <button 
              onClick={() => setActiveTab('participants')}
              className={cn("flex-1 h-full text-sm font-medium transition-colors border-b-2", activeTab === 'participants' ? "border-primary text-primary" : "border-transparent text-muted hover:text-text")}
            >
              Participants
            </button>
          </div>
          
          <div className="flex-1 overflow-hidden">
            {activeTab === 'participants' ? (
              <ParticipantList 
                participants={participants} 
                isHost={isHost} 
                currentUserId={user?._id || user?.id}
                onKick={kickParticipant}
                onPromote={promoteParticipant}
                onDemote={demoteParticipant}
                onTransferHost={transferHost}
              />
            ) : (
              <ChatPanel 
                socket={socket} 
                roomId={roomId} 
                user={user} 
                chatEnabled={meetingPermissions?.chat !== false} 
              />
            )}
          </div>
        </div>
      </div>

      {/* Controls Bar */}
      <Controls 
        audioEnabled={audioEnabled}
        videoEnabled={videoEnabled}
        screenSharing={screenSharing}
        isRecording={recording.isRecording}
        isHost={isHost}
        roomType={roomType}
        activeTab={activeTab}
        unreadCount={unreadCount}
        onToggleTab={handleToggleTab}
        onToggleAudio={handleToggleAudio}
        onToggleVideo={handleToggleVideo}
        onToggleScreen={handleToggleScreen}
        onStartRecording={handleStartRecording}
        onStopRecording={handleStopRecording}
        onLeave={() => setShowLeaveModal(true)}
        micDisabled={!meetingPermissions?.mic && !isHost && myRole !== 'moderator'}
        cameraDisabled={!meetingPermissions?.camera && !isHost && myRole !== 'moderator'}
        screenDisabled={!meetingPermissions?.screenShare && !isHost && myRole !== 'moderator'}
      />

      <InviteModal 
        roomId={roomId} 
        isOpen={showInviteModal} 
        onClose={() => setShowInviteModal(false)} 
      />

      <LeaveConfirmModal
        isOpen={showLeaveModal}
        onClose={() => setShowLeaveModal(false)}
        onConfirm={handleConfirmLeave}
        isHost={isHost}
      />
    </div>
  );
}
