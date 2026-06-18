import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchRequests, getErrorMessage } from '../api/client';
import { useSocket } from '../context/SocketContext';
import { FamilyRequest } from '../types';

/**
 * Loads the family's requests and keeps them in sync in real time. Any change
 * to the family's requests (insert/update) triggers a lightweight refetch.
 */
export function useRequests() {
  const { subscribe } = useSocket();
  const [requests, setRequests] = useState<FamilyRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const loadingRef = useRef(false);

  const load = useCallback(async (isRefresh = false) => {
    if (loadingRef.current) return;
    loadingRef.current = true;
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
      loadingRef.current = false;
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Refetch whenever a realtime change arrives.
  useEffect(() => subscribe(() => load()), [subscribe, load]);

  return {
    requests,
    loading,
    refreshing,
    error,
    refresh: () => load(true),
    setRequests,
  };
}
