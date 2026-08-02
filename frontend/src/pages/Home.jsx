import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import videoService from '@/services/video.service';
import { VideoCard } from '@/components/video/VideoCard';
import { Loader } from '@/components/ui/Loader';
import { Play } from 'lucide-react';

export default function Home() {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchVideos = async () => {
      try {
        const data = await videoService.getAllVideos();
        setVideos(data.videos);
      } catch (err) {
        setError('Failed to load videos. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    fetchVideos();
  }, []);

  if (loading) {
    return (
      <div className="flex h-[80vh] w-full items-center justify-center">
        <Loader size={48} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-[80vh] w-full flex-col items-center justify-center gap-4 text-center px-4">
        <p className="text-xl font-medium text-red-500">{error}</p>
        <button onClick={() => window.location.reload()} className="px-4 py-2 bg-surface hover:bg-surface-light rounded-md transition-colors">
          Retry
        </button>
      </div>
    );
  }

  const trending = videos.slice(0, 4);
  const recentlyAdded = videos.slice(0, 8);

  const handleStartWatching = () => {
    if (videos.length > 0) {
      document.getElementById('trending-section')?.scrollIntoView({ behavior: 'smooth' });
    } else {
      navigate('/upload');
    }
  };

  return (
    <div className="min-h-screen pb-12">
      {/* Hero Section */}
      <section className="relative w-full h-[60vh] sm:h-[70vh] flex items-center justify-center overflow-hidden border-b border-border bg-surface/30">
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent z-10" />
        
        {trending.length > 0 ? (
          <img 
            src={trending[0].thumbnail} 
            alt="Hero" 
            className="absolute inset-0 w-full h-full object-cover blur-sm opacity-30 scale-105"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-background to-background" />
        )}
        
        <div className="relative z-20 container mx-auto px-4 max-w-7xl flex flex-col items-center sm:items-start text-center sm:text-left gap-6">
          <span className="px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary bg-primary/10 rounded-full border border-primary/20 backdrop-blur-md">
            Watch Party Ready
          </span>
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-text max-w-3xl leading-tight">
            Sync, Watch, and <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-500">Interact.</span>
          </h1>
          <p className="text-lg sm:text-xl text-muted max-w-xl font-medium">
            Experience movies and shows together with friends in real-time. Premium streaming meets social interaction.
          </p>
          <div className="flex items-center gap-4 mt-2">
            <button onClick={handleStartWatching} className="flex items-center gap-2 bg-primary hover:bg-blue-600 text-white px-8 py-3.5 rounded-full font-bold transition-all transform hover:scale-105 shadow-lg shadow-primary/25">
              <Play className="h-5 w-5 fill-current" />
              Start Watching
            </button>
          </div>
        </div>
      </section>

      {/* Content Sections */}
      <div className="container mx-auto px-4 max-w-7xl mt-12 space-y-16">
        
        {/* Trending Now */}
        {trending.length > 0 && (
          <section id="trending-section">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-text">Trending Now</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {trending.map((video) => (
                <VideoCard key={video._id} video={video} />
              ))}
            </div>
          </section>
        )}

        {/* Recently Added */}
        {recentlyAdded.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-text">Recently Added</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {recentlyAdded.map((video) => (
                <VideoCard key={video._id} video={video} />
              ))}
            </div>
          </section>
        )}

        {/* Empty State */}
        {videos.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="h-24 w-24 rounded-full bg-surface-light flex items-center justify-center mb-6">
              <Play className="h-10 w-10 text-muted" />
            </div>
            <h3 className="text-2xl font-bold text-text">No videos available</h3>
            <p className="mt-2 text-muted max-w-md">
              Check back later for new content. Videos will appear here once uploaded by users.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
