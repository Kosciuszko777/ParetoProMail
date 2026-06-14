import { useState, useEffect, useCallback } from 'react';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import {
  loadDispatches,
  saveDispatches,
  upsertDispatch,
  type MailDispatch,
  type DispatchStatus,
} from '@/lib/newsletter';

/** Read + write the current user's mail dispatch list from localStorage. */
export function useMailDispatches() {
  const { user } = useCurrentUser();
  const pubkey = user?.pubkey ?? '';

  const [dispatches, setDispatches] = useState<MailDispatch[]>(() =>
    pubkey ? loadDispatches(pubkey) : []
  );

  // Re-read from storage whenever pubkey changes
  useEffect(() => {
    if (!pubkey) { setDispatches([]); return; }
    setDispatches(loadDispatches(pubkey));
  }, [pubkey]);

  const refresh = useCallback(() => {
    if (pubkey) setDispatches(loadDispatches(pubkey));
  }, [pubkey]);

  const addDispatch = useCallback(
    (dispatch: MailDispatch) => {
      if (!pubkey) return;
      upsertDispatch(pubkey, dispatch);
      setDispatches(loadDispatches(pubkey));
    },
    [pubkey]
  );

  const updateDispatch = useCallback(
    (id: string, patch: Partial<MailDispatch>) => {
      if (!pubkey) return;
      const all = loadDispatches(pubkey);
      const idx = all.findIndex((d) => d.id === id);
      if (idx < 0) return;
      all[idx] = { ...all[idx], ...patch };
      saveDispatches(pubkey, all);
      setDispatches([...all]);
    },
    [pubkey]
  );

  const cancelDispatch = useCallback(
    (id: string) => updateDispatch(id, { status: 'cancelled' }),
    [updateDispatch]
  );

  /** Pending = scheduled but scheduledAt is still in the future */
  const pendingDispatches = dispatches.filter(
    (d) => d.status === 'scheduled' && d.scheduledAt > Date.now() / 1000
  );

  /** Due = scheduled and scheduledAt has passed */
  const dueDispatches = dispatches.filter(
    (d) => d.status === 'scheduled' && d.scheduledAt <= Date.now() / 1000
  );

  return {
    dispatches,
    pendingDispatches,
    dueDispatches,
    addDispatch,
    updateDispatch,
    cancelDispatch,
    refresh,
  };
}

/** Persist a status update without needing the hook instance. */
export function patchDispatch(pubkey: string, id: string, patch: Partial<MailDispatch>) {
  const all = loadDispatches(pubkey);
  const idx = all.findIndex((d) => d.id === id);
  if (idx < 0) return;
  all[idx] = { ...all[idx], ...patch };
  saveDispatches(pubkey, all);
}

export type { MailDispatch, DispatchStatus };
