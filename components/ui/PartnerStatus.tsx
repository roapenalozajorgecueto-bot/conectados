import { View, Text, StyleSheet } from 'react-native';
import Avatar from './Avatar';
import { User } from '@/types';

interface PartnerStatusProps {
  partner: User;
}

export default function PartnerStatus({ partner }: PartnerStatusProps) {
  return (
    <View style={styles.container}>
      <Avatar uri={partner.photoURL} size={80} />
      <View style={styles.info}>
        <Text style={styles.name}>{partner.displayName}</Text>
        {partner.currentSong && (
          <View style={styles.songInfo}>
            <Text style={styles.songLabel}>🎵 Escuchando:</Text>
            <Text style={styles.songTitle} numberOfLines={1}>
              {partner.currentSong.title}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  info: {
    flex: 1,
    marginLeft: 16,
  },
  name: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  songInfo: {
    marginTop: 8,
  },
  songLabel: {
    fontSize: 12,
    color: '#666',
  },
  songTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#007AFF',
    marginTop: 2,
  },
});
