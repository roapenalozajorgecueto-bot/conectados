// services/firebase/config.ts
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth, getReactNativePersistence, initializeAuth } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { getFirebaseConfigFromEnv } from './env';

const firebaseConfig = getFirebaseConfigFromEnv();

// Evita inicializar dos veces (hot reload en desarrollo)
const app = getApps().length === 0
  ? initializeApp(firebaseConfig)
  : getApps()[0];

export const auth = (() => {
  try {
    // RN: Persistir sesión con AsyncStorage (evita warning y mantiene login entre reinicios).
    // Web: usar getAuth normal.
    if (Platform.OS === 'web') return getAuth(app);

    return initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
  } catch {
    // Hot reload / already initialized
    return getAuth(app);
  }
})();

export const db = getFirestore(app);
export default app;
