// services/firebase/auth.service.ts
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  User,
} from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from './config';
import { generatePairingCode } from '@/utils/pairingCode';

// ── REGISTRO ──────────────────────────────────────────────────────
// Crea la cuenta en Auth Y el documento en Firestore al mismo tiempo
export async function register(name: string, email: string, password: string) {
  // 1. Crear cuenta en Firebase Auth
  const credential = await createUserWithEmailAndPassword(auth, email, password);
  const uid = credential.user.uid; // Este es el ID que usamos en Firestore

  // 1.1 Guardar nombre para usarlo en la app (displayName en Auth)
  try {
    await updateProfile(credential.user, { displayName: name });
  } catch {
    // ignore (no bloquea registro)
  }

  // 2. Generar código de vinculación único
  const pairingCode = generatePairingCode(6);

  // 3. Crear el documento en users/{uid}
  // Nota: usamos el mismo UID de Auth como ID del documento
  await setDoc(doc(db, 'users', uid), {
    name,
    email,
    partnerId: '',          // vacío hasta que se vincule con alguien
    fcmToken: '',           // se llena cuando se registren las notificaciones
    pairingCode,
    photoURL: '',
    lastSeen: serverTimestamp(),
    currentSong: null,
    createdAt: serverTimestamp(),
  });

  return credential.user;
}

// ── LOGIN ──────────────────────────────────────────────────────────
export async function login(email: string, password: string) {
  const credential = await signInWithEmailAndPassword(auth, email, password);
  return credential.user;
}

// ── LOGOUT ────────────────────────────────────────────────────────
export async function logout() {
  await signOut(auth);
}

// ── OBSERVER ─────────────────────────────────────────────────────
// Escucha cambios en el estado de autenticación
// Se llama automáticamente cuando el usuario inicia o cierra sesión
export function onAuthChange(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback);
}
