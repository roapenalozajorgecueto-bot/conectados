import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { WebView } from 'react-native-webview';
import * as WebBrowser from 'expo-web-browser';

function extractYouTubeVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  return null;
}

function toYouTubeEmbedUrl(url: string) {
  const id = extractYouTubeVideoId(url);
  if (!id) return null;
  // Nota: algunos videos no permiten reproducción embebida y muestran un error del reproductor.
  // En ese caso, ofrecemos "Abrir en YouTube" como fallback.
  return `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&playsinline=1&controls=1&rel=0&origin=https%3A%2F%2Fwww.youtube.com`;
}

function toSpotifyEmbedUrl(url: string) {
  // Supported:
  // https://open.spotify.com/track/{id}
  // https://open.spotify.com/album/{id}
  // https://open.spotify.com/playlist/{id}
  const m = url.match(/open\.spotify\.com\/(track|album|playlist)\/([A-Za-z0-9]+)(?:\\?|$)/);
  if (!m) return null;
  const [, type, id] = m;
  return `https://open.spotify.com/embed/${type}/${id}`;
}

export default function PlayerScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    url?: string;
    platform?: 'spotify' | 'youtube';
    title?: string;
    artist?: string;
  }>();

  const url = typeof params.url === 'string' ? params.url : '';
  const platform = params.platform === 'spotify' || params.platform === 'youtube' ? params.platform : undefined;

  const title = typeof params.title === 'string' ? params.title : '';
  const artist = typeof params.artist === 'string' ? params.artist : '';

  const embedUrl =
    platform === 'youtube' ? toYouTubeEmbedUrl(url) : platform === 'spotify' ? toSpotifyEmbedUrl(url) : null;

  if (!embedUrl) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Reproductor</Text>
        <View style={styles.card}>
          <Text style={styles.errorText}>No se pudo cargar este enlace.</Text>
          <Text style={styles.muted}>{url}</Text>
          <Text style={styles.link} onPress={() => router.back()}>
            Volver
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title} numberOfLines={1}>
        {title || 'Reproductor'}
      </Text>
      {artist ? (
        <Text style={styles.subtitle} numberOfLines={1}>
          {artist}
        </Text>
      ) : null}

      {url ? (
        <Pressable
          style={styles.openButton}
          onPress={async () => {
            try {
              await WebBrowser.openBrowserAsync(url);
            } catch {
              // Si falla, vuelve atrás; el usuario puede copiar el link desde la tarjeta
              router.back();
            }
          }}
        >
          <Text style={styles.openButtonText}>
            {platform === 'youtube' ? 'Abrir en YouTube' : platform === 'spotify' ? 'Abrir en Spotify' : 'Abrir enlace'}
          </Text>
        </Pressable>
      ) : null}

      <View style={styles.playerCard}>
        <WebView
          source={{ uri: embedUrl }}
          javaScriptEnabled
          domStorageEnabled
          allowsFullscreenVideo
          mediaPlaybackRequiresUserAction={false}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
    padding: 16,
    gap: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
  },
  subtitle: {
    color: '#6B7280',
    marginBottom: 6,
  },
  openButton: {
    alignSelf: 'flex-start',
    backgroundColor: '#007AFF',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 4,
  },
  openButtonText: {
    color: '#fff',
    fontWeight: '800',
  },
  playerCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#E5E5EA',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#E5E5EA',
    gap: 8,
  },
  errorText: {
    fontWeight: '800',
    color: '#111',
  },
  muted: {
    color: '#6B7280',
  },
  link: {
    marginTop: 6,
    color: '#007AFF',
    fontWeight: '800',
  },
});
