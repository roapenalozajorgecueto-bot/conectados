// services/firebase/firestore.service.ts
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  addDoc,
  deleteDoc,
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  getDocs,
  limit,
} from 'firebase/firestore';
import { db } from './config';

// ════════════════════════════════════════════════════════════════
//  USUARIOS
// ════════════════════════════════════════════════════════════════

// Obtener los datos de un usuario una sola vez
export async function getUser(uid: string) {
  const snap = await getDoc(doc(db, 'users', uid));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

// Escucha en tiempo real el perfil de un usuario
export function subscribeToUser(uid: string, callback: (data: any | null) => void) {
  return onSnapshot(
    doc(db, 'users', uid),
    (snap) => {
      callback(snap.exists() ? { id: snap.id, ...snap.data() } : null);
    },
    () => {
      callback(null);
    },
  );
}

// Actualizar el fcmToken cuando el dispositivo lo registra
export async function updateFcmToken(uid: string, token: string) {
  // Históricamente se usó `fcmToken`, pero nuestras Cloud Functions nuevas esperan `pushToken`.
  // Guardamos ambos para compatibilidad.
  await updateDoc(doc(db, 'users', uid), { fcmToken: token, pushToken: token });
}

// Actualizar la canción actual del usuario
export async function updateCurrentSong(uid: string, song: {
  title: string;
  artist: string;
  coverUrl: string;
  link: string;
} | null) {
  await updateDoc(doc(db, 'users', uid), {
    currentSong: song,
    lastSeen: serverTimestamp(),
  });
}

// ── VINCULACIÓN ───────────────────────────────────────────────────
// Buscar un usuario por su código de vinculación y conectarlos
export async function linkWithPartner(myUid: string, partnerCode: string) {
  // Buscar en Firestore el usuario que tenga ese código
  const mySnap = await getDoc(doc(db, 'users', myUid));
  if (!mySnap.exists()) {
    throw new Error('No se encontrÃ³ tu perfil. Cierra sesiÃ³n e inicia de nuevo.');
  }

  const myData = mySnap.data() as any;
  if (myData?.partnerId) {
    throw new Error('Ya estÃ¡s vinculado con alguien.');
  }

  const q = query(
    collection(db, 'users'),
    where('pairingCode', '==', partnerCode.toUpperCase()),
    limit(1)
  );
  const snap = await getDocs(q);

  if (snap.empty) {
    throw new Error('Código no encontrado. Verifica con tu pareja.');
  }

  const partnerDoc = snap.docs[0];
  const partnerId = partnerDoc.id;

  if (partnerId === myUid) {
    throw new Error('No puedes vincularte contigo mismo.');
  }

  if (partnerDoc.data().partnerId) {
    throw new Error('Este usuario ya está vinculado con alguien.');
  }

  // Actualizar mi documento siempre.
  // El documento de la otra persona puede fallar si las reglas solo permiten escribir el propio.
  await updateDoc(doc(db, 'users', myUid), { partnerId, linkedAt: serverTimestamp() });
  try {
    await updateDoc(doc(db, 'users', partnerId), { partnerId: myUid, linkedAt: serverTimestamp() });
  } catch {
    // ignore: el otro usuario se auto-vincula al abrir la app (ver useAuth)
  }

  return partnerDoc.data(); // retorna los datos de la pareja
}

// Si alguien ya se vinculÃ³ conmigo (tiene partnerId == myUid) pero yo no tengo partnerId,
// esto permite "cerrar" el vÃ­nculo actualizando SOLO mi documento (no requiere permisos sobre el otro).
export async function findIncomingPartnerId(myUid: string): Promise<string | null> {
  const q = query(collection(db, 'users'), where('partnerId', '==', myUid), limit(1));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  return snap.docs[0].id;
}

// ── ESCUCHA EN TIEMPO REAL del perfil de la pareja ────────────────
// onSnapshot devuelve una función "unsub" para detener la escucha
export function subscribeToPartner(
  partnerId: string,
  callback: (data: any) => void
) {
  return onSnapshot(
    doc(db, 'users', partnerId),
    (snap) => {
      if (snap.exists()) {
        callback({ id: snap.id, ...snap.data() });
      }
    },
    () => {
      // ignore; caller can decide how to surface this
    },
  );
}

// ════════════════════════════════════════════════════════════════
//  CANCIONES
// ════════════════════════════════════════════════════════════════

// Compartir una canción (crea un nuevo documento en la colección songs)
export async function sharesSong(
  songData: {
    title: string;
    artist: string;
    thumbnail?: string;
    url: string;
    platform: 'spotify' | 'youtube';
  },
  sharedBy: string,
  participants: string[],
  options?: { sendAlert?: boolean; partnerId?: string }
) {
  const receiverId =
    options?.partnerId ??
    participants.find((p) => typeof p === 'string' && p !== sharedBy) ??
    null;

  // addDoc genera el ID automáticamente — no necesitas pensarlo
  const docRef = await addDoc(collection(db, 'songs'), {
    ...songData,
    sharedBy,
    // Compatibilidad con reglas actuales (senderId/receiverId)
    senderId: sharedBy,
    receiverId,
    participants,
    sharedAt: serverTimestamp(),
    sendAlert: options?.sendAlert === true,
    partnerId: options?.partnerId ?? null,
  });
  return docRef.id; // retorna el ID generado si lo necesitas
}

// Escuchar el historial de canciones en tiempo real
// Se actualiza cada vez que alguien comparte una canción
export function subscribeToSongs(
  myUid: string,
  partnerId: string,
  callback: (songs: any[]) => void
) {
  // IMPORTANTE (Reglas): tu Firestore permite leer songs solo si:
  // resource.data.senderId == uid OR resource.data.receiverId == uid.
  // Un query por `participants` puede fallar con permission-denied si la consulta "toca"
  // documentos que no cumplen esas condiciones (por ejemplo canciones viejas sin senderId/receiverId).
  // Por eso aquí hacemos 2 queries explícitas (senderId y receiverId) y mezclamos resultados.

  const qSent = query(collection(db, 'songs'), where('senderId', '==', myUid));
  const qReceived = query(collection(db, 'songs'), where('receiverId', '==', myUid));

  const byId = new Map<string, any>();

  const toDateValue = (value: any) => {
    try {
      if (value && typeof value.toDate === 'function') return value.toDate();
    } catch {
      // ignore
    }
    return value;
  };

  const toMillis = (value: any) => {
    const dateValue = toDateValue(value);
    if (dateValue instanceof Date) return dateValue.getTime();
    if (typeof dateValue === 'number') return dateValue;
    return 0;
  };

  const emit = () => {
    const songs = Array.from(byId.values())
      .map((s) => ({
        ...s,
        sharedAt: toDateValue((s as any).sharedAt),
      }))
      .filter((s: any) => {
        // Mostrar solo canciones con mi pareja actual
        if (s?.senderId === myUid) return s?.receiverId === partnerId;
        if (s?.receiverId === myUid) return s?.senderId === partnerId;
        return Array.isArray(s?.participants) && s.participants.includes(partnerId);
      })
      .sort((a: any, b: any) => {
        return toMillis(b?.sharedAt) - toMillis(a?.sharedAt);
      });

    callback(songs);
  };

  const unsubSent = onSnapshot(
    qSent,
    (snap) => {
      // Reemplazar el subconjunto "enviadas por mí"
      // Para no llevar un índice extra, primero borramos las previas de senderId==myUid
      for (const [id, value] of byId.entries()) {
        if ((value as any)?.senderId === myUid) byId.delete(id);
      }
      for (const d of snap.docs) byId.set(d.id, { id: d.id, ...d.data() });
      emit();
    },
    (err) => {
      console.warn('subscribeToSongs(sent) error', err);
      // no limpies todo: puede seguir mostrando recibidas
      emit();
    },
  );

  const unsubReceived = onSnapshot(
    qReceived,
    (snap) => {
      for (const [id, value] of byId.entries()) {
        if ((value as any)?.receiverId === myUid) byId.delete(id);
      }
      for (const d of snap.docs) byId.set(d.id, { id: d.id, ...d.data() });
      emit();
    },
    (err) => {
      console.warn('subscribeToSongs(received) error', err);
      emit();
    },
  );

  return () => {
    unsubSent();
    unsubReceived();
  };
}

// ════════════════════════════════════════════════════════════════
//  ALERTAS
// ════════════════════════════════════════════════════════════════

// Enviar la alerta "te necesito"
export async function sendNeedAlert(
  senderId: string,
  receiverId: string,
  message?: string,
  options?: { senderName?: string }
) {
  await addDoc(collection(db, 'alerts'), {
    from: senderId,
    to: receiverId,
    senderId,
    receiverId,
    type: 'need',
    message: message || '¿Estás ahí?',
    participants: [senderId, receiverId],
    senderName: options?.senderName ?? null,
    read: false,
    createdAt: serverTimestamp(),
    timestamp: serverTimestamp(),
  });
}

// Escuchar alertas NO leídas dirigidas a mí
export function subscribeToAlerts(
  myUid: string,
  callback: (alerts: any[]) => void
) {
  const q = query(
    collection(db, 'alerts'),
    where('receiverId', '==', myUid)
  );

  return onSnapshot(
    q,
    (snap) => {
      const alerts = snap.docs
        .map((doc) => ({
          id: doc.id,
          ...doc.data(),
          timestamp: (doc.data() as any).timestamp?.toDate?.(),
        }))
        .filter((a: any) => a.read === false)
        .sort((a: any, b: any) => {
          const at = a?.timestamp instanceof Date ? a.timestamp.getTime() : 0;
          const bt = b?.timestamp instanceof Date ? b.timestamp.getTime() : 0;
          return bt - at;
        });
      callback(alerts);
    },
    () => {
      callback([]);
    },
  );
}

// Historial de alertas dirigidas a mí (leídas y no leídas)
export function subscribeToNeedHistory(
  myUid: string,
  callback: (alerts: any[]) => void,
  maxItems = 30
) {
  // Evita índices compuestos: no usamos orderBy/limit en Firestore; ordenamos en cliente.
  const q = query(collection(db, 'alerts'), where('receiverId', '==', myUid));

  return onSnapshot(
    q,
    (snap) => {
      const alerts = snap.docs
        .map((doc) => ({
          id: doc.id,
          ...doc.data(),
          timestamp: (doc.data() as any).timestamp?.toDate?.(),
        }))
        .filter((a: any) => a.type === 'need')
        .sort((a: any, b: any) => {
          const at = a?.timestamp instanceof Date ? a.timestamp.getTime() : 0;
          const bt = b?.timestamp instanceof Date ? b.timestamp.getTime() : 0;
          return bt - at;
        })
        .slice(0, maxItems);

      callback(alerts);
    },
    (err: any) => {
      console.warn('subscribeToNeedHistory error', err);
      callback([]);
    },
  );
}

// Marcar una alerta como leída
export async function markAlertRead(alertId: string) {
  await updateDoc(doc(db, 'alerts', alertId), { read: true });
}

export async function deleteAlert(alertId: string) {
  await deleteDoc(doc(db, 'alerts', alertId));
}

export async function deleteSong(songId: string) {
  await deleteDoc(doc(db, 'songs', songId));
}
