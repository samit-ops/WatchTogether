import api from './api';

const downloadService = {
  downloadVideo: async (videoId, title = 'video') => {
    try {
      const response = await api.post(`/v1/downloads/${videoId}`);
      const videoData = response.data?.video || response.video;

      if ((response.success || response.status === 'success' || response.data) && videoData?.videoUrl) {
        const vUrl = videoData.videoUrl;
        
        // Fetch as blob to trigger instant local file download without CORS navigation errors
        try {
          const fileRes = await fetch(vUrl);
          if (fileRes.ok) {
            const blob = await fileRes.blob();
            const blobUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = blobUrl;
            const sanitizedTitle = (videoData.title || title).replace(/[^a-zA-Z0-9_\- ]/g, '');
            link.download = `${sanitizedTitle || 'video'}.mp4`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(blobUrl);
          } else {
            // Direct link fallback
            const link = document.createElement('a');
            link.href = vUrl;
            link.download = `${title}.mp4`;
            link.target = '_blank';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
          }
        } catch (e) {
          // Direct link fallback
          const link = document.createElement('a');
          link.href = vUrl;
          link.download = `${title}.mp4`;
          link.target = '_blank';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }
      }

      return response;
    } catch (error) {
      if (error.response && error.response.data) {
        return error.response.data;
      }
      throw error;
    }
  },

  getUserDownloads: async () => {
    const response = await api.get('/v1/downloads/my');
    return response;
  },

  getDownloadStatus: async () => {
    try {
      const response = await api.get('/v1/downloads/status');
      return response;
    } catch (error) {
      if (error.response && error.response.data) {
        return error.response.data;
      }
      throw error;
    }
  },
};

export default downloadService;
