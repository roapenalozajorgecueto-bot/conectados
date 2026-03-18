import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';

export default function SettingsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Ajustes</Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Notificaciones</Text>
        <Text style={styles.cardText}>Próximamente: activar/desactivar y configurar horarios.</Text>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => Alert.alert('Pendiente', 'Aún no está implementado.')}
        >
          <Text style={styles.primaryButtonText}>Configurar</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Privacidad</Text>
        <Text style={styles.cardText}>Próximamente: control de datos y permisos.</Text>
      </View>
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
    gap: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  cardText: {
    color: '#6B7280',
  },
  primaryButton: {
    marginTop: 6,
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
