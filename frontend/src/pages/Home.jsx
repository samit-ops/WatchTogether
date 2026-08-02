import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import videoService from '@/services/video.service';
import { VideoCard } from '@/components/video/VideoCard';
import { ParticleCanvas } from '@/components/ui/ParticleCanvas';
import { MagneticButton } from '@/components/ui/MagneticButton';
import { FadeIn, ScrollReveal, StaggerContainer, StaggerItem } from '@/components/motion';
import { Play, Sparkles, TrendingUp } from 'lucide-react';

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
      <div className="min-h-screen pb-12">
        {/* Skeleton Hero */}
        <section className="relative w-full h-[60vh] sm:h-[70vh] flex items-center justify-center overflow-hidden">
          <div className="hero-mesh-gradient" />
          <div className="relative z-20 container mx-auto px-4 max-w-7xl flex flex-col items-center sm:items-start gap-6">
            <div className="skeleton h-7 w-36 rounded-full" />
            <div className="skeleton h-16 w-[80%] max-w-2xl rounded-2xl" />
            <div className="skeleton h-8 w-[60%] max-w-lg rounded-xl" />
            <div className="skeleton h-14 w-48 rounded-full mt-2" />
          </div>
        </section>
        {/* Skeleton Grid */}
        <div className="container mx-auto px-4 max-w-7xl mt-12 space-y-16">
          <div>
            <div className="skeleton h-8 w-48 rounded-lg mb-6" />
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="space-y-3">
                  <div className="skeleton aspect-video w-full rounded-xl" />
                  <div className="flex gap-3">
                    <div className="skeleton h-9 w-9 rounded-full flex-shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="skeleton h-4 w-full rounded" />
                      <div className="skeleton h-3 w-2/3 rounded" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
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
      {/* ═══ Hero Section ═══ */}
      <section className="relative w-full h-[60vh] sm:h-[70vh] flex items-center justify-center overflow-hidden">
        {/* Layer 1: Animated Mesh Gradient */}
        <div className="hero-mesh-gradient" />
        
        {/* Layer 2: Particle Canvas */}
        <ParticleCanvas className="absolute inset-0 z-[1]" />
        
        {/* Layer 3: Gradient overlay for readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent z-[2]" />
        
        {/* Layer 4: Blurred hero thumbnail */}
        {trending.length > 0 && (
          <img 
            src={trending[0].thumbnail} 
            alt="" 
            className="absolute inset-0 w-full h-full object-cover opacity-[0.07] scale-110 blur-sm z-0"
          />
        )}
        
        {/* Layer 5: Hero Content */}
        <div className="relative z-[3] container mx-auto px-4 max-w-7xl flex flex-col items-center sm:items-start text-center sm:text-left gap-6">
          <FadeIn delay={0}>
            <span className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-primary glass-card rounded-full">
              <Sparkles className="h-3.5 w-3.5" />
              Watch Party Ready
            </span>
          </FadeIn>
          
          <FadeIn delay={0.1}>
            <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-text max-w-3xl leading-[1.1]">
              Sync, Watch, and{' '}
              <span className="text-gradient">Interact.</span>
            </h1>
          </FadeIn>
          
          <FadeIn delay={0.2}>
            <p className="text-lg sm:text-xl text-muted max-w-xl font-medium leading-relaxed">
              Experience movies and shows together with friends in real-time. Premium streaming meets social interaction.
            </p>
          </FadeIn>
          
          <FadeIn delay={0.3}>
            <MagneticButton
              as="button"
              onClick={handleStartWatching}
              className="btn-gradient flex items-center gap-2.5 px-8 py-4 rounded-full font-bold text-base shadow-xl cursor-pointer"
              strength={0.12}
            >
              <Play className="h-5 w-5 fill-current" />
              <span>Start Watching</span>
            </MagneticButton>
          </FadeIn>
        </div>
      </section>

      {/* ═══ Content Sections ═══ */}
      <div className="container mx-auto px-4 max-w-7xl mt-16 space-y-20">
        
        {/* Gradient divider */}
        <div className="gradient-divider" />
        
        {/* Trending Now */}
        {trending.length > 0 && (
          <section id="trending-section">
            <ScrollReveal>
              <div className="flex items-center gap-3 mb-8">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[var(--gradient-start)] to-[var(--gradient-end)]">
                  <TrendingUp className="h-4 w-4 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-text">Trending Now</h2>
              </div>
            </ScrollReveal>
            <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {trending.map((video) => (
                <StaggerItem key={video._id}>
                  <VideoCard video={video} />
                </StaggerItem>
              ))}
            </StaggerContainer>
          </section>
        )}

        {/* Gradient divider */}
        <div className="gradient-divider" />

        {/* Recently Added */}
        {recentlyAdded.length > 0 && (
          <section>
            <ScrollReveal>
              <div className="flex items-center gap-3 mb-8">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500">
                  <Sparkles className="h-4 w-4 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-text">Recently Added</h2>
              </div>
            </ScrollReveal>
            <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {recentlyAdded.map((video) => (
                <StaggerItem key={video._id}>
                  <VideoCard video={video} />
                </StaggerItem>
              ))}
            </StaggerContainer>
          </section>
        )}

        {/* Empty State */}
        {videos.length === 0 && (
          <FadeIn>
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="h-24 w-24 rounded-2xl glass-card flex items-center justify-center mb-6 glow-primary">
                <Play className="h-10 w-10 text-muted" />
              </div>
              <h3 className="text-2xl font-bold text-text">No videos available</h3>
              <p className="mt-2 text-muted max-w-md">
                Check back later for new content. Videos will appear here once uploaded by users.
              </p>
            </div>
          </FadeIn>
        )}
      </div>
    </div>
  );
}
