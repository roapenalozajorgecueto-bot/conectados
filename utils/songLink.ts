export type SongPlatform = 'spotify' | 'youtube';

export function detectSongPlatform(url: string): SongPlatform | null {
  const value = String(url ?? '').trim().toLowerCase();
  if (!value) return null;
  if (value.includes('spotify.com')) return 'spotify';
  if (
    value.includes('youtube.com') ||
    value.includes('youtu.be') ||
    value.includes('music.youtube.com') ||
    value.includes('m.youtube.com')
  ) {
    return 'youtube';
  }
  return null;
}

export function extractYouTubeVideoId(url: string): string | null {
  const value = String(url ?? '').trim();
  if (!value) return null;

  const patterns = [
    /(?:youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/,
    /(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /(?:music\.youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/,
    /(?:m\.youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/,
  ];

  for (const pattern of patterns) {
    const match = value.match(pattern);
    if (match?.[1]) return match[1];
  }
  return null;
}

export function normalizeYouTubeUrl(url: string): string | null {
  const id = extractYouTubeVideoId(url);
  if (!id) return null;
  return `https://www.youtube.com/watch?v=${id}`;
}

export function isSupportedSongUrl(url: string) {
  const platform = detectSongPlatform(url);
  if (!platform) return false;
  if (platform === 'spotify') return true;
  return extractYouTubeVideoId(url) !== null;
}

