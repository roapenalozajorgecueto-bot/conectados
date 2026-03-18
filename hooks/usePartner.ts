// hooks/usePartner.ts
import { useEffect, useState } from 'react';
import { subscribeToPartner } from '../services/firebase/firestore.service';
import { useAuth } from './useAuth';

export function usePartner(partnerIdArg?: string | null) {
  const { profile } = useAuth();
  const partnerId = partnerIdArg ?? profile?.partnerId ?? null;

  const [partner, setPartner]   = useState<any>(null);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    if (!partnerId) {
      setLoading(false);
      return;
    }

    // onSnapshot — se actualiza automáticamente cuando la pareja
    // cambia su canción o estado en tiempo real
    const unsub = subscribeToPartner(partnerId, (data) => {
      setPartner(data);
      setLoading(false);
    });

    return unsub; // detiene la escucha al desmontar el componente
  }, [partnerId]);

  return { partner, isConnected: Boolean(partnerId), loading };
}
