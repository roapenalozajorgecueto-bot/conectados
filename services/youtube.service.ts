import { Song } from '@/types';

interface YouTubeVideo {
  id: {
    videoId: string;
  };
  snippet: {
    title: string;
    channelTitle: string;
    thumbnails: {
      medium: {
        url: string;
      };
    };
  };
}

export const youtubeService = {
  async getVideoDetails(videoUrl: string): Promise<Song | null> {
    try {
      const videoId = extractYouTubeVideoId(videoUrl);
      if (!videoId) return null;

      const response = await fetch(`/api/youtube/video/${videoId}`);
      
      if (!response.ok) {
        console.error('YouTube API error:', response.status);
        return null;
      }

      const video: YouTubeVideo = await response.json();

      return {
        title: video.snippet.title,
        artist: video.snippet.channelTitle,
        thumbnail: video.snippet.thumbnails.medium?.url || '',
        url: `https://www.youtube.com/watch?v=${videoId}`,
        platform: 'youtube',
        youtubeId: videoId,
      };
    } catch (error) {
      console.error('Error fetching YouTube video:', error);
      return null;
    }
  },

  async searchVideos(query: string): Promise<Song[]> {
    try {
      const response = await fetch(`/api/youtube/search?q=${encodeURIComponent(query)}`);
      
      if (!response.ok) return [];

      const data = await response.json();
      
      return data.items.map((video: YouTubeVideo) => ({
        title: video.snippet.title,
        artist: video.snippet.channelTitle,
        thumbnail: video.snippet.thumbnails.medium?.url || '',
        url: `https://www.youtube.com/watch?v=${video.id.videoId}`,
        platform: 'youtube',
        youtubeId: video.id.videoId,
      }));
    } catch (error) {
      console.error('Error searching YouTube:', error);
      return [];
    }
  },
};

function extractYouTubeVideoId(url: string): string | null {
  // Match patterns like:
  // https://www.youtube.com/watch?v=dQw4w9WgXcQ
  // https://youtu.be/dQw4w9WgXcQ
  // https://www.youtube.com/embed/dQw4w9WgXcQ
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }

  return null;
}
