import { View, Text, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useSharedSongs } from '@/hooks/useSharedSongs';
import SongCard from '@/components/ui/SongCard';
import EmptyState from '@/components/common/EmptyState';
import { useAuth } from '@/hooks/useAuth';

export default function SongsScreen() {
  const router = useRouter();
  const { profile } = useAuth();
  const { songs, isLoading } = useSharedSongs();

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Canciones</Text>
        <View style={styles.card}>
          <Text style={styles.muted}>Cargando...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Canciones</Text>
        <TouchableOpacity style={styles.shareButton} onPress={() => router.push('/share-song')}>
          <Text style={styles.shareButtonText}>Compartir</Text>
        </TouchableOpacity>
      </View>

      {songs.length === 0 ? (
        <View style={styles.emptyWrap}>
          <EmptyState
            title="Sin canciones compartidas"
            message={
              profile?.partnerId
                ? 'Toca “Compartir” y pega un enlace de Spotify o YouTube.'
                : 'Primero vincula a tu pareja en Perfil, luego podrás compartir canciones.'
            }
          />
        </View>
      ) : (
        <FlatList
          data={songs}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <SongCard song={item} />}
          style={styles.list}
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    gap: 12,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
  },
  shareButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  shareButtonText: {
    color: '#fff',
    fontWeight: '800',
  },
  emptyWrap: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  list: { flex: 1 },
  listContent: { paddingBottom: 16 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#E5E5EA',
  },
  muted: {
    color: '#6B7280',
  },
});
