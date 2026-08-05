import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/utils/toast';
import { roomService } from '@/services/room.service';

export function useRoom(socket, roomId) {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [room, setRoom] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [host, setHost] = useState(null);
  const [isLocked, setIsLocked] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [playbackPermission, setPlaybackPermission] = useState('host');
  const [meetingPermissions, setMeetingPermissions] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const leaveTimeoutRef = useRef(null);
  const hasLiveParticipantsRef = useRef(false);

  useEffect(() => {
    let mounted = true;
    hasLiveParticipantsRef.current = false;
    
    const initRoom = async () => {
      try {
        setLoading(true);
        const res = await roomService.getRoom(roomId);
        const roomData = res.data?.room || res.room || res;
        if (mounted) {
          setRoom(roomData);
          if (roomData.host) setHost(roomData.host);
          // Do not let an older REST snapshot overwrite a newer Socket.IO
          // participant update received while this request was in flight.
          if (roomData.participants && !hasLiveParticipantsRef.current) setParticipants(roomData.participants);
          if (roomData.isLocked !== undefined) setIsLocked(roomData.isLocked);
          if (roomData.isRecording !== undefined) setIsRecording(roomData.isRecording);
          if (roomData.playbackPermission !== undefined) setPlaybackPermission(roomData.playbackPermission);
          if (roomData.meetingPermissions !== undefined) setMeetingPermissions(roomData.meetingPermissions);
          setLoading(false);
        }
      } catch (err) {
        if (mounted) {
          setError(err.response?.data?.message || err.message || 'Failed to get room');
          setLoading(false);
        }
      }
    };
    
    initRoom();
    
    if (socket && roomId) {
      const emitJoin = () => {
        socket.emit('join-room', { roomId });
      };

      if (socket.connected) {
        emitJoin();
      } else {
        socket.once('connect', emitJoin);
      }
      
      socket.on('participants-updated', (data) => {
        hasLiveParticipantsRef.current = true;
        setParticipants(data.participants || []);
        if (data.host) setHost(data.host);
        if (data.isLocked !== undefined) setIsLocked(data.isLocked);
        if (data.isRecording !== undefined) setIsRecording(data.isRecording);
        if (data.playbackPermission !== undefined) setPlaybackPermission(data.playbackPermission);
        if (data.meetingPermissions !== undefined) setMeetingPermissions(data.meetingPermissions);
      });
      
      socket.on('room-ended', () => {
        setError('Room has been ended by the host');
        toast.error('Room ended by host');
      });
      
      socket.on('kicked', () => {
        toast.error('You were kicked from the room');
        navigate('/');
      });
      
      socket.on('room-locked', () => {
        toast.info('Room is now locked');
      });
      
      socket.on('error', (data) => {
        const msg = data.message || 'An error occurred';
        setError(msg);
        toast.error(msg);
      });
      
      socket.on('host-changed', (data) => {
        const currentUserId = String(user?._id || user?.id || '');
        if (data.newHostId && String(data.newHostId) === currentUserId) {
          toast.success('You are now the host');
        } else {
          toast.info('Room host has changed');
        }
      });
    }

    return () => {
      mounted = false;
      if (socket && roomId) {
        socket.off('participants-updated');
        socket.off('room-ended');
        socket.off('kicked');
        socket.off('room-locked');
        socket.off('error');
        socket.off('host-changed');
      }
    };
  }, [socket, roomId, navigate, user?._id, user?.id]);

  const currentUserId = String(user?._id || user?.id || '');
  const hostId = String(host?._id || host?.id || host || '');
  const isHost = Boolean(currentUserId && hostId && currentUserId === hostId);
  const myParticipant = participants.find(p => String(p.user?._id || p.user?.id || p.user) === currentUserId);
  const myRole = myParticipant?.role || (isHost ? 'host' : 'guest');
  const roomType = room?.type || 'video';

  const leaveRoom = () => {
    if (socket && roomId) {
      socket.emit('leave-room', { roomId });
    }
  };

  const kickParticipant = (targetUserId) => {
    if (socket && roomId) {
      socket.emit('kick-participant', { roomId, targetUserId });
    }
  };

  const promoteParticipant = (targetUserId) => {
    if (socket && roomId) {
      socket.emit('promote-participant', { roomId, targetUserId });
    }
  };

  const demoteParticipant = (targetUserId) => {
    if (socket && roomId) {
      socket.emit('demote-participant', { roomId, targetUserId });
    }
  };

  const transferHost = (targetUserId) => {
    if (socket && roomId) {
      socket.emit('transfer-host', { roomId, targetUserId });
    }
  };

  const lockRoom = () => {
    if (socket && roomId) {
      socket.emit('lock-room', { roomId });
    }
  };

  const unlockRoom = () => {
    if (socket && roomId) {
      socket.emit('unlock-room', { roomId });
    }
  };

  const endRoom = () => {
    if (socket && roomId) {
      socket.emit('end-room', { roomId });
    }
  };

  const updatePlaybackPermission = (permission) => {
    if (socket && roomId) {
      socket.emit('update-permissions', { roomId, playbackPermission: permission });
    }
  };

  const updateMeetingPermissions = (permissions) => {
    if (socket && roomId) {
      socket.emit('update-permissions', { roomId, meetingPermissions: permissions });
    }
  };

  const setRecording = (recording) => {
    if (socket && roomId) {
      socket.emit(recording ? 'recording-start' : 'recording-stop', { roomId });
    }
  };

  return {
    room,
    participants,
    isHost,
    myRole,
    isLocked,
    isRecording,
    playbackPermission,
    meetingPermissions,
    roomType,
    error,
    loading,
    leaveRoom,
    kickParticipant,
    promoteParticipant,
    demoteParticipant,
    transferHost,
    lockRoom,
    unlockRoom,
    endRoom,
    updatePlaybackPermission,
    updateMeetingPermissions,
    setRecording,
  };
}
