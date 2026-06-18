import { useCallback, useEffect, useState } from 'react';
import { fetchRequests, getErrorMessage } from '../api/client';
import { useSocket } from '../context/SocketContext';
import { FamilyRequest } from '../types';

/**
 * Loads the family's requests and keeps the list in sync in real time:
 * new requests are prepended, and updates replace the matching item.
 */
export function useRequests() {
  const { subscribe } = useSocket();
  const [requests, setRequests] = useState<FamilyRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    setError(null);
    try {
      const data = await fetchRequests();
      setRequests(data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Merge a single request from a socket event into local state.
  const upsert = useCallback((incoming: FamilyRequest, prepend: boolean) => {
    setRequests((prev) => {
      const idx = prev.findIndex((r) => r.id === incoming.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = incoming;
        return next;
      }
      return prepend ? [incoming, ...prev] : [...prev, incoming];
    });
  }, []);

  useEffect(() => {
    return subscribe((event, request) => {
      upsert(request, event === 'request:created');
    });
  }, [subscribe, upsert]);

  return {
    requests,
    loading,
    refreshing,
    error,
    refresh: () => load(true),
    setRequests,
  };
}
