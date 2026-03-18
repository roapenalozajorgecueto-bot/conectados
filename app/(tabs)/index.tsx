import { View, Text, StyleSheet, TouchableOpacity, FlatList, Pressable, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { usePartner } from '@/hooks/usePartner';
import PartnerStatus from '@/components/ui/PartnerStatus';
import NeedButton from '@/components/ui/NeedButton';
import { useNeedHistory } from '@/hooks/useNeedHistory';
import { deleteAlert } from '@/services/firebase/firestore.service';

export default function HomeScreen() {
  const router = useRouter();
  const { partner, isConnected } = usePartner();
  const { alerts, isLoading: alertsLoading } = useNeedHistory(undefined, 20);

  const formatTime = (value: any) => {
    if (!value) return '';
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleString('es-CO', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short' });
  };

  if (!isConnected || !partner) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Conectados</Text>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Sin pareja vinculada</Text>
          <Text style={styles.cardText}>Vincula a tu pareja para comenzar.</Text>
          <TouchableOpacity style={styles.primaryButton} onPress={() => router.push('/(tabs)/profile')}>
            <Text style={styles.primaryButtonText}>Vincular ahora</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const handleDelete = (alertId: string) => {
    Alert.alert('Eliminar', '¿Eliminar este llamado?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteAlert(alertId);
          } catch (err) {
            console.error('deleteAlert error', err);
            Alert.alert('Error', 'No se pudo eliminar. Revisa permisos de Firestore.');
          }
        },
      },
    ]);
  };

  return (
    <FlatList
      style={styles.container}
      contentContainerStyle={styles.containerContent}
      data={alertsLoading ? [] : alerts}
      keyExtractor={(item) => item.id}
      ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
      ListHeaderComponent={
        <>
          <Text style={styles.title}>Conectados</Text>
          <View style={styles.card}>
            <PartnerStatus partner={partner} />
          </View>
          <NeedButton />
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Llamados</Text>
            {alertsLoading ? <Text style={styles.cardText}>Cargando...</Text> : null}
            {!alertsLoading && alerts.length === 0 ? (
              <Text style={styles.cardText}>Aun no tienes llamados.</Text>
            ) : null}
          </View>
        </>
      }
      renderItem={({ item }) => (
        <View style={styles.alertRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.alertTime}>{formatTime(item.timestamp)}</Text>
            <Text style={styles.alertMsg} numberOfLines={2}>
              {item?.senderName ? `De ${item.senderName}: ` : ''}
              {String(item?.message ?? '')}
            </Text>
          </View>
          <Pressable style={styles.deleteButton} onPress={() => handleDelete(String(item.id))} hitSlop={10}>
            <Ionicons name="trash-outline" size={18} color="#FF3B30" />
          </Pressable>
        </View>
      )}
      ListFooterComponent={<View style={{ height: 12 }} />}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
    padding: 16,
  },
  containerContent: {
    paddingBottom: 16,
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
    gap: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  cardText: {
    color: '#6B7280',
  },
  alertRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#E5E5EA',
  },
  alertTime: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '700',
  },
  alertMsg: {
    marginTop: 2,
    color: '#111',
  },
  deleteButton: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF5F5',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#FFD1D1',
  },
  primaryButton: {
    marginTop: 8,
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
});
