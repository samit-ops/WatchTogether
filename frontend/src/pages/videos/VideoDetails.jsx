import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import videoService from '@/services/video.service';
import { CustomVideoPlayer } from '@/components/video/CustomVideoPlayer';
import { Loader } from '@/components/ui/Loader';
import { VideoCard } from '@/components/video/VideoCard';
import { ThumbsUp, ThumbsDown, Share2, Plus, Flag, Download } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import downloadService from '@/services/download.service';
import { toast } from '@/utils/toast';
import { CommentSection } from '@/components/comments/CommentSection';

export default function VideoDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [video, setVideo] = useState(null);
  const [relatedVideos, setRelatedVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toastMsg, setToastMsg] = useState('');
  const [downloading, setDownloading] = useState(false);

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3000);
  };

  const handleVideoLike = async () => {
    if (!user) {
      toast.info('Please log in to like videos.');
      return;
    }
    try {
      const res = await videoService.likeVideo(id);
      const data = res.data || res;
      setVideo(prev => ({
        ...prev,
        likes: data.likes,
        dislikes: data.dislikes,
        isLiked: data.isLiked,
        isDisliked: data.isDisliked
      }));
    } catch (err) {
      toast.error('Failed to update reaction.');
    }
  };

  const handleVideoDislike = async () => {
    if (!user) {
      toast.info('Please log in to dislike videos.');
      return;
    }
    try {
      const res = await videoService.dislikeVideo(id);
      const data = res.data || res;
      setVideo(prev => ({
        ...prev,
        likes: data.likes,
        dislikes: data.dislikes,
        isLiked: data.isLiked,
        isDisliked: data.isDisliked
      }));
    } catch (err) {
      toast.error('Failed to update reaction.');
    }
  };

  const handleDownload = async () => {
    if (!user) {
      toast.info('Please log in to download videos.');
      navigate(`/login?redirect=/video/${id}`);
      return;
    }

    setDownloading(true);
    try {
      const res = await downloadService.downloadVideo(id, video?.title);
      
      if (!res.success && (res.limitReached !== undefined || res.usedToday >= res.limit)) {
        toast.error(res.message || `Daily download limit reached (${res.usedToday}/${res.limit})`);
        return;
      }

      if (res.data?.video?.videoUrl || res.video?.videoUrl || res.success) {
        toast.success(`Download started! Daily usage: ${res.data?.usedToday || res.usedToday || 1}/${res.data?.limit || res.limit || 1}`);
      } else {
        toast.error(res.message || 'Could not initiate download');
      }
    } catch (err) {
      console.error('Download Error:', err);
      const msg = err.response?.data?.message || err.message || 'Download failed';
      toast.error(msg);
    } finally {
      setDownloading(false);
    }
  };

  const handleShare = async () => {
    const shareData = {
      title: video?.title || 'Watch Together Video',
      text: `Check out this video on Watch Together!`,
      url: window.location.href,
    };

    if (navigator.share && /mobile|android|iphone|ipad|ipod/i.test(navigator.userAgent)) {
      try {
        await navigator.share(shareData);
        return;
      } catch (err) {
        console.log('Native share failed or cancelled');
      }
    }
    
    // Fallback to clipboard
    try {
      await navigator.clipboard.writeText(window.location.href);
      showToast('Video link copied.');
    } catch (err) {
      showToast('Failed to copy link.');
    }
  };

  const viewedRef = useRef(null);

  useEffect(() => {
    const fetchVideoData = async () => {
      setLoading(true);
      setError('');
      try {
        const [videoRes, allVideosRes] = await Promise.all([
          videoService.getVideoById(id),
          videoService.getAllVideos()
        ]);
        
        const fetchedVideo = videoRes.video;
        setRelatedVideos(
          allVideosRes.videos.filter(v => v._id !== id).slice(0, 10)
        );
        
        // Increment view count EXACTLY ONCE (+1) and update view count in UI
        if (viewedRef.current !== id) {
          viewedRef.current = id;
          try {
            const incRes = await videoService.incrementViews(id);
            const data = incRes.data || incRes;
            const updatedViews = data.views !== undefined ? data.views : (fetchedVideo.views + 1);
            setVideo({ ...fetchedVideo, views: updatedViews });
          } catch (e) {
            setVideo(fetchedVideo);
          }
        } else {
          setVideo(fetchedVideo);
        }
        
      } catch (err) {
        setError('Video not found or unavailable.');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchVideoData();
    }
  }, [id]);

  if (loading) {
    return (
      <div className="flex h-[80vh] w-full items-center justify-center">
        <Loader size={48} />
      </div>
    );
  }

  if (error || !video) {
    return (
      <div className="flex h-[80vh] w-full flex-col items-center justify-center gap-4 text-center px-4">
        <p className="text-xl font-medium text-red-500">{error || 'Video not found'}</p>
        <Link to="/" className="px-6 py-2 bg-primary hover:bg-blue-600 text-white rounded-md transition-colors">
          Go Home
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl min-h-screen">
      <div className="flex flex-col lg:flex-row gap-8">
        
        {/* Main Content Area */}
        <div className="flex-1 lg:w-2/3 xl:w-3/4">
          <CustomVideoPlayer 
            src={video.videoUrl} 
            poster={video.thumbnail}
            nextVideo={relatedVideos[0]}
            onNextVideo={() => relatedVideos[0] && navigate(`/video/${relatedVideos[0]._id}`)}
          />
          
          <div className="mt-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-text">
              {video.title}
            </h1>
            
            <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
              <div className="flex items-center gap-4">
                {video.uploadedBy?.avatar ? (
                  <img src={video.uploadedBy.avatar} alt="User" className="h-12 w-12 rounded-full object-cover" />
                ) : (
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-surface text-lg font-bold">
                    {video.uploadedBy?.name?.charAt(0) || '?'}
                  </div>
                )}
                <div>
                  <h3 className="font-semibold text-text text-lg">{video.uploadedBy?.name || 'Unknown'}</h3>
                  <p className="text-sm text-muted">{video.views.toLocaleString()} views • {new Date(video.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0 hide-scrollbar">
                {/* Like & Dislike Video Pill */}
                <div className="flex items-center bg-surface border border-border rounded-full p-0.5 shadow-sm">
                  <button 
                    onClick={handleVideoLike}
                    className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-l-full hover:bg-surface-light transition-colors text-sm font-medium ${video.isLiked ? 'text-primary font-bold' : ''}`}
                    title="Like video"
                  >
                    <ThumbsUp className={`h-4 w-4 ${video.isLiked ? 'fill-primary text-primary' : ''}`} />
                    <span>{video.likes || 0}</span>
                  </button>
                  <div className="w-[1px] h-4 bg-border" />
                  <button 
                    onClick={handleVideoDislike}
                    className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-r-full hover:bg-surface-light transition-colors text-sm font-medium ${video.isDisliked ? 'text-red-400 font-bold' : ''}`}
                    title="Dislike video"
                  >
                    <ThumbsDown className={`h-4 w-4 ${video.isDisliked ? 'fill-red-400 text-red-400' : ''}`} />
                    {video.dislikes > 0 && <span>{video.dislikes}</span>}
                  </button>
                </div>
                <button 
                  onClick={handleShare}
                  className="flex items-center gap-2 px-4 py-2 rounded-full bg-surface hover:bg-surface-light transition-colors whitespace-nowrap text-sm font-medium"
                >
                  <Share2 className="h-4 w-4" />
                  Share
                </button>
                <button 
                  onClick={handleDownload}
                  disabled={downloading}
                  className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary text-white hover:bg-blue-600 transition-colors whitespace-nowrap text-sm font-medium disabled:opacity-50"
                >
                  <Download className="h-4 w-4" />
                  {downloading ? 'Downloading...' : 'Download'}
                </button>
                <button 
                  onClick={() => showToast('Coming Soon')}
                  className="flex items-center gap-2 px-4 py-2 rounded-full bg-surface hover:bg-surface-light transition-colors whitespace-nowrap text-sm font-medium"
                  title="Coming Soon"
                >
                  <Plus className="h-4 w-4" />
                  Save
                </button>
                <button 
                  onClick={() => showToast('Coming Soon')}
                  className="flex items-center justify-center h-10 w-10 rounded-full bg-surface hover:bg-surface-light transition-colors flex-shrink-0"
                  title="Coming Soon"
                >
                  <Flag className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="mt-6 rounded-xl bg-surface/50 p-4 border border-border">
              <div className="flex gap-2 mb-2">
                <span className="text-xs font-semibold px-2 py-1 bg-primary/20 text-primary rounded-md">
                  {video.category}
                </span>
                {video.tags?.map((tag, idx) => (
                  <span key={idx} className="text-xs font-medium px-2 py-1 bg-background text-muted rounded-md">
                    #{tag}
                  </span>
                ))}
              </div>
              <p className="text-sm text-text whitespace-pre-wrap leading-relaxed">
                {video.description}
              </p>
            </div>

            {/* Real-time Multilingual YouTube-Style Comment Section */}
            <CommentSection 
              videoId={id} 
              videoUploaderId={video.uploadedBy?._id || video.uploadedBy} 
              videoSource={video.source}
            />
          </div>
        </div>

        {/* Sidebar / Related Videos */}
        <div className="w-full lg:w-1/3 xl:w-1/4">
          <h3 className="text-lg font-bold mb-4">Up Next</h3>
          <div className="flex flex-col gap-4">
            {relatedVideos.length > 0 ? (
              relatedVideos.map(v => (
                <div key={v._id} className="w-full">
                   <VideoCard video={v} />
                </div>
              ))
            ) : (
              <p className="text-muted text-sm">No related videos available.</p>
            )}
          </div>
        </div>

      </div>

      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50 bg-primary text-white px-4 py-2 rounded-lg shadow-xl font-medium animate-in fade-in duration-300 pointer-events-none">
          {toastMsg}
        </div>
      )}
    </div>
  );
}
