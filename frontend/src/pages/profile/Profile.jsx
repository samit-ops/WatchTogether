import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import downloadService from '@/services/download.service';
import videoService from '@/services/video.service';
import { Loader } from '@/components/ui/Loader';
import { VideoCard } from '@/components/video/VideoCard';
import { toast } from '@/utils/toast';
import { Link, useNavigate } from 'react-router-dom';
import { User, Download, Video, Shield, Sparkles, Calendar, Clock, HardDrive, Play, Tag, RefreshCw } from 'lucide-react';

export default function Profile() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState('downloads');
  const [downloads, setDownloads] = useState([]);
  const [downloadStatus, setDownloadStatus] = useState(null);
  const [myVideos, setMyVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState(null);

  const fetchProfileData = async () => {
    setLoading(true);
    try {
      const [downloadsRes, statusRes, videosRes] = await Promise.all([
        downloadService.getUserDownloads(),
        downloadService.getDownloadStatus(),
        videoService.getAllVideos()
      ]);

      if (downloadsRes.data) setDownloads(downloadsRes.data);
      else if (Array.isArray(downloadsRes)) setDownloads(downloadsRes);

      if (statusRes.data) setDownloadStatus(statusRes.data);
      else if (statusRes.plan) setDownloadStatus(statusRes);

      if (videosRes.videos) {
        setMyVideos(videosRes.videos.filter(v => v.uploadedBy?._id === user?._id || v.uploadedBy === user?._id));
      }
    } catch (err) {
      console.error('Error fetching profile data:', err);
      toast.error('Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchProfileData();
    } else {
      setLoading(false);
    }
  }, [user]);

  const handleRedownload = async (video) => {
    if (!video || !video._id) return;
    setDownloadingId(video._id);
    try {
      const res = await downloadService.downloadVideo(video._id, video.title);
      if (res.data?.video?.videoUrl || res.video?.videoUrl || res.success) {
        toast.success('Download started!');
        fetchProfileData();
      } else {
        toast.error(res.message || 'Could not initiate download');
      }
    } catch (err) {
      toast.error(err.message || 'Download failed');
    } finally {
      setDownloadingId(null);
    }
  };

  const formatDuration = (secs) => {
    if (!secs) return '00:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  if (!user) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center p-6 bg-background">
        <div className="max-w-md w-full text-center bg-surface border border-border p-8 rounded-3xl shadow-xl">
          <User className="w-16 h-16 text-primary mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-text mb-2">Access Your Profile</h2>
          <p className="text-muted text-sm mb-6">Please log in to view your downloads, uploads, and account details.</p>
          <button
            onClick={() => navigate('/login?redirect=/profile')}
            className="w-full py-3 bg-primary hover:bg-blue-600 text-white font-medium rounded-xl transition-colors"
          >
            Log In Now
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex h-[80vh] w-full items-center justify-center">
        <Loader size={48} />
      </div>
    );
  }

  const userPlan = downloadStatus?.plan || user.subscription || 'Free';
  const usedToday = downloadStatus?.usedToday || downloads.length;
  const limit = downloadStatus?.limit || (userPlan === 'Free' ? 100 : 100);

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl min-h-screen">
      {/* Profile Header */}
      <div className="bg-surface border border-border rounded-3xl p-6 md:p-8 mb-8 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl -z-10 pointer-events-none" />
        
        <div className="flex flex-col md:flex-row items-center md:items-start justify-between gap-6">
          <div className="flex flex-col md:flex-row items-center gap-6 text-center md:text-left">
            {user.avatar ? (
              <img src={user.avatar} alt={user.name} className="w-24 h-24 rounded-full object-cover border-4 border-primary/20 shadow-lg" />
            ) : (
              <div className="w-24 h-24 rounded-full bg-primary/20 text-primary text-4xl font-bold flex items-center justify-center border-4 border-primary/20 uppercase shadow-lg">
                {user.name?.charAt(0) || 'U'}
              </div>
            )}
            
            <div>
              <div className="flex items-center justify-center md:justify-start gap-3 mb-1">
                <h1 className="text-2xl md:text-3xl font-bold text-text">{user.name}</h1>
                <span className="px-3 py-0.5 rounded-full text-xs font-bold bg-primary/20 text-primary border border-primary/30 uppercase tracking-wide">
                  {userPlan} Plan
                </span>
              </div>
              <p className="text-muted text-sm mb-3">{user.email}</p>

              <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-xs text-muted">
                <span className="flex items-center gap-1 bg-background px-3 py-1.5 rounded-full border border-border">
                  <HardDrive className="w-3.5 h-3.5 text-primary" />
                  {downloads.length} Download{downloads.length !== 1 ? 's' : ''} Tracked
                </span>
                <span className="flex items-center gap-1 bg-background px-3 py-1.5 rounded-full border border-border">
                  <Video className="w-3.5 h-3.5 text-blue-500" />
                  {myVideos.length} Video{myVideos.length !== 1 ? 's' : ''} Uploaded
                </span>
              </div>
            </div>
          </div>

          <Link
            to="/subscriptions"
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-primary to-blue-600 hover:opacity-90 text-white font-medium text-sm rounded-xl transition-all shadow-lg shrink-0"
          >
            <Sparkles className="w-4 h-4" />
            <span>Manage Plan</span>
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center border-b border-border mb-8">
        <button
          onClick={() => setActiveTab('downloads')}
          className={`flex items-center gap-2 px-6 py-3 font-semibold text-sm transition-all border-b-2 ${
            activeTab === 'downloads' ? 'border-primary text-primary' : 'border-transparent text-muted hover:text-text'
          }`}
        >
          <Download className="w-4 h-4" />
          <span>Downloaded Videos ({downloads.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('uploads')}
          className={`flex items-center gap-2 px-6 py-3 font-semibold text-sm transition-all border-b-2 ${
            activeTab === 'uploads' ? 'border-primary text-primary' : 'border-transparent text-muted hover:text-text'
          }`}
        >
          <Video className="w-4 h-4" />
          <span>My Uploads ({myVideos.length})</span>
        </button>
      </div>

      {/* Downloads Tab Content */}
      {activeTab === 'downloads' && (
        <div>
          {downloads.length === 0 ? (
            <div className="bg-surface/50 border border-border rounded-3xl p-12 text-center max-w-md mx-auto my-8">
              <Download className="w-12 h-12 text-muted mx-auto mb-3" />
              <h3 className="text-xl font-bold text-text mb-2">No Downloaded Videos</h3>
              <p className="text-sm text-muted mb-6">Explore the platform to download your favorite videos!</p>
              <Link to="/" className="px-6 py-2.5 bg-primary text-white rounded-xl font-medium text-sm">
                Browse Videos
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {downloads.map((item) => {
                const v = item.video;
                if (!v) return null;

                return (
                  <div key={item._id} className="group bg-surface border border-border rounded-2xl overflow-hidden hover:border-primary/50 transition-all duration-300 shadow-md flex flex-col">
                    <div className="relative aspect-video bg-black overflow-hidden">
                      <img src={v.thumbnail || v.thumbnailUrl} alt={v.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <button onClick={() => navigate(`/video/${v._id}`)} className="w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center shadow-xl">
                          <Play className="w-6 h-6 fill-current ml-0.5" />
                        </button>
                      </div>
                      {v.duration > 0 && (
                        <span className="absolute bottom-3 right-3 bg-black/80 text-white text-xs font-mono px-2 py-1 rounded">
                          {formatDuration(v.duration)}
                        </span>
                      )}
                      {item.videoSource && (
                        <span className="absolute top-3 left-3 bg-primary/90 text-white text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full">
                          {item.videoSource}
                        </span>
                      )}
                    </div>

                    <div className="p-5 flex-1 flex flex-col justify-between">
                      <div>
                        <h3 className="font-bold text-text text-base line-clamp-1 mb-2 group-hover:text-primary transition-colors">
                          {v.title}
                        </h3>

                        <div className="flex flex-wrap items-center gap-2 mb-3 text-xs text-muted">
                          {v.category && (
                            <span className="flex items-center gap-1 bg-background px-2.5 py-1 rounded-md border border-border font-medium">
                              <Tag className="w-3 h-3 text-primary" />
                              {v.category}
                            </span>
                          )}
                          <span className="flex items-center gap-1 bg-background px-2.5 py-1 rounded-md border border-border font-medium">
                            Plan: {item.planUsed || 'Free'}
                          </span>
                        </div>

                        <div className="text-xs text-muted flex items-center gap-1.5 mb-4">
                          <Calendar className="w-3.5 h-3.5 text-muted" />
                          Downloaded {new Date(item.downloadDate).toLocaleDateString()} at {new Date(item.downloadDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 pt-3 border-t border-border/50">
                        <button
                          onClick={() => navigate(`/video/${v._id}`)}
                          className="flex-1 py-2 px-3 bg-background hover:bg-surface-light border border-border text-text font-medium text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5"
                        >
                          <Play className="w-3.5 h-3.5" />
                          Watch
                        </button>

                        <button
                          onClick={() => handleRedownload(v)}
                          disabled={downloadingId === v._id}
                          className="flex-1 py-2 px-3 bg-primary hover:bg-blue-600 text-white font-medium text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
                        >
                          <RefreshCw className={`w-3.5 h-3.5 ${downloadingId === v._id ? 'animate-spin' : ''}`} />
                          {downloadingId === v._id ? 'Saving...' : 'Re-download'}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Uploads Tab Content */}
      {activeTab === 'uploads' && (
        <div>
          {myVideos.length === 0 ? (
            <div className="bg-surface/50 border border-border rounded-3xl p-12 text-center max-w-md mx-auto my-8">
              <Video className="w-12 h-12 text-muted mx-auto mb-3" />
              <h3 className="text-xl font-bold text-text mb-2">No Uploaded Videos</h3>
              <p className="text-sm text-muted mb-6">Upload videos to share with the community or start Watch Parties!</p>
              <Link to="/upload" className="px-6 py-2.5 bg-primary text-white rounded-xl font-medium text-sm">
                Upload a Video
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {myVideos.map(video => (
                <VideoCard key={video._id} video={video} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
