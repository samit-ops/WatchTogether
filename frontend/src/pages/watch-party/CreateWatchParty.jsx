import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlaySquare, MonitorUp, Users, LogIn } from 'lucide-react';
import roomService from '@/services/room.service';
import { toast } from '@/utils/toast';

export default function CreateWatchParty() {
  const navigate = useNavigate();
  const [joinRoomId, setJoinRoomId] = useState('');

  const handleCreateLiveRoom = async () => {
    try {
      const res = await roomService.createLiveRoom();
      const roomId = res.data?.room?.roomId || res.room?.roomId || res.roomId;
      if (roomId) {
        navigate(`/watch-party/${roomId}`);
      } else {
        toast.error('Failed to create live watch party: Invalid response');
      }
    } catch (err) {
      console.error('Create Live Room Error:', err);
      toast.error('Failed to create live watch party');
    }
  };

  const handleWatchUploaded = () => {
    navigate('/library?select=true');
  };

  const handleJoinRoom = (e) => {
    e.preventDefault();
    const cleanId = joinRoomId.trim();
    if (!cleanId) {
      toast.error('Please enter a Room ID');
      return;
    }
    navigate(`/watch-party/${cleanId}`);
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center p-6 bg-background">
      <div className="max-w-3xl w-full text-center mb-12">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/20 text-primary mb-6">
          <Users className="w-8 h-8" />
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-text mb-4">Watch Together</h1>
        <p className="text-lg text-muted max-w-xl mx-auto">
          Create a watch party to enjoy videos with friends in real-time or start a live video call.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6 w-full max-w-4xl">
        <button
          onClick={handleWatchUploaded}
          className="group relative overflow-hidden rounded-3xl bg-surface border border-border p-8 text-left hover:border-primary/50 transition-all duration-300 shadow-md"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <PlaySquare className="w-10 h-10 text-primary mb-6" />
          <h3 className="text-2xl font-bold text-text mb-3">Watch Uploaded Video</h3>
          <p className="text-muted leading-relaxed">
            Select a video from your library to watch perfectly synchronized with friends. Features voice chat and reactions.
          </p>
        </button>

        <button
          onClick={handleCreateLiveRoom}
          className="group relative overflow-hidden rounded-3xl bg-surface border border-border p-8 text-left hover:border-blue-500/50 transition-all duration-300 shadow-md"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <MonitorUp className="w-10 h-10 text-blue-500 mb-6" />
          <h3 className="text-2xl font-bold text-text mb-3">Create Live Watch Party</h3>
          <p className="text-muted leading-relaxed">
            Start a real-time video call with screen sharing capabilities. Perfect for presenting or live collaboration.
          </p>
        </button>
      </div>

      {/* Join Room by ID */}
      <div className="mt-8 w-full max-w-4xl bg-surface border border-border rounded-3xl p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-lg">
        <div className="flex items-center gap-4 text-left w-full md:w-auto">
          <div className="w-12 h-12 rounded-2xl bg-green-500/20 text-green-500 flex items-center justify-center shrink-0">
            <LogIn className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-text">Join Existing Watch Party</h3>
            <p className="text-sm text-muted">Have a room code? Enter it below to join your friends instantly.</p>
          </div>
        </div>
        <form onSubmit={handleJoinRoom} className="flex items-center gap-3 w-full md:w-auto shrink-0">
          <input 
            type="text" 
            placeholder="Enter 8-character Room ID..." 
            value={joinRoomId} 
            onChange={(e) => setJoinRoomId(e.target.value)}
            className="px-4 py-2.5 rounded-xl bg-background border border-border text-text font-mono text-sm focus:outline-none focus:border-primary w-full md:w-64"
          />
          <button 
            type="submit" 
            className="px-6 py-2.5 bg-green-500 hover:bg-green-600 text-white font-medium text-sm rounded-xl transition-colors shrink-0"
          >
            Join Room
          </button>
        </form>
      </div>
    </div>
  );
}
