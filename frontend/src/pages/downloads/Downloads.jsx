import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import downloadService from '@/services/download.service';
import { useAuth } from '@/contexts/AuthContext';
import { Loader } from '@/components/ui/Loader';
import { toast } from '@/utils/toast';
import { Download, Play, Clock, Sparkles, HardDrive, AlertCircle, RefreshCw, Calendar, Tag } from 'lucide-react';

export default function Downloads() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [downloads, setDownloads] = useState([]);
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [downloadsRes, statusRes] = await Promise.all([
        downloadService.getUserDownloads(),
        downloadService.getDownloadStatus()
      ]);

      if (downloadsRes.data) {
        setDownloads(downloadsRes.data);
      } else if (Array.isArray(downloadsRes)) {
        setDownloads(downloadsRes);
      }

      if (statusRes.data) {
        setStatus(statusRes.data);
      } else if (statusRes.plan) {
        setStatus(statusRes);
      }
    } catch (err) {
      console.error('Error fetching downloads:', err);
      toast.error('Failed to load download history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchData();
    } else {
      setLoading(false);
    }
  }, [user]);

  const handleRedownload = async (video) => {
    if (!video || !video._id) return;

    setDownloadingId(video._id);
    try {
      const res = await downloadService.downloadVideo(video._id);

      if (!res.success && res.limitReached !== undefined) {
        toast.error(res.message || `Daily download limit reached (${res.usedToday}/${res.limit})`);
        return;
      }

      if (res.data?.video?.videoUrl || res.video?.videoUrl) {
        const vUrl = res.data?.video?.videoUrl || res.video?.videoUrl;
        const link = document.createElement('a');
        link.href = vUrl;
        link.download = `${video.title || 'video'}.mp4`;
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        toast.success(`Download started! Daily usage: ${res.data?.usedToday || res.usedToday || 1}/${res.data?.limit || res.limit || 1}`);
        fetchData();
      } else {
        toast.error(res.message || 'Could not initiate re-download');
      }
    } catch (err) {
      console.error('Re-download Error:', err);
      const msg = err.response?.data?.message || err.message || 'Re-download failed';
      toast.error(msg);
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
          <Download className="w-16 h-16 text-primary mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-text mb-2">Access Your Downloads</h2>
          <p className="text-muted text-sm mb-6">
            Please log in to view your downloaded videos and check your daily plan quota.
          </p>
          <button
            onClick={() => navigate('/login?redirect=/downloads')}
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

  const userPlan = status?.plan || user.subscription || 'Free';
  const usedToday = status?.usedToday || 0;
  const limit = status?.limit || (userPlan === 'Free' ? 1 : 5);
  const remaining = Math.max(0, limit - usedToday);
  const progressPercent = Math.min(100, Math.round((usedToday / limit) * 100));

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-primary/20 text-primary flex items-center justify-center">
              <Download className="w-5 h-5" />
            </div>
            <h1 className="text-3xl font-bold text-text">My Downloads</h1>
          </div>
          <p className="text-muted text-sm">
            Track your downloaded video history and daily quota limits.
          </p>
        </div>

        <button
          onClick={() => navigate('/subscriptions')}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-primary to-blue-600 hover:opacity-90 text-white font-medium rounded-xl transition-all shadow-lg shrink-0"
        >
          <Sparkles className="w-4 h-4" />
          <span>Upgrade Plan</span>
        </button>
      </div>

      {/* Quota Status Card */}
      <div className="bg-surface border border-border rounded-3xl p-6 mb-10 shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -z-10 pointer-events-none" />
        
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex-1 w-full">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-muted">Current Plan:</span>
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-primary/20 text-primary uppercase tracking-wide">
                  {userPlan} Plan
                </span>
              </div>
              <span className="text-sm font-mono font-medium text-text">
                {usedToday} / {limit >= 100 ? '100 (Unlimited)' : `${limit} downloads today`}
              </span>
            </div>

            {/* Progress Bar */}
            <div className="w-full h-3 bg-background rounded-full overflow-hidden border border-border/50">
              <div
                className={`h-full transition-all duration-500 rounded-full ${
                  progressPercent >= 100 ? 'bg-red-500' : 'bg-primary'
                }`}
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            <div className="flex items-center justify-between mt-3 text-xs text-muted">
              <span>{remaining} download{remaining !== 1 ? 's' : ''} remaining today</span>
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                Resets at UTC Midnight
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Downloads List */}
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-xl font-bold text-text flex items-center gap-2">
          <HardDrive className="w-5 h-5 text-primary" />
          Downloaded Videos ({downloads.length})
        </h2>
      </div>

      {downloads.length === 0 ? (
        <div className="bg-surface/50 border border-border rounded-3xl p-12 text-center max-w-md mx-auto my-12">
          <div className="w-16 h-16 rounded-2xl bg-surface border border-border text-muted flex items-center justify-center mx-auto mb-4">
            <Download className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-text mb-2">No Downloaded Videos Yet</h3>
          <p className="text-sm text-muted mb-6">
            Videos you download will appear here so you can re-download or watch them anytime.
          </p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-primary hover:bg-blue-600 text-white font-medium rounded-xl transition-colors"
          >
            <Play className="w-4 h-4" />
            Browse Videos
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {downloads.map((item) => {
            const video = item.video;
            if (!video) return null;

            return (
              <div
                key={item._id}
                className="group bg-surface border border-border rounded-2xl overflow-hidden hover:border-primary/50 transition-all duration-300 shadow-md flex flex-col"
              >
                {/* Thumbnail */}
                <div className="relative aspect-video bg-black overflow-hidden">
                  <img
                    src={video.thumbnail || video.thumbnailUrl}
                    alt={video.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button
                      onClick={() => navigate(`/video/${video._id}`)}
                      className="w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center transform scale-90 group-hover:scale-100 transition-transform shadow-xl"
                    >
                      <Play className="w-6 h-6 fill-current ml-0.5" />
                    </button>
                  </div>
                  {video.duration > 0 && (
                    <span className="absolute bottom-3 right-3 bg-black/80 text-white text-xs font-mono px-2 py-1 rounded">
                      {formatDuration(video.duration)}
                    </span>
                  )}
                  {item.videoSource && (
                    <span className="absolute top-3 left-3 bg-primary/90 text-white text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full">
                      {item.videoSource}
                    </span>
                  )}
                </div>

                {/* Details */}
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-bold text-text text-base line-clamp-1 mb-2 group-hover:text-primary transition-colors">
                      {video.title}
                    </h3>
                    
                    <div className="flex flex-wrap items-center gap-2 mb-4 text-xs text-muted">
                      {video.category && (
                        <span className="flex items-center gap-1 bg-background px-2.5 py-1 rounded-md border border-border font-medium">
                          <Tag className="w-3 h-3 text-primary" />
                          {video.category}
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

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-3 border-t border-border/50">
                    <button
                      onClick={() => navigate(`/video/${video._id}`)}
                      className="flex-1 py-2 px-3 bg-background hover:bg-surface-light border border-border text-text font-medium text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5"
                    >
                      <Play className="w-3.5 h-3.5" />
                      Watch
                    </button>

                    <button
                      onClick={() => handleRedownload(video)}
                      disabled={downloadingId === video._id}
                      className="flex-1 py-2 px-3 bg-primary hover:bg-blue-600 text-white font-medium text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${downloadingId === video._id ? 'animate-spin' : ''}`} />
                      {downloadingId === video._id ? 'Saving...' : 'Re-download'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
