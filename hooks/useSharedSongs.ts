// hooks/useSharedSongs.ts
import { useEffect, useState } from 'react';
import { subscribeToSongs } from '../services/firebase/firestore.service';
import { useAuth } from './useAuth';

export function useSharedSongs(myUidArg?: string | null, partnerIdArg?: string | null) {
  const { user, profile } = useAuth();
  const myUid = myUidArg ?? user?.uid ?? null;
  const partnerId = partnerIdArg ?? profile?.partnerId ?? null;

  const [songs, setSongs]     = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!myUid || !partnerId) {
      setLoading(false);
      return;
    }

    const unsub = subscribeToSongs(myUid, partnerId, (data) => {
      setSongs(data);
      setLoading(false);
    });

    return unsub;
  }, [myUid, partnerId]);

  return { songs, isLoading: loading };
}
