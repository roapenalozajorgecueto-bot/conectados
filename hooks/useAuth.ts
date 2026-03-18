// hooks/useAuth.ts
import { useEffect, useState } from 'react';
import { User } from 'firebase/auth';
import { logout as logoutService, onAuthChange } from '../services/firebase/auth.service';
import { findIncomingPartnerId, subscribeToUser } from '../services/firebase/firestore.service';
import { updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../services/firebase/config';
import { registerForPushNotifications } from '../services/firebase/messaging.service';

const ENABLE_PUSH =
  String(process.env.EXPO_PUBLIC_ENABLE_PUSH ?? '').toLowerCase() === 'true';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [autoLinkChecked, setAutoLinkChecked] = useState<string | null>(null);
  const [pushRegisteredForUid, setPushRegisteredForUid] = useState<string | null>(null);

  useEffect(() => {
    let unsubProfile: null | (() => void) = null;

    const unsubAuth = onAuthChange((firebaseUser) => {
      setUser(firebaseUser);

      unsubProfile?.();
      unsubProfile = null;

      if (!firebaseUser) {
        setProfile(null);
        setLoading(false);
        setPushRegisteredForUid(null);
        return;
      }

      setLoading(true);
      unsubProfile = subscribeToUser(firebaseUser.uid, (data) => {
        setProfile(data);
        setLoading(false);
      });
    });

    return () => {
      unsubProfile?.();
      unsubAuth();
    };
  }, []);

  useEffect(() => {
    if (!user || !profile) return;
    if (profile.partnerId) return;
    if (autoLinkChecked === user.uid) return;

    setAutoLinkChecked(user.uid);
    findIncomingPartnerId(user.uid)
      .then(async (incomingId) => {
        if (!incomingId) return;
        await updateDoc(doc(db, 'users', user.uid), {
          partnerId: incomingId,
          linkedAt: serverTimestamp(),
        });
      })
      .catch(() => {});
  }, [user, profile, autoLinkChecked]);

  useEffect(() => {
    if (!ENABLE_PUSH) return;
    if (!user) return;
    if (pushRegisteredForUid === user.uid) return;

    setPushRegisteredForUid(user.uid);
    registerForPushNotifications(user.uid).catch((err) => {
      console.warn('No se pudieron registrar notificaciones push', err);
    });
  }, [user, pushRegisteredForUid]);

  const logout = async () => {
    await logoutService();
  };

  return { user, profile, loading, logout };
}
