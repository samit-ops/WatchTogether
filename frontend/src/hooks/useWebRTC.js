import { useState, useEffect, useRef, useCallback } from 'react';
import { toast } from '@/utils/toast';

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' }
  ]
};

export function useWebRTC(socket, roomId, participants, currentSocketId) {
  const peersRef = useRef({});
  const pendingCandidatesRef = useRef({});
  const localStreamRef = useRef(null);
  const screenStreamRef = useRef(null);
  const screenSendersRef = useRef({});
  
  const [localStream, setLocalStream] = useState(null);
  const [remoteStreams, setRemoteStreams] = useState({});
  const [remoteScreenStreams, setRemoteScreenStreams] = useState({});
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [videoEnabled, setVideoEnabled] = useState(false);
  const [screenSharing, setScreenSharing] = useState(false);
  const [screenStream, setScreenStream] = useState(null);

  const drainPendingCandidates = useCallback((socketId, peer) => {
    const queue = pendingCandidatesRef.current[socketId] || [];
    while (queue.length) {
      const candidate = queue.shift();
      peer.addIceCandidate(new RTCIceCandidate(candidate)).catch(err => {
        console.error('[WebRTC] Error adding queued ICE candidate', err);
      });
    }
    pendingCandidatesRef.current[socketId] = [];
  }, []);

  const createPeer = useCallback((targetSocketId) => {
    console.log(`[WebRTC] Creating peer connection for ${targetSocketId}`);
    const peer = new RTCPeerConnection(ICE_SERVERS);
    
    // Add existing camera/audio tracks if available
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        peer.addTrack(track, localStreamRef.current);
      });
    }
    
    // Add screen track if currently sharing
    if (screenStreamRef.current) {
      const screenTrack = screenStreamRef.current.getVideoTracks()[0];
      if (screenTrack) {
        const sender = peer.addTrack(screenTrack, screenStreamRef.current);
        screenSendersRef.current[targetSocketId] = sender;
      }
    }

    peer.onicecandidate = (e) => {
      if (e.candidate && socket) {
        socket.emit('ice-candidate', { roomId, to: targetSocketId, candidate: e.candidate });
      }
    };
    
    peer.ontrack = (e) => {
      console.log(`[WebRTC] Track received from ${targetSocketId}:`, e.track.kind);

      if (e.track.kind === 'video') {
        setRemoteStreams(prev => {
          const existingStream = prev[targetSocketId];
          const existingVideoTrack = existingStream?.getVideoTracks().find(t => t.readyState === 'live');
          
          if (existingVideoTrack && existingVideoTrack.id !== e.track.id) {
            console.log(`[WebRTC] Second video track detected from ${targetSocketId} -> Assigning to Remote Screen Stream`);
            setRemoteScreenStreams(screenPrev => {
              const sStream = screenPrev[targetSocketId] || new MediaStream();
              if (!sStream.getTracks().includes(e.track)) sStream.addTrack(e.track);
              return { ...screenPrev, [targetSocketId]: sStream };
            });
            return prev;
          }

          const stream = existingStream || new MediaStream();
          if (!stream.getTracks().includes(e.track)) {
            stream.addTrack(e.track);
          }
          return { ...prev, [targetSocketId]: stream };
        });
      } else {
        setRemoteStreams(prev => {
          const stream = prev[targetSocketId] || new MediaStream();
          if (!stream.getTracks().includes(e.track)) {
            stream.addTrack(e.track);
          }
          return { ...prev, [targetSocketId]: stream };
        });
      }
    };
    
    peer.onconnectionstatechange = () => {
      console.log(`[WebRTC] Connection state for ${targetSocketId}: ${peer.connectionState}`);
      if (peer.connectionState === 'failed' || peer.connectionState === 'closed') {
        peer.close();
        delete peersRef.current[targetSocketId];
        delete screenSendersRef.current[targetSocketId];
        setRemoteStreams(prev => {
          const next = { ...prev };
          delete next[targetSocketId];
          return next;
        });
        setRemoteScreenStreams(prev => {
          const next = { ...prev };
          delete next[targetSocketId];
          return next;
        });
      }
    };

    return peer;
  }, [socket, roomId]);

  const makeOffer = useCallback(async (targetSocketId, peer) => {
    try {
      console.log(`[WebRTC] Initiating SDP offer to ${targetSocketId}`);
      const offer = await peer.createOffer();
      await peer.setLocalDescription(offer);
      if (socket) {
        socket.emit('offer', { roomId, to: targetSocketId, sdp: peer.localDescription });
      }
    } catch (err) {
      console.error(`[WebRTC] Error initiating offer to ${targetSocketId}:`, err);
    }
  }, [socket, roomId]);

  useEffect(() => {
    if (!socket || !currentSocketId) return;

    participants.forEach(p => {
      if (p.socketId && p.socketId !== currentSocketId) {
        if (!peersRef.current[p.socketId]) {
          if (currentSocketId > p.socketId) {
            const peer = createPeer(p.socketId);
            peersRef.current[p.socketId] = peer;
            makeOffer(p.socketId, peer);
          }
        }
      }
    });

    const activeSocketIds = participants.map(p => p.socketId);
    Object.keys(peersRef.current).forEach(socketId => {
      if (!activeSocketIds.includes(socketId)) {
        console.log(`[WebRTC] Cleaning up peer ${socketId}`);
        peersRef.current[socketId].close();
        delete peersRef.current[socketId];
        delete screenSendersRef.current[socketId];
        setRemoteStreams(prev => {
          const next = { ...prev };
          delete next[socketId];
          return next;
        });
        setRemoteScreenStreams(prev => {
          const next = { ...prev };
          delete next[socketId];
          return next;
        });
      }
    });
  }, [participants, currentSocketId, createPeer, makeOffer, socket]);

  useEffect(() => {
    if (!socket) return;
    
    const handleOffer = async ({ from, sdp }) => {
      console.log(`[WebRTC] Received offer from ${from}`);
      let peer = peersRef.current[from];
      if (!peer) {
        peer = createPeer(from);
        peersRef.current[from] = peer;
      }
      
      try {
        await peer.setRemoteDescription(new RTCSessionDescription(sdp));
        const answer = await peer.createAnswer();
        await peer.setLocalDescription(answer);
        socket.emit('answer', { roomId, to: from, sdp: peer.localDescription });
        drainPendingCandidates(from, peer);
      } catch (err) {
        console.error('[WebRTC] Error handling offer', err);
      }
    };
    
    const handleAnswer = async ({ from, sdp }) => {
      console.log(`[WebRTC] Received answer from ${from}`);
      const peer = peersRef.current[from];
      if (peer) {
        try {
          await peer.setRemoteDescription(new RTCSessionDescription(sdp));
          drainPendingCandidates(from, peer);
        } catch (err) {
          console.error('[WebRTC] Error handling answer', err);
        }
      }
    };
    
    const handleIceCandidate = async ({ from, candidate }) => {
      const peer = peersRef.current[from];
      if (peer && peer.remoteDescription && peer.remoteDescription.type) {
        try {
          await peer.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (err) {
          console.error('[WebRTC] Error adding ICE candidate', err);
        }
      } else {
        if (!pendingCandidatesRef.current[from]) {
          pendingCandidatesRef.current[from] = [];
        }
        pendingCandidatesRef.current[from].push(candidate);
      }
    };
    
    socket.on('offer', handleOffer);
    socket.on('answer', handleAnswer);
    socket.on('ice-candidate', handleIceCandidate);
    
    return () => {
      socket.off('offer', handleOffer);
      socket.off('answer', handleAnswer);
      socket.off('ice-candidate', handleIceCandidate);
    };
  }, [socket, roomId, createPeer, drainPendingCandidates]);

  const cleanup = useCallback(() => {
    console.log('[WebRTC] Cleanup called');
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
    }
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach(track => track.stop());
    }
    Object.values(peersRef.current).forEach(peer => peer.close());
    peersRef.current = {};
    pendingCandidatesRef.current = {};
    screenSendersRef.current = {};
    setLocalStream(null);
    setRemoteStreams({});
    setRemoteScreenStreams({});
    setAudioEnabled(false);
    setVideoEnabled(false);
    setScreenSharing(false);
    setScreenStream(null);
  }, []);

  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  const toggleAudio = async () => {
    if (audioEnabled) {
      const audioTrack = localStreamRef.current?.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.stop();
        localStreamRef.current.removeTrack(audioTrack);
      }
      Object.entries(peersRef.current).forEach(([socketId, peer]) => {
        const sender = peer.getSenders().find(s => s.track && s.track.kind === 'audio');
        if (sender) peer.removeTrack(sender);
        makeOffer(socketId, peer);
      });
      setAudioEnabled(false);
      if (socket) socket.emit('toggle-mic', { roomId, isMuted: true });
      return false;
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const newTrack = stream.getAudioTracks()[0];
        if (!localStreamRef.current) {
          localStreamRef.current = new MediaStream();
        }
        localStreamRef.current.addTrack(newTrack);
        setLocalStream(localStreamRef.current);
        
        Object.entries(peersRef.current).forEach(([socketId, peer]) => {
          peer.addTrack(newTrack, localStreamRef.current);
          makeOffer(socketId, peer);
        });
        
        setAudioEnabled(true);
        if (socket) socket.emit('toggle-mic', { roomId, isMuted: false });
        return true;
      } catch (err) {
        console.error('[WebRTC] Error accessing mic', err);
        toast.error('Could not access microphone');
        return false;
      }
    }
  };

  const toggleVideo = async () => {
    if (videoEnabled) {
      const videoTrack = localStreamRef.current?.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.stop();
        localStreamRef.current.removeTrack(videoTrack);
      }
      Object.entries(peersRef.current).forEach(([socketId, peer]) => {
        const sender = peer.getSenders().find(s => s.track && s.track.kind === 'video' && s !== screenSendersRef.current[socketId]);
        if (sender) peer.removeTrack(sender);
        makeOffer(socketId, peer);
      });
      setVideoEnabled(false);
      if (socket) socket.emit('toggle-camera', { roomId, isCameraOff: true });
      return false;
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        const newTrack = stream.getVideoTracks()[0];
        if (!localStreamRef.current) {
          localStreamRef.current = new MediaStream();
        }
        localStreamRef.current.addTrack(newTrack);
        setLocalStream(localStreamRef.current);
        
        Object.entries(peersRef.current).forEach(([socketId, peer]) => {
          peer.addTrack(newTrack, localStreamRef.current);
          makeOffer(socketId, peer);
        });
        
        setVideoEnabled(true);
        if (socket) socket.emit('toggle-camera', { roomId, isCameraOff: false });
        return true;
      } catch (err) {
        console.error('[WebRTC] Error accessing camera', err);
        toast.error('Could not access camera');
        return false;
      }
    }
  };

  const stopScreenShare = useCallback(() => {
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach(track => track.stop());
      screenStreamRef.current = null;
    }
    setScreenStream(null);
    
    Object.entries(peersRef.current).forEach(([socketId, peer]) => {
      const sender = screenSendersRef.current[socketId];
      if (sender) {
        try {
          peer.removeTrack(sender);
        } catch (err) {
          console.error('[WebRTC] Error removing screen sender:', err);
        }
        delete screenSendersRef.current[socketId];
        makeOffer(socketId, peer);
      }
    });
    
    setScreenSharing(false);
    if (socket) socket.emit('screen-share-stop', { roomId });
  }, [socket, roomId, makeOffer]);

  const startScreenShare = async () => {
    try {
      toast.info('Tip: Select a specific Window or Chrome Tab to share without monitor loops!');
      const stream = await navigator.mediaDevices.getDisplayMedia({ 
        video: {
          cursor: 'always'
        }, 
        audio: true 
      });
      screenStreamRef.current = stream;
      setScreenStream(stream);
      setScreenSharing(true);
      
      const screenVideoTrack = stream.getVideoTracks()[0];
      screenVideoTrack.onended = stopScreenShare;
      
      Object.entries(peersRef.current).forEach(([socketId, peer]) => {
        const sender = peer.addTrack(screenVideoTrack, stream);
        screenSendersRef.current[socketId] = sender;
        makeOffer(socketId, peer);
      });
      
      if (socket) socket.emit('screen-share-start', { roomId });
      return true;
    } catch (err) {
      console.error('[WebRTC] Error sharing screen', err);
      toast.error('Screen sharing was denied or failed');
      return false;
    }
  };

  return {
    localStream,
    remoteStreams,
    remoteScreenStreams,
    screenStream,
    audioEnabled,
    videoEnabled,
    screenSharing,
    toggleAudio,
    toggleVideo,
    startScreenShare,
    stopScreenShare,
    cleanup
  };
}
