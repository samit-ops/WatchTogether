import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import videoService from '@/services/video.service';
import { VideoCard } from '@/components/video/VideoCard';
import { ParticleCanvas } from '@/components/ui/ParticleCanvas';
import { MagneticButton } from '@/components/ui/MagneticButton';
import { TiltCard } from '@/components/ui/TiltCard';
import { FadeIn, ScrollReveal, StaggerContainer, StaggerItem } from '@/components/motion';
import { Play, Sparkles, TrendingUp, Users, Globe, Download, ShieldCheck, Video, Zap, Search, X } from 'lucide-react';

export default function Home() {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const searchQuery = searchParams.get('search') || '';

  useEffect(() => {
    const fetchVideos = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await videoService.getAllVideos(searchQuery);
        setVideos(data.videos || []);
      } catch (err) {
        setError('Failed to load videos. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    fetchVideos();
  }, [searchQuery]);

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

  const featureShowcase = [
    {
      icon: Users,
      title: 'Real-time Watch Parties',
      description: 'Host private or public rooms with WebRTC video calling, low-latency audio, screen share, and synchronized playback.',
      badge: 'Live Sync',
      color: 'from-blue-500 to-indigo-600',
    },
    {
      icon: Globe,
      title: 'AI Multilingual Translation',
      description: 'Break language barriers. Translate comments instantly into 6+ preferred languages with automated profanity filters.',
      badge: '6+ Languages',
      color: 'from-purple-500 to-pink-600',
    },
    {
      icon: Download,
      title: 'Controlled High-Speed Downloads',
      description: 'Download your favorite videos for offline viewing with tier-based quota management for free and premium subscribers.',
      badge: 'Quota Tracked',
      color: 'from-amber-500 to-orange-600',
    },
    {
      icon: ShieldCheck,
      title: 'Secure OTP & Pincode Privacy',
      description: 'Multi-factor email OTP authentication with automated India Post pincode city auto-completion and optional location privacy.',
      badge: 'Privacy First',
      color: 'from-emerald-500 to-teal-600',
    },
  ];

  return (
    <div className="min-h-screen pb-12">
      {/* ═══ Hero Section ═══ */}
      <section className="relative w-full h-[65vh] sm:h-[75vh] flex items-center justify-center overflow-hidden">
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
            <span className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-primary glass-card rounded-full shadow-lg">
              <Sparkles className="h-3.5 w-3.5" />
              Next-Gen Watch Party Platform
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
              Experience movies and videos together with friends in real-time. WebRTC video calls, AI comments translation, and seamless playback.
            </p>
          </FadeIn>
          
          <FadeIn delay={0.3}>
            <div className="flex flex-wrap items-center gap-4 mt-2">
              <MagneticButton
                as="button"
                onClick={handleStartWatching}
                className="btn-gradient flex items-center gap-2.5 px-8 py-4 rounded-full font-bold text-base shadow-xl cursor-pointer"
                strength={0.12}
              >
                <Play className="h-5 w-5 fill-current" />
                <span>Start Watching</span>
              </MagneticButton>

              <button
                onClick={() => navigate('/watch-party/create')}
                className="flex items-center gap-2 px-6 py-4 rounded-full font-bold text-sm glass-card hover:bg-surface border border-border transition-all"
              >
                <Video className="h-4 w-4 text-primary" />
                <span>Create Watch Party</span>
              </button>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ═══ Content Sections ═══ */}
      <div className="container mx-auto px-4 max-w-7xl mt-16 space-y-24">
        
        {/* Search Results Banner if search query is active */}
        {searchQuery && (
          <section id="search-section">
            <div className="flex items-center justify-between gap-4 mb-6 glass-card p-4 rounded-2xl border border-primary/30 shadow-lg">
              <div className="flex items-center gap-3">
                <Search className="h-5 w-5 text-primary" />
                <h2 className="text-xl font-bold text-text">
                  Search Results for <span className="text-primary">"{searchQuery}"</span> ({videos.length} {videos.length === 1 ? 'video' : 'videos'} found)
                </h2>
              </div>
              <button
                onClick={() => setSearchParams({})}
                className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-muted hover:text-text bg-surface hover:bg-surface-light rounded-xl border border-border transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
                Clear Search
              </button>
            </div>
            <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {videos.map((video) => (
                <StaggerItem key={video._id}>
                  <VideoCard video={video} />
                </StaggerItem>
              ))}
            </StaggerContainer>
          </section>
        )}

        {/* Gradient divider */}
        <div className="gradient-divider" />
        
        {/* Trending Now */}
        {trending.length > 0 && (
          <section id="trending-section">
            <ScrollReveal>
              <div className="flex items-center gap-3 mb-8">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[var(--gradient-start)] to-[var(--gradient-end)] shadow-md">
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

        {/* ═══ 3D Interactive Feature Showcase Section ═══ */}
        <section>
          <ScrollReveal>
            <div className="text-center max-w-2xl mx-auto mb-12 space-y-3">
              <span className="px-3 py-1 text-xs font-bold uppercase tracking-wider text-primary bg-primary/10 rounded-full border border-primary/20">
                Platform Capabilities
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-text">
                Designed for Interactive <span className="text-gradient">Streaming.</span>
              </h2>
              <p className="text-muted text-sm sm:text-base">
                Discover the advanced features engineered into WatchTogether for seamless group entertainment.
              </p>
            </div>
          </ScrollReveal>

          <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {featureShowcase.map((feat, idx) => {
              const IconComp = feat.icon;
              return (
                <StaggerItem key={idx}>
                  <TiltCard maxTilt={8} className="h-full">
                    <div className="glass-card p-6 sm:p-8 h-full flex flex-col justify-between card-hover relative overflow-hidden group">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${feat.color} flex items-center justify-center text-white shadow-lg`}>
                            <IconComp className="w-6 h-6" />
                          </div>
                          <span className="px-3 py-1 rounded-full text-xs font-bold bg-surface border border-border text-muted uppercase tracking-wider">
                            {feat.badge}
                          </span>
                        </div>
                        <h3 className="text-xl font-bold text-text group-hover:text-primary transition-colors">
                          {feat.title}
                        </h3>
                        <p className="text-muted text-sm leading-relaxed">
                          {feat.description}
                        </p>
                      </div>
                    </div>
                  </TiltCard>
                </StaggerItem>
              );
            })}
          </StaggerContainer>
        </section>

        {/* Gradient divider */}
        <div className="gradient-divider" />

        {/* Recently Added */}
        {recentlyAdded.length > 0 && (
          <section>
            <ScrollReveal>
              <div className="flex items-center gap-3 mb-8">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 shadow-md">
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
