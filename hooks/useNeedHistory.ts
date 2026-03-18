import { useEffect, useState } from 'react';
import { subscribeToNeedHistory } from '../services/firebase/firestore.service';
import { useAuth } from './useAuth';

export function useNeedHistory(myUidArg?: string | null, maxItems = 20) {
  const { user } = useAuth();
  const myUid = myUidArg ?? user?.uid ?? null;

  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!myUid) {
      setAlerts([]);
      setLoading(false);
      return;
    }

    const unsub = subscribeToNeedHistory(myUid, (data) => {
      setAlerts(data);
      setLoading(false);
    }, maxItems);

    return unsub;
  }, [myUid, maxItems]);

  return { alerts, isLoading: loading };
}

