import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Link, Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import 'react-native-reanimated';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useColorScheme } from '@/components/useColorScheme';
import { getDebugLogs, installDebugging } from '@/controllers/debug.controller';
import type { LogEntry } from '@/models/LogEntry';

export function ErrorBoundary({
  error,
  retry,
}: {
  error: Error;
  retry: () => void;
}) {
  const [logs, setLogs] = useState<LogEntry[]>([]);

  useEffect(() => {
    getDebugLogs().then(setLogs).catch(() => {});
  }, []);

  return (
    <ScrollView contentContainerStyle={errorStyles.container}>
      <Text style={errorStyles.title}>Ocurrió un error</Text>
      <Text style={errorStyles.subtitle}>
        Si la consola no muestra nada, abre la pantalla de logs.
      </Text>

      <View style={errorStyles.card}>
        <Text style={errorStyles.cardTitle}>Mensaje</Text>
        <Text style={errorStyles.mono}>{error?.message || String(error)}</Text>
        {error?.stack ? (
          <>
            <Text style={[errorStyles.cardTitle, { marginTop: 12 }]}>Stack</Text>
            <Text style={errorStyles.mono}>{error.stack}</Text>
          </>
        ) : null}
      </View>

      <View style={errorStyles.actions}>
        <Pressable style={errorStyles.button} onPress={retry}>
          <Text style={errorStyles.buttonText}>Reintentar</Text>
        </Pressable>
        <Link href="/debug" asChild>
          <Pressable style={[errorStyles.button, errorStyles.secondaryButton]}>
            <Text style={[errorStyles.buttonText, errorStyles.secondaryButtonText]}>
              Ver logs
            </Text>
          </Pressable>
        </Link>
      </View>

      {logs.length > 0 ? (
        <View style={errorStyles.card}>
          <Text style={errorStyles.cardTitle}>Últimos logs</Text>
          {logs.slice(0, 12).map((l) => (
            <Text key={l.id} style={errorStyles.mono}>
              {new Date(l.timestamp).toLocaleTimeString()} [{l.level}]
              {l.tag ? ` ${l.tag}` : ''} — {l.message}
            </Text>
          ))}
        </View>
      ) : null}
    </ScrollView>
  );
}

export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  initialRouteName: '(tabs)',
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

// Install logging/error capture as early as possible (before React tree mounts).
installDebugging();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return <RootLayoutNav />;
}

function RootLayoutNav() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
      </Stack>
    </ThemeProvider>
  );
}

const errorStyles = StyleSheet.create({
  container: { padding: 16, gap: 12 },
  title: { fontSize: 22, fontWeight: '800' },
  subtitle: { color: '#444' },
  card: {
    backgroundColor: '#fff',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#ddd',
    borderRadius: 12,
    padding: 12,
    gap: 8,
  },
  cardTitle: { fontWeight: '700' },
  mono: { fontFamily: 'SpaceMono', fontSize: 12, color: '#111' },
  actions: { flexDirection: 'row', gap: 10 },
  button: {
    backgroundColor: '#007AFF',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  secondaryButton: { backgroundColor: '#F2F2F7' },
  buttonText: { color: '#fff', fontWeight: '700' },
  secondaryButtonText: { color: '#111' },
});
