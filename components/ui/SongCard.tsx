import { View, Text, Image, Pressable, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Song } from '@/types';
import { deleteSong } from '@/services/firebase/firestore.service';

interface SongCardProps {
  song: Song | any;
}

export default function SongCard({ song }: SongCardProps) {
  const router = useRouter();

  const formatDate = (timestamp: any) => {
    if (!timestamp) return '';
    const date = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleOpen = async () => {
    const url = song?.url;
    const platform = song?.platform;
    if (typeof url !== 'string' || url.trim().length === 0) return;
    if (platform !== 'spotify' && platform !== 'youtube') return;

    router.push({
      pathname: '/player',
      params: {
        url,
        platform,
        title: String(song?.title ?? ''),
        artist: String(song?.artist ?? ''),
      },
    });
  };

  const handleDelete = () => {
    const id = String(song?.id ?? '');
    if (!id) return;

    Alert.alert('Eliminar', '¿Eliminar esta canción del historial?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteSong(id);
          } catch (err) {
            console.error('deleteSong error', err);
            Alert.alert('Error', 'No se pudo eliminar. Revisa permisos de Firestore.');
          }
        },
      },
    ]);
  };

  return (
    <View style={styles.card}>
      <Pressable style={styles.openArea} onPress={handleOpen}>
        <Image
          source={{ uri: song?.thumbnail || song?.coverUrl || 'https://via.placeholder.com/60' }}
          style={styles.thumbnail}
        />
        <View style={styles.info}>
          <Text style={styles.title} numberOfLines={1}>
            {song?.title}
          </Text>
          <Text style={styles.artist} numberOfLines={1}>
            {song?.artist}
          </Text>
          <Text style={styles.date}>{formatDate(song?.sharedAt || song?.timestamp)}</Text>
        </View>
      </Pressable>

      <View style={styles.rightCol}>
        <Text style={styles.platformIcon}>{song?.platform === 'spotify' ? '🎵' : '▶️'}</Text>
        <Pressable style={styles.deleteButton} onPress={handleDelete} hitSlop={10}>
          <Ionicons name="trash-outline" size={18} color="#FF3B30" />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 12,
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#E5E5EA',
  },
  openArea: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  thumbnail: {
    width: 60,
    height: 60,
    borderRadius: 12,
    backgroundColor: '#ddd',
  },
  info: {
    flex: 1,
    marginLeft: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111',
  },
  artist: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  date: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 4,
  },
  rightCol: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingLeft: 10,
  },
  platformIcon: {
    fontSize: 16,
  },
  deleteButton: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF5F5',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#FFD1D1',
  },
});

