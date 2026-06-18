import React, { useMemo, useState } from 'react';
import { Alert, FlatList, RefreshControl, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import { useRequests } from '../hooks/useRequests';
import {
  acceptRequest,
  completeRequest,
  getErrorMessage,
  replyToRequest,
} from '../api/client';
import { FamilyRequest } from '../types';
import { RequestCard } from '../components/RequestCard';
import { ReplyModal } from '../components/ReplyModal';
import { EmptyState } from '../components/ui';

type ModalKind = 'complete' | 'reply';

export function ServeScreen() {
  const { theme } = useTheme();
  const c = theme.colors;
  const { requests, loading, refreshing, refresh } = useRequests();

  const [busyId, setBusyId] = useState<string | null>(null);
  const [modal, setModal] = useState<{ kind: ModalKind; request: FamilyRequest } | null>(null);
  const [modalLoading, setModalLoading] = useState(false);

  // Requests that still need attention (pending or accepted), oldest first
  // so the longest-waiting request is on top.
  const open = useMemo(
    () =>
      requests
        .filter((r) => r.status !== 'COMPLETED')
        .sort((a, b) => +new Date(a.createdAt) - +new Date(b.createdAt)),
    [requests],
  );

  const run = async (id: string, fn: () => Promise<unknown>) => {
    setBusyId(id);
    try {
      await fn();
    } catch (err) {
      Alert.alert('Action failed', getErrorMessage(err));
    } finally {
      setBusyId(null);
    }
  };

  const onAccept = (r: FamilyRequest) => run(r.id, () => acceptRequest(r.id));

  const submitModal = async (message: string) => {
    if (!modal) return;
    setModalLoading(true);
    try {
      if (modal.kind === 'complete') {
        await completeRequest(modal.request.id, message || undefined);
      } else {
        await replyToRequest(modal.request.id, message);
      }
      setModal(null);
    } catch (err) {
      Alert.alert('Action failed', getErrorMessage(err));
    } finally {
      setModalLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.background }} edges={['top']}>
      <View style={{ padding: theme.spacing(2), paddingBottom: 0 }}>
        <Text style={{ color: c.text, fontSize: 26, fontWeight: '800' }}>Incoming requests</Text>
        <Text style={{ color: c.textMuted, marginTop: 2 }}>
          {open.length === 0 ? 'All caught up' : `${open.length} waiting`}
        </Text>
      </View>

      <FlatList
        data={open}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <RequestCard
            request={item}
            busy={busyId === item.id}
            onAccept={onAccept}
            onComplete={(r) => setModal({ kind: 'complete', request: r })}
            onReply={(r) => setModal({ kind: 'reply', request: r })}
          />
        )}
        contentContainerStyle={{ padding: theme.spacing(2) }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={c.primary} />
        }
        ListEmptyComponent={
          loading ? null : (
            <EmptyState
              icon="🎉"
              title="Nothing to do"
              subtitle="New requests from your family will appear here instantly."
            />
          )
        }
      />

      <ReplyModal
        visible={modal !== null}
        title={modal?.kind === 'complete' ? 'Complete request' : 'Send a reply'}
        confirmLabel={modal?.kind === 'complete' ? 'Mark completed' : 'Send'}
        placeholder={
          modal?.kind === 'complete' ? 'Add a reply (optional)…' : 'Type a short message…'
        }
        optional={modal?.kind === 'complete'}
        loading={modalLoading}
        onCancel={() => setModal(null)}
        onSubmit={submitModal}
      />
    </SafeAreaView>
  );
}
