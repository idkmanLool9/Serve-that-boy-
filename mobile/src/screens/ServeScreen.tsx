import React, { useMemo, useState } from 'react';
import { FlatList, RefreshControl, Text, View } from 'react-native';
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
import { notify } from '../utils/alert';

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
      await refresh();
    } catch (err) {
      notify('Actie mislukt', getErrorMessage(err));
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
      await refresh();
    } catch (err) {
      notify('Actie mislukt', getErrorMessage(err));
    } finally {
      setModalLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.background }} edges={['top']}>
      <View style={{ padding: theme.spacing(2), paddingBottom: 0 }}>
        <Text style={{ color: c.text, fontSize: 26, fontWeight: '800' }}>Binnenkomende verzoeken</Text>
        <Text style={{ color: c.textMuted, marginTop: 2 }}>
          {open.length === 0 ? 'Helemaal bij' : `${open.length} wachtend`}
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
              title="Niets te doen"
              subtitle="Nieuwe verzoeken van je gezin verschijnen hier direct."
            />
          )
        }
      />

      <ReplyModal
        visible={modal !== null}
        title={modal?.kind === 'complete' ? 'Verzoek voltooien' : 'Antwoord sturen'}
        confirmLabel={modal?.kind === 'complete' ? 'Markeer als voltooid' : 'Versturen'}
        placeholder={
          modal?.kind === 'complete' ? 'Voeg een antwoord toe (optioneel)…' : 'Typ een kort bericht…'
        }
        optional={modal?.kind === 'complete'}
        loading={modalLoading}
        onCancel={() => setModal(null)}
        onSubmit={submitModal}
      />
    </SafeAreaView>
  );
}
