// services/spotify.service.ts
// Extrae metadata del Open Graph sin necesidad de OAuth
export async function getSongMetadata(url: string): Promise<{
  title: string;
  artist: string;
  coverUrl?: string;
  platform: 'spotify' | 'youtube';
} | null> {
  // Para Spotify: usar oEmbed API (gratuita, sin auth)
  if (url.includes('spotify.com')) {
    const res = await fetch(`https://open.spotify.com/oembed?url=${encodeURIComponent(url)}`);
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`Spotify oEmbed error (${res.status}): ${text.slice(0, 120)}`);
    }
    const data: any = await res.json();
    const rawTitle = String(data?.title ?? '').trim();
    const parts = rawTitle.split(' - ').map((p) => p.trim()).filter(Boolean);
    return {
      title: rawTitle || String(data?.author_name ?? 'Spotify'),
      artist: parts.length >= 2 ? parts[parts.length - 1] : String(data?.author_name ?? ''),
      coverUrl: data?.thumbnail_url ? String(data.thumbnail_url) : undefined,
      platform: 'spotify' as const,
    };
  }
  // YouTube: usar noembed.com (gratuito)
  if (
    url.includes('youtube.com') ||
    url.includes('youtu.be') ||
    url.includes('music.youtube.com') ||
    url.includes('m.youtube.com')
  ) {
    const res = await fetch(`https://noembed.com/embed?url=${encodeURIComponent(url)}`);
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`noembed error (${res.status}): ${text.slice(0, 120)}`);
    }
    const data: any = await res.json();
    if (data?.error) {
      throw new Error(`noembed error: ${String(data.error)}`);
    }
    return {
      title: String(data?.title ?? 'YouTube'),
      artist: String(data?.author_name ?? ''),
      coverUrl: data?.thumbnail_url ? String(data.thumbnail_url) : undefined,
      platform: 'youtube' as const,
    };
  }

  return null;
}
