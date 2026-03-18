import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { getSongMetadata } from '@/services/spotify.service';
import { sharesSong, updateCurrentSong } from '@/services/firebase/firestore.service';

export default function ShareSongScreen() {
  const router = useRouter();
  const { user, profile } = useAuth();
  const [songUrl, setSongUrl] = useState('');
  const [isSharing, setIsSharing] = useState(false);

  const handleShare = async () => {
    const cleanUrl = songUrl.trim();
    if (!cleanUrl) {
      Alert.alert('Error', 'Ingresa la URL de la canción');
      return;
    }

    if (!user) {
      Alert.alert('Error', 'Debes iniciar sesión para compartir.');
      return;
    }

    const partnerId = profile?.partnerId;
    if (typeof partnerId !== 'string' || partnerId.trim().length === 0) {
      Alert.alert('Sin pareja', 'Vincula a tu pareja antes de compartir canciones.');
      return;
    }

    setIsSharing(true);
    try {
      const meta = await getSongMetadata(cleanUrl);
      if (!meta) {
        Alert.alert('Error', 'URL no soportada. Usa Spotify o YouTube.');
        return;
      }

      console.info('Sharing song', { platform: meta.platform, title: meta.title }, 'share-song');
      await sharesSong(
        {
          title: meta.title,
          artist: meta.artist,
          thumbnail: meta.coverUrl,
          url: cleanUrl,
          platform: meta.platform,
        },
        user.uid,
        [user.uid, partnerId],
        { partnerId },
      );

      try {
        await updateCurrentSong(user.uid, {
          title: meta.title,
          artist: meta.artist,
          coverUrl: meta.coverUrl ?? '',
          link: cleanUrl,
        });
      } catch (err) {
        console.warn('updateCurrentSong failed (non-fatal)', err);
      }

      Alert.alert('Éxito', 'Canción compartida con tu pareja');
      router.back();
    } catch (err: any) {
      console.error('share-song error', err);
      const code = String(err?.code ?? '');
      if (code.includes('permission-denied')) {
        Alert.alert('Permisos', 'Firestore bloqueó la acción (permission-denied). Revisa tus reglas.');
      } else if (code.includes('failed-precondition')) {
        Alert.alert('Índice', 'Falta un índice en Firestore. Abre /debug para ver el link de creación.');
      } else {
        Alert.alert('Error', err?.message ? String(err.message) : 'No se pudo compartir la canción');
      }
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Compartir Canción</Text>

      <Text style={styles.label}>URL de Spotify o YouTube</Text>
      <TextInput
        style={styles.input}
        placeholder="https://open.spotify.com/..."
        value={songUrl}
        onChangeText={setSongUrl}
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="url"
      />

      <TouchableOpacity
        style={[styles.button, isSharing && styles.buttonDisabled]}
        onPress={handleShare}
        disabled={isSharing}
      >
        <Text style={styles.buttonText}>{isSharing ? 'Compartiendo...' : 'Compartir'}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 15,
    marginBottom: 20,
    fontSize: 16,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
