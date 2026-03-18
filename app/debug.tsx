import { useEffect, useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { clearDebugLogs, getDebugLogs } from '@/controllers/debug.controller';
import type { LogEntry } from '@/models/LogEntry';

const levelColor = (level: LogEntry['level']) => {
  switch (level) {
    case 'error':
      return '#FF3B30';
    case 'warn':
      return '#FF9500';
    case 'info':
      return '#007AFF';
    default:
      return '#8E8E93';
  }
};

export default function DebugScreen() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = async () => {
    setLoading(true);
    try {
      const next = await getDebugLogs();
      setLogs(next);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    reload();
  }, []);

  const header = useMemo(() => {
    return (
      <View style={styles.header}>
        <Text style={styles.title}>Debug logs</Text>
        <View style={styles.actions}>
          <Pressable style={styles.button} onPress={reload}>
            <Text style={styles.buttonText}>Recargar</Text>
          </Pressable>
          <Pressable
            style={[styles.button, styles.dangerButton]}
            onPress={async () => {
              await clearDebugLogs();
              await reload();
            }}>
            <Text style={styles.buttonText}>Borrar</Text>
          </Pressable>
        </View>
        <Text style={styles.subtitle}>
          {loading ? 'Cargando…' : `${logs.length} eventos (más reciente arriba)`}
        </Text>
      </View>
    );
  }, [loading, logs.length]);

  return (
    <View style={styles.container}>
      <FlatList
        ListHeaderComponent={header}
        data={logs}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <View style={[styles.badge, { backgroundColor: levelColor(item.level) }]} />
            <View style={styles.rowBody}>
              <Text style={styles.rowTitle}>
                {new Date(item.timestamp).toLocaleString()} · {item.level}
                {item.tag ? ` · ${item.tag}` : ''}
              </Text>
              <Text style={styles.rowMessage}>{item.message}</Text>
              {item.details ? <Text style={styles.rowDetails}>{item.details}</Text> : null}
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  list: { padding: 16, paddingBottom: 32 },
  header: { marginBottom: 12 },
  title: { fontSize: 22, fontWeight: '700' },
  subtitle: { marginTop: 6, color: '#666' },
  actions: { flexDirection: 'row', gap: 10, marginTop: 10 },
  button: {
    backgroundColor: '#007AFF',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  dangerButton: { backgroundColor: '#FF3B30' },
  buttonText: { color: '#fff', fontWeight: '600' },
  row: {
    flexDirection: 'row',
    gap: 10,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#eee',
  },
  badge: { width: 8, borderRadius: 8 },
  rowBody: { flex: 1 },
  rowTitle: { fontSize: 12, color: '#666' },
  rowMessage: { marginTop: 2, fontSize: 14, color: '#111' },
  rowDetails: { marginTop: 6, fontSize: 12, color: '#333' },
});

