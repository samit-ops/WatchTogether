import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import videoService from '@/services/video.service';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { UploadCloud, FileVideo, Image as ImageIcon, X, Globe, Users } from 'lucide-react';
import { toast } from '@/utils/toast';

export default function UploadVideo() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Movies');
  const [uploadType, setUploadType] = useState('platform'); // 'platform' or 'watchparty'
  const [videoFile, setVideoFile] = useState(null);
  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [tags, setTags] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [progress, setProgress] = useState(0);

  const videoInputRef = useRef(null);
  const thumbnailInputRef = useRef(null);
  const navigate = useNavigate();

  const handleVideoSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 100 * 1024 * 1024) {
        const msg = 'Video file exceeds free plan limit of 100MB. Switch to a paid plan to upgrade your upload limit.';
        setError(msg);
        toast.error(msg);
        return;
      }
      setVideoFile(file);
    }
  };

  const handleThumbnailSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      setThumbnailFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!title || !description || !category || !videoFile || !thumbnailFile) {
      setError('Please fill in all required fields and select files.');
      return;
    }

    const formData = new FormData();
    formData.append('title', title);
    formData.append('description', description);
    formData.append('category', category);
    formData.append('source', uploadType);
    formData.append('tags', tags);
    formData.append('video', videoFile);
    formData.append('thumbnail', thumbnailFile);

    setLoading(true);
    setProgress(1);

    try {
      await videoService.uploadVideo(formData, (percent) => {
        // Scale to 95% to allow Cloudinary server processing time
        const scaledPercent = Math.min(95, Math.max(1, percent));
        setProgress(scaledPercent);
      });
      
      setProgress(100);
      toast.success('Video uploaded successfully!');
      
      setTimeout(() => {
        navigate('/');
      }, 800);
    } catch (err) {
      console.error('Video upload error:', err);
      const errMsg = err.response?.data?.message || 'Failed to upload video. Please ensure files are valid.';
      setError(errMsg);
      toast.error(errMsg);
      setProgress(0);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="rounded-2xl border border-border bg-surface/50 p-8 shadow-xl backdrop-blur-sm">
        <h1 className="text-3xl font-bold text-text mb-2">Upload Video</h1>
        <p className="text-muted mb-8">Select video destination and share your content.</p>

        {error && (
          <div className="mb-6 rounded-md bg-red-500/10 p-4 border border-red-500/20 text-red-500 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Upload Destination Option Selector */}
          <div>
            <label className="block text-sm font-semibold text-text mb-2">
              Select Video Destination *
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Option 1: Upload to Platform */}
              <button
                type="button"
                onClick={() => setUploadType('platform')}
                disabled={loading}
                className={`p-4 rounded-xl border text-left transition-all flex flex-col gap-2 ${
                  uploadType === 'platform'
                    ? 'bg-primary/10 border-primary shadow-md ring-1 ring-primary'
                    : 'bg-background/50 border-border hover:bg-surface text-muted'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-text flex items-center gap-2 text-base">
                    <Globe className="w-5 h-5 text-primary" />
                    Upload to Platform
                  </span>
                  {uploadType === 'platform' && (
                    <span className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse" />
                  )}
                </div>
                <p className="text-xs text-muted leading-relaxed">
                  Publishes video to the public platform library. All users can watch, comment, like, dislike, and share.
                </p>
              </button>

              {/* Option 2: Upload to Watch Party */}
              <button
                type="button"
                onClick={() => setUploadType('watchparty')}
                disabled={loading}
                className={`p-4 rounded-xl border text-left transition-all flex flex-col gap-2 ${
                  uploadType === 'watchparty'
                    ? 'bg-primary/10 border-primary shadow-md ring-1 ring-primary'
                    : 'bg-background/50 border-border hover:bg-surface text-muted'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-text flex items-center gap-2 text-base">
                    <Users className="w-5 h-5 text-purple-400" />
                    Upload to Watch Party
                  </span>
                  {uploadType === 'watchparty' && (
                    <span className="w-2.5 h-2.5 rounded-full bg-purple-400 animate-pulse" />
                  )}
                </div>
                <p className="text-xs text-muted leading-relaxed">
                  Saves video for live Watch Party sessions with friends in real-time video/audio sync rooms.
                </p>
              </button>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text mb-1">Title *</label>
                <Input 
                  value={title} 
                  onChange={e => setTitle(e.target.value)} 
                  placeholder="Video Title" 
                  required 
                  className="bg-background/50"
                  disabled={loading}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-text mb-1">Category *</label>
                <select 
                  value={category} 
                  onChange={e => setCategory(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-border bg-background/50 px-3 py-2 text-sm text-text focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
                  required
                  disabled={loading}
                >
                  <option value="Movies">Movies</option>
                  <option value="TV Shows">TV Shows</option>
                  <option value="Documentaries">Documentaries</option>
                  <option value="Anime">Anime</option>
                  <option value="Sports">Sports</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-text mb-1">Tags (comma separated)</label>
                <Input 
                  value={tags} 
                  onChange={e => setTags(e.target.value)} 
                  placeholder="action, comedy, thriller" 
                  className="bg-background/50"
                  disabled={loading}
                />
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text mb-1">Description *</label>
                <textarea 
                  value={description} 
                  onChange={e => setDescription(e.target.value)}
                  className="flex w-full rounded-md border border-border bg-background/50 px-3 py-2 text-sm text-text focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary min-h-[140px] resize-none disabled:opacity-50"
                  placeholder="Describe your video..."
                  required
                  disabled={loading}
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-border">
            {/* Video File Upload */}
            <div>
              <label className="block text-sm font-medium text-text mb-1">
                Video File * <span className="text-xs text-muted font-normal">(Max 100 MB - Free Plan)</span>
              </label>
              <p className="text-[11px] text-amber-400 font-medium mb-2 flex items-center gap-1">
                ⚡ Switch to a paid plan to upgrade your upload limit up to 4GB+
              </p>
              <input 
                type="file" 
                accept="video/*" 
                className="hidden" 
                ref={videoInputRef}
                onChange={handleVideoSelect}
                disabled={loading}
              />
              <div 
                onClick={() => !loading && videoInputRef.current.click()}
                className={`border-2 border-dashed border-border hover:border-primary/50 rounded-xl p-8 flex flex-col items-center justify-center bg-background/30 transition-colors h-48 ${loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                {videoFile ? (
                  <div className="flex flex-col items-center text-center">
                    <FileVideo className="h-10 w-10 text-primary mb-2" />
                    <span className="text-sm font-medium text-text truncate max-w-[200px]">{videoFile.name}</span>
                    <span className="text-xs text-muted mt-1">{(videoFile.size / (1024 * 1024)).toFixed(2)} MB</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center text-center">
                    <UploadCloud className="h-10 w-10 text-muted mb-2" />
                    <span className="text-sm font-medium text-text">Click to browse</span>
                    <span className="text-xs text-muted mt-1">MP4, WebM, OGG</span>
                  </div>
                )}
              </div>
            </div>

            {/* Thumbnail Upload */}
            <div>
              <label className="block text-sm font-medium text-text mb-2">Thumbnail *</label>
              <input 
                type="file" 
                accept="image/*" 
                className="hidden" 
                ref={thumbnailInputRef}
                onChange={handleThumbnailSelect}
                disabled={loading}
              />
              <div 
                onClick={() => !loading && thumbnailInputRef.current.click()}
                className={`border-2 border-dashed border-border hover:border-primary/50 rounded-xl p-8 flex flex-col items-center justify-center bg-background/30 transition-colors h-48 relative overflow-hidden ${loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                {thumbnailFile ? (
                  <>
                    <img 
                      src={URL.createObjectURL(thumbnailFile)} 
                      alt="Thumbnail preview" 
                      className="absolute inset-0 w-full h-full object-cover opacity-50"
                    />
                    <div className="relative z-10 flex flex-col items-center text-center">
                      <ImageIcon className="h-10 w-10 text-white mb-2 shadow-sm" />
                      <span className="text-sm font-medium text-white shadow-sm truncate max-w-[200px]">{thumbnailFile.name}</span>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center text-center">
                    <ImageIcon className="h-10 w-10 text-muted mb-2" />
                    <span className="text-sm font-medium text-text">Click to browse</span>
                    <span className="text-xs text-muted mt-1">JPG, PNG, WebP</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {loading && (
            <div className="w-full bg-background rounded-full h-2 mt-4 overflow-hidden">
              <div 
                className="bg-primary h-2 rounded-full transition-all duration-300 ease-out" 
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          )}

          <div className="flex justify-end pt-4">
            <Button type="button" variant="outline" className="mr-4" onClick={() => navigate(-1)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" isLoading={loading}>
              {loading ? 'Uploading...' : 'Upload Video'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
