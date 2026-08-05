import { useState, useEffect, useRef, useCallback } from 'react';
import { toast } from '@/utils/toast';

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
    { urls: 'stun:stun4.l.google.com:19302' },
    { urls: 'stun:global.stun.twilio.com:3478' }
  ]
};

export function useWebRTC(socket, roomId, participants, currentSocketId) {
  const peersRef = useRef({});
  const pendingCandidatesRef = useRef({});
  const localStreamRef = useRef(null);
  const screenStreamRef = useRef(null);
  const cameraSendersRef = useRef({});
  const screenSendersRef = useRef({});
  const participantsRef = useRef(participants);
  const makeOfferRef = useRef(null);
  
  const [localStream, setLocalStream] = useState(null);
  const [remoteStreams, setRemoteStreams] = useState({});
  const [remoteScreenStreams, setRemoteScreenStreams] = useState({});
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [videoEnabled, setVideoEnabled] = useState(false);
  const [screenSharing, setScreenSharing] = useState(false);
  const [screenStream, setScreenStream] = useState(null);

  const activeScreenSharingSocketIdRef = useRef(null);

  useEffect(() => {
    participantsRef.current = participants;
  }, [participants]);

  useEffect(() => {
    if (!socket) return;

    const handleScreenStarted = ({ socketId }) => {
      activeScreenSharingSocketIdRef.current = socketId;
      const peer = peersRef.current[socketId];
      if (peer && peer.lastVideoTrack) {
        setRemoteScreenStreams(prev => ({ ...prev, [socketId]: new MediaStream([peer.lastVideoTrack]) }));
      }
    };
    const handleScreenStopped = ({ socketId }) => {
      if (activeScreenSharingSocketIdRef.current === socketId) {
        activeScreenSharingSocketIdRef.current = null;
      }
      setRemoteScreenStreams(prev => {
        const next = { ...prev };
        delete next[socketId];
        return next;
      });
    };

    socket.on('screen-share-started', handleScreenStarted);
    socket.on('screen-share-stopped', handleScreenStopped);

    return () => {
      socket.off('screen-share-started', handleScreenStarted);
      socket.off('screen-share-stopped', handleScreenStopped);
    };
  }, [socket]);

  useEffect(() => {
    if (!participants) return;
    participants.forEach(p => {
      if (p.isScreenSharing && p.socketId && p.socketId !== currentSocketId) {
        activeScreenSharingSocketIdRef.current = p.socketId;
        const peer = peersRef.current[p.socketId];
        if (peer && peer.lastVideoTrack) {
          setRemoteScreenStreams(prev => ({ ...prev, [p.socketId]: new MediaStream([peer.lastVideoTrack]) }));
        }
      }
    });
  }, [participants, currentSocketId]);

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
    
    // Add existing camera/audio tracks if available. While presenting, the
    // display track occupies the single outbound video slot for this peer.
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        if (track.kind !== 'video' || !screenStreamRef.current) {
          const sender = peer.addTrack(track, localStreamRef.current);
          if (track.kind === 'video') {
            cameraSendersRef.current[targetSocketId] = sender;
          }
        }
      });
    }
    
    // A participant joining while a screen share is active must receive that
    // track in the initial SDP exchange.  Do not add a second video sender:
    // doing so makes the remote side depend on non-standard track labels.
    if (screenStreamRef.current) {
      const screenTrack = screenStreamRef.current.getVideoTracks()[0];
      if (screenTrack) {
        const sender = peer.addTrack(screenTrack, screenStreamRef.current);
        cameraSendersRef.current[targetSocketId] = sender;
        screenSendersRef.current[targetSocketId] = {
          sender,
          restoreTrack: localStreamRef.current?.getVideoTracks()[0] || null
        };
      }
    }

    peer.onicecandidate = (e) => {
      if (e.candidate && socket) {
        socket.emit('ice-candidate', { roomId, to: targetSocketId, candidate: e.candidate });
      }
    };
    
    peer.ontrack = (e) => {
      console.log(`[WebRTC] Track received from ${targetSocketId}:`, e.track.kind, e.streams);

      if (e.track.kind === 'video') {
        if (peersRef.current[targetSocketId]) {
          peersRef.current[targetSocketId].lastVideoTrack = e.track;
        }

        const trackLabel = (e.track.label || '').toLowerCase();
        const existingStream = peersRef.current[targetSocketId]?.remoteCameraStream;
        const isSecondTrack = existingStream && existingStream.getVideoTracks().length > 0 && existingStream.getVideoTracks()[0].id !== e.track.id;
        const isScreenLabel = trackLabel.includes('screen') || trackLabel.includes('display') || trackLabel.includes('window') || trackLabel.includes('tab');
        const isFromScreenSharer = activeScreenSharingSocketIdRef.current === targetSocketId || participantsRef.current.some(p => p.socketId === targetSocketId && p.isScreenSharing);

        if (isFromScreenSharer || isScreenLabel || isSecondTrack) {
          console.log(`[WebRTC] Assigning screen share video track from ${targetSocketId}`);
          setRemoteScreenStreams(screenPrev => {
            return { ...screenPrev, [targetSocketId]: new MediaStream([e.track]) };
          });
        } else {
          console.log(`[WebRTC] Assigning camera video track from ${targetSocketId}`);
          setRemoteStreams(prev => {
            const baseStream = prev[targetSocketId] || new MediaStream();
            const nonVideoTracks = baseStream.getTracks().filter(t => t.kind !== 'video');
            const updatedStream = new MediaStream([...nonVideoTracks, e.track]);
            if (peersRef.current[targetSocketId]) {
              peersRef.current[targetSocketId].remoteCameraStream = updatedStream;
            }
            return { ...prev, [targetSocketId]: updatedStream };
          });
        }
      } else {
        setRemoteStreams(prev => {
          const baseStream = prev[targetSocketId] || new MediaStream();
          if (!baseStream.getTracks().includes(e.track)) {
            baseStream.addTrack(e.track);
          }
          return { ...prev, [targetSocketId]: new MediaStream(baseStream.getTracks()) };
        });
      }
    };
    
    peer.onconnectionstatechange = () => {
      console.log(`[WebRTC] Connection state for ${targetSocketId}: ${peer.connectionState}`);
      if (peer.connectionState === 'failed') {
        console.log(`[WebRTC] Connection failed with ${targetSocketId}, attempting ICE restart...`);
        makeOfferRef.current?.(targetSocketId, peer, { iceRestart: true });
      } else if (peer.connectionState === 'closed') {
        peer.close();
        delete peersRef.current[targetSocketId];
        delete cameraSendersRef.current[targetSocketId];
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

  const makeOffer = useCallback(async (targetSocketId, peer, options = {}) => {
    try {
      if (peer.signalingState !== 'stable' && !options.iceRestart) {
        // A track can be added while the initial offer is still awaiting its
        // answer. Queue that negotiation instead of dropping it permanently.
        peer.needsNegotiation = true;
        console.log(`[WebRTC] Signaling state for ${targetSocketId} is ${peer.signalingState}, queueing offer.`);
        return;
      }
      console.log(`[WebRTC] Initiating SDP offer to ${targetSocketId}`);
      peer.needsNegotiation = false;
      const offer = await peer.createOffer(options);
      await peer.setLocalDescription(offer);
      if (socket) {
        socket.emit('offer', { roomId, to: targetSocketId, sdp: peer.localDescription });
      }
    } catch (err) {
      console.error(`[WebRTC] Error initiating offer to ${targetSocketId}:`, err);
    }
  }, [socket, roomId]);

  useEffect(() => {
    makeOfferRef.current = makeOffer;
  }, [makeOffer]);

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
        delete cameraSendersRef.current[socketId];
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
        const isOfferCollision = peer.signalingState !== 'stable';
        if (isOfferCollision) {
          console.log(`[WebRTC] Offer collision detected with ${from}, rolling back local offer to accept incoming offer`);
          try {
            await peer.setLocalDescription({ type: 'rollback' });
          } catch (rollbackErr) {
            console.log('[WebRTC] Rollback notice:', rollbackErr.message);
          }
        }

        await peer.setRemoteDescription(new RTCSessionDescription(sdp));
        const answer = await peer.createAnswer();
        await peer.setLocalDescription(answer);
        socket.emit('answer', { roomId, to: from, sdp: peer.localDescription });
        drainPendingCandidates(from, peer);
        if (peer.needsNegotiation) {
          await makeOffer(from, peer);
        }
      } catch (err) {
        console.error('[WebRTC] Error handling offer', err);
      }
    };
    
    const handleAnswer = async ({ from, sdp }) => {
      console.log(`[WebRTC] Received answer from ${from}`);
      const peer = peersRef.current[from];
      if (peer) {
        if (peer.signalingState !== 'have-local-offer') {
          console.log(`[WebRTC] Skipping answer from ${from}: signalingState is '${peer.signalingState}' (expected 'have-local-offer')`);
          return;
        }
        try {
          await peer.setRemoteDescription(new RTCSessionDescription(sdp));
          drainPendingCandidates(from, peer);
          if (peer.needsNegotiation) {
            await makeOffer(from, peer);
          }

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
  }, [socket, roomId, createPeer, drainPendingCandidates, makeOffer]);

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
    cameraSendersRef.current = {};
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
        if (sender) {
          try { peer.removeTrack(sender); } catch {}
        }
        makeOffer(socketId, peer);
      });
      setLocalStream(localStreamRef.current ? new MediaStream(localStreamRef.current.getTracks()) : null);
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
        setLocalStream(new MediaStream(localStreamRef.current.getTracks()));
        
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
      await Promise.all(Object.entries(peersRef.current).map(async ([socketId, peer]) => {
        const screenSender = screenSendersRef.current[socketId];
        if (screenSender) {
          screenSender.restoreTrack = null;
          return;
        }
        const sender = cameraSendersRef.current[socketId] || peer.getSenders().find(s => s.track?.kind === 'video');
        if (sender) {
          try {
            await sender.replaceTrack(null);
            cameraSendersRef.current[socketId] = sender;
          } catch (err) {
            console.error('[WebRTC] Error disabling camera sender:', err);
          }
        }
      }));
      setLocalStream(localStreamRef.current ? new MediaStream(localStreamRef.current.getTracks()) : null);
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
        setLocalStream(new MediaStream(localStreamRef.current.getTracks()));
        
        await Promise.all(Object.entries(peersRef.current).map(async ([socketId, peer]) => {
          const screenSender = screenSendersRef.current[socketId];
          if (screenSender) {
            // Keep presenting. This becomes the camera track restored when
            // screen sharing ends instead of adding a second video m-line.
            screenSender.restoreTrack = newTrack;
          } else {
            const sender = cameraSendersRef.current[socketId];
            if (sender) {
              await sender.replaceTrack(newTrack);
            } else {
              const newSender = peer.addTrack(newTrack, localStreamRef.current);
              cameraSendersRef.current[socketId] = newSender;
              makeOffer(socketId, peer);
            }
          }
        }));
        
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

  const stopScreenShare = useCallback(async () => {
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach(track => track.stop());
      screenStreamRef.current = null;
    }
    setScreenStream(null);
    
    await Promise.all(Object.entries(peersRef.current).map(async ([socketId]) => {
      const screenSender = screenSendersRef.current[socketId];
      if (!screenSender) return;
      try {
        if (screenSender.restoreTrack) {
          await screenSender.sender.replaceTrack(screenSender.restoreTrack);
        } else {
          await screenSender.sender.replaceTrack(null);
        }
        cameraSendersRef.current[socketId] = screenSender.sender;
      } catch (err) {
        console.error('[WebRTC] Error restoring camera sender:', err);
      } finally {
        delete screenSendersRef.current[socketId];
      }
    }));
    
    setScreenSharing(false);
    if (socket) socket.emit('screen-share-stop', { roomId });
  }, [socket, roomId]);

  const startScreenShare = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
        toast.error('Screen sharing is not supported on this browser/device');
        return false;
      }

      let stream;
      try {
        stream = await navigator.mediaDevices.getDisplayMedia({ 
          video: true, 
          audio: true 
        });
      } catch {
        console.log('[WebRTC] Mobile/Tablet fallback to video-only getDisplayMedia');
        stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
      }

      screenStreamRef.current = stream;
      setScreenStream(stream);
      setScreenSharing(true);
      
      const screenVideoTrack = stream.getVideoTracks()[0];
      if (!screenVideoTrack) throw new Error('No screen video track was provided');
      screenVideoTrack.onended = stopScreenShare;
      
      await Promise.all(Object.entries(peersRef.current).map(async ([socketId, peer]) => {
        const cameraSender = cameraSendersRef.current[socketId] || peer.getSenders().find(sender => sender.track?.kind === 'video');
        if (cameraSender) {
          const restoreTrack = cameraSender.track;
          await cameraSender.replaceTrack(screenVideoTrack);
          cameraSendersRef.current[socketId] = cameraSender;
          screenSendersRef.current[socketId] = { sender: cameraSender, restoreTrack };
        } else {
          const sender = peer.addTrack(screenVideoTrack, stream);
          cameraSendersRef.current[socketId] = sender;
          screenSendersRef.current[socketId] = { sender, restoreTrack: null };
          makeOffer(socketId, peer);
        }
      }));
      
      if (socket) socket.emit('screen-share-start', { roomId });
      return true;
    } catch (err) {
      console.error('[WebRTC] Error sharing screen', err);
      toast.error('Screen sharing was denied or not supported on this device');
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
