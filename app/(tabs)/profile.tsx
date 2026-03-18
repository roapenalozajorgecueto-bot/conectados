import { useMemo, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import Avatar from '@/components/ui/Avatar';
import { useAuth } from '@/hooks/useAuth';
import { usePartner } from '@/hooks/usePartner';
import { linkWithPartner } from '@/services/firebase/firestore.service';

export default function ProfileScreen() {
  const { user, profile, logout, loading } = useAuth();
  const { partner, isConnected } = usePartner(profile?.partnerId ?? null);
  const router = useRouter();
  const [partnerCode, setPartnerCode] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const myPairingCode = useMemo(() => {
    const code = profile?.pairingCode;
    return typeof code === 'string' ? code : '';
  }, [profile?.pairingCode]);

  const handleLinkPartner = async () => {
    const cleanCode = partnerCode.trim().toUpperCase();
    if (!cleanCode) {
      Alert.alert('Falta el código', 'Ingresa el código de tu pareja.');
      return;
    }
    if (!user) {
      Alert.alert('Error', 'Debes iniciar sesión para vincular.');
      return;
    }

    setSubmitting(true);
    try {
      await linkWithPartner(user.uid, cleanCode);
      setPartnerCode('');
      Alert.alert('Listo', '¡Pareja vinculada!');
    } catch (err) {
      const msg =
        typeof err === 'object' && err !== null && 'message' in err
          ? String((err as any).message)
          : 'No se pudo vincular.';
      Alert.alert('Error', msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      router.replace('/(auth)/login');
    } catch {
      Alert.alert('Error', 'No se pudo cerrar sesión');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Perfil</Text>

      <View style={styles.card}>
        <View style={styles.profileRow}>
          <Avatar uri={user?.photoURL} size={76} />
          <View style={styles.profileInfo}>
            <Text style={styles.userName}>{user?.displayName || 'Usuario'}</Text>
            <Text style={styles.userEmail}>{user?.email || ''}</Text>
          </View>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Mi código</Text>
        <Text style={styles.monoCode}>{myPairingCode || (loading ? 'Cargando...' : '—')}</Text>
        <Text style={styles.helpText}>Compártelo con tu pareja para que te pueda vincular.</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Pareja</Text>

        {isConnected ? (
          <View style={styles.partnerRow}>
            <Text style={styles.partnerText}>
              Conectado{partner?.name ? ` con ${partner.name}` : ''}.
            </Text>
          </View>
        ) : (
          <>
            <Text style={styles.helpText}>Ingresa el código de tu pareja para vincular.</Text>
            <TextInput
              style={styles.input}
              placeholder="CÓDIGO (ej: ABC123)"
              value={partnerCode}
              onChangeText={setPartnerCode}
              autoCapitalize="characters"
              autoCorrect={false}
              maxLength={12}
            />
            <TouchableOpacity
              style={[styles.primaryButton, submitting && styles.buttonDisabled]}
              onPress={handleLinkPartner}
              disabled={submitting}
            >
              <Text style={styles.primaryButtonText}>
                {submitting ? 'Vinculando...' : 'Vincular'}
              </Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>Cerrar sesión</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
    padding: 16,
    gap: 12,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    marginTop: 4,
    marginBottom: 4,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#E5E5EA',
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  profileInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 20,
    fontWeight: '800',
  },
  userEmail: {
    marginTop: 2,
    color: '#6B7280',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 8,
  },
  monoCode: {
    fontSize: 20,
    letterSpacing: 2,
    fontWeight: '900',
  },
  helpText: {
    marginTop: 8,
    color: '#6B7280',
  },
  input: {
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  primaryButton: {
    marginTop: 12,
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  partnerRow: {
    paddingVertical: 4,
  },
  partnerText: {
    fontSize: 16,
    fontWeight: '700',
  },
  logoutButton: {
    marginTop: 6,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#E5E5EA',
  },
  logoutText: {
    color: '#FF3B30',
    fontSize: 16,
    fontWeight: '800',
  },
});
