import { describe, expect, it } from '@jest/globals';
import {
  detectSongPlatform,
  extractYouTubeVideoId,
  isSupportedSongUrl,
  normalizeYouTubeUrl,
} from '../utils/songLink';

describe('songLink utils', () => {
  it('detects platform', () => {
    expect(detectSongPlatform('https://open.spotify.com/track/abc')).toBe('spotify');
    expect(detectSongPlatform('https://youtu.be/dQw4w9WgXcQ')).toBe('youtube');
    expect(detectSongPlatform('')).toBeNull();
    expect(detectSongPlatform('https://example.com')).toBeNull();
  });

  it('extracts YouTube video id from common URL formats', () => {
    expect(extractYouTubeVideoId('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
    expect(extractYouTubeVideoId('https://youtu.be/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
    expect(extractYouTubeVideoId('https://www.youtube.com/embed/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
  });

  it('normalizes YouTube URLs to watch?v=', () => {
    expect(normalizeYouTubeUrl('https://youtu.be/dQw4w9WgXcQ')).toBe(
      'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    );
    expect(normalizeYouTubeUrl('not a url')).toBeNull();
  });

  it('validates supported song URLs', () => {
    expect(isSupportedSongUrl('https://open.spotify.com/track/abc')).toBe(true);
    expect(isSupportedSongUrl('https://youtu.be/dQw4w9WgXcQ')).toBe(true);
    expect(isSupportedSongUrl('https://youtube.com/watch?v=short')).toBe(false);
    expect(isSupportedSongUrl('https://example.com')).toBe(false);
  });
});

