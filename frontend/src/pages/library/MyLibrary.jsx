import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import roomService from '@/services/room.service';
import videoService from '@/services/video.service';
import { useAuth } from '@/contexts/AuthContext';
import { Loader } from '@/components/ui/Loader';
import { Button } from '@/components/ui/Button';
import { VideoCard } from '@/components/video/VideoCard';
import { Plus, Trash2, Edit } from 'lucide-react';
import { toast } from '@/utils/toast';

export default function MyLibrary() {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isSelectMode = searchParams.get('select') === 'true';
  const [creatingRoom, setCreatingRoom] = useState(false);

  const fetchVideos = async () => {
    setLoading(true);
    try {
      const data = await videoService.getAllVideos();
      // Filter videos by current user safely
      const userId = user?.id || user?._id;
      const userVideos = data.videos.filter(v => {
        const uploaderId = v.uploadedBy?._id || v.uploadedBy?.id || v.uploadedBy;
        return String(uploaderId) === String(userId);
      });
      setVideos(userVideos);
    } catch (err) {
      setError('Failed to load your library.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchVideos();
    }
  }, [user]);

  const handleDelete = async (id, e) => {
    e.preventDefault();
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this video?')) {
      try {
        await videoService.deleteVideo(id);
        setVideos(videos.filter(v => v._id !== id));
      } catch (err) {
        alert('Failed to delete video.');
      }
    }
  };

  if (loading || creatingRoom) {
    return (
      <div className="flex h-[80vh] w-full flex-col gap-4 items-center justify-center">
        <Loader size={48} />
        {creatingRoom && <p className="text-muted font-medium">Creating Watch Party...</p>}
      </div>
    );
  }

  const handleSelectVideo = async (video) => {
    if (creatingRoom) return;
    setCreatingRoom(true);
    try {
      const res = await roomService.createRoom(video._id);
      const roomId = res.data?.room?.roomId || res.room?.roomId || res.roomId;
      if (roomId) {
        navigate(`/watch-party/${roomId}`);
      } else {
        toast.error('Failed to create Watch Party: Invalid response');
        setCreatingRoom(false);
      }
    } catch (error) {
      console.error('Watch Party Creation Error:', error);
      toast.error(`Failed to create Watch Party: ${error.message || 'Server error'}`);
      setCreatingRoom(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl min-h-screen">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-text">{isSelectMode ? 'Select a Video' : 'My Library'}</h1>
          <p className="text-muted mt-1">{isSelectMode ? 'Choose a video to start your Watch Party.' : 'Manage your uploaded content.'}</p>
        </div>
        <Button onClick={() => navigate('/upload')} className="flex items-center gap-2">
          <Plus className="h-5 w-5" />
          Upload Video
        </Button>
      </div>

      {error ? (
        <div className="text-red-500 bg-red-500/10 p-4 rounded-md border border-red-500/20">
          {error}
        </div>
      ) : videos.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center border-2 border-dashed border-border rounded-xl bg-surface/30">
          <div className="h-20 w-20 rounded-full bg-surface-light flex items-center justify-center mb-6">
            <Plus className="h-10 w-10 text-muted" />
          </div>
          <h3 className="text-2xl font-bold text-text">Your library is empty</h3>
          <p className="mt-2 text-muted max-w-md mb-6">
            You haven't uploaded any videos yet. Upload your first video to start a Watch Party.
          </p>
          <Button onClick={() => navigate('/upload')}>
            Upload First Video
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {videos.map(video => (
            <div key={video._id} className="relative group">
              <VideoCard video={video} onSelect={isSelectMode ? handleSelectVideo : undefined} />
              {!isSelectMode && (
                <div className="absolute top-2 right-2 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={(e) => handleDelete(video._id, e)}
                    className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 shadow-lg transform transition-transform hover:scale-110"
                    title="Delete Video"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
