type FirebaseEnvConfig = {
  apiKey: string;
  authDomain?: string;
  projectId: string;
  storageBucket?: string;
  messagingSenderId?: string;
  appId: string;
};

const required = (name: string) => {
  const value = process.env[name];
  if (typeof value !== 'string' || value.trim().length === 0) return null;
  return value.trim();
};

export function getFirebaseConfigFromEnv(): FirebaseEnvConfig {
  const apiKey = required('EXPO_PUBLIC_FIREBASE_API_KEY');
  const projectId = required('EXPO_PUBLIC_FIREBASE_PROJECT_ID');
  const appId = required('EXPO_PUBLIC_FIREBASE_APP_ID');

  const missing = [
    !apiKey ? 'EXPO_PUBLIC_FIREBASE_API_KEY' : null,
    !projectId ? 'EXPO_PUBLIC_FIREBASE_PROJECT_ID' : null,
    !appId ? 'EXPO_PUBLIC_FIREBASE_APP_ID' : null,
  ].filter(Boolean) as string[];

  if (missing.length > 0) {
    throw new Error(
      `Firebase config missing env vars: ${missing.join(', ')}. ` +
        `Create a .env file in the project root and restart Expo (npx expo start -c).`,
    );
  }

  return {
    apiKey: apiKey!,
    authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: projectId!,
    storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: appId!,
  };
}

