import { TouchableOpacity, Text, StyleSheet, Alert, Platform } from 'react-native';
import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { sendNeedAlert } from '@/services/firebase/firestore.service';

export default function NeedButton() {
  const { user, profile } = useAuth();
  const [sending, setSending] = useState(false);

  const handlePress = async () => {
    if (sending) return;

    if (!user) {
      Alert.alert('Error', 'Debes iniciar sesión.');
      return;
    }

    const partnerId = profile?.partnerId;
    if (typeof partnerId !== 'string' || partnerId.trim().length === 0) {
      Alert.alert('Sin pareja', 'Vincula a tu pareja primero.');
      return;
    }

    Alert.alert('Te extraño 💕', '¿Enviar notificación a tu pareja?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Enviar',
        onPress: async () => {
          setSending(true);
          try {
            await sendNeedAlert(user.uid, partnerId, 'Te necesito 💕', {
              senderName: String(profile?.name ?? profile?.displayName ?? ''),
            });
            Alert.alert('Enviado', 'Tu pareja recibirá la notificación.');
          } catch (err) {
            console.error('NeedButton sendNeedAlert error', err);
            Alert.alert(
              'Error',
              'No se pudo enviar. Abre /debug para ver el detalle y revisa permisos de Firestore.'
            );
          } finally {
            setSending(false);
          }
        },
      },
    ]);
  };

  return (
    <TouchableOpacity
      style={[styles.button, sending && styles.buttonDisabled]}
      onPress={handlePress}
      disabled={sending}
    >
      <Text style={styles.text}>{sending ? 'Enviando...' : 'Te necesito 💕'}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#FF2D55',
    padding: 20,
    borderRadius: 30,
    alignItems: 'center',
    marginVertical: 20,
    ...(Platform.OS === 'web'
      ? { boxShadow: '0px 4px 8px rgba(255, 45, 85, 0.3)' }
      : {
          shadowColor: '#FF2D55',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
          elevation: 5,
        }),
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  text: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
});
