// services/firebase/config.web.ts
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

import { getFirebaseConfigFromEnv } from './env';

const firebaseConfig = getFirebaseConfigFromEnv();

// Evita inicializar dos veces (hot reload en desarrollo)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;
