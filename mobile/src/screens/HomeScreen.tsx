import React, { useMemo, useState } from 'react';
import { FlatList, Pressable, RefreshControl, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useRequests } from '../hooks/useRequests';
import { createRequest, getErrorMessage } from '../api/client';
import { notify } from '../utils/alert';
import { PRESETS, Preset } from '../constants/presets';
import { RequestType } from '../types';
import { RequestCard } from '../components/RequestCard';
import { Button, Card, EmptyState, TextField } from '../components/ui';

export function HomeScreen() {
  const { theme } = useTheme();
  const c = theme.colors;
  const { user } = useAuth();
  const { requests, loading, refreshing, refresh } = useRequests();

  const [sending, setSending] = useState<RequestType | null>(null);
  const [note, setNote] = useState('');
  const [customTitle, setCustomTitle] = useState('');

  // The customer's own active (not completed) requests.
  const active = useMemo(
    () => requests.filter((r) => r.customer?.id === user?.id && r.status !== 'COMPLETED'),
    [requests, user?.id],
  );

  const send = async (type: RequestType, title?: string) => {
    setSending(type);
    try {
      await createRequest({ type, title, note: note.trim() || undefined });
      setNote('');
      if (type === 'custom') setCustomTitle('');
      // Refresh right away so the request shows up even if realtime is slow.
      await refresh();
    } catch (err) {
      notify('Versturen mislukt', getErrorMessage(err));
    } finally {
      setSending(null);
    }
  };

  const header = (
    <View>
      <Text style={{ color: c.textMuted, fontSize: 15 }}>Hoi {user?.name} 👋</Text>
      <Text style={{ color: c.text, fontSize: 26, fontWeight: '800', marginBottom: theme.spacing(2) }}>
        Wat heb je nodig?
      </Text>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
        {PRESETS.map((preset: Preset) => (
          <Pressable
            key={preset.type}
            onPress={() => send(preset.type, preset.title)}
            disabled={sending !== null}
            style={({ pressed }) => ({
              width: '47%',
              backgroundColor: c.surface,
              borderColor: c.border,
              borderWidth: 1,
              borderRadius: theme.radius.lg,
              padding: theme.spacing(2),
              opacity: pressed ? 0.85 : sending && sending !== preset.type ? 0.5 : 1,
            })}
          >
            <Text style={{ fontSize: 30 }}>{preset.icon}</Text>
            <Text style={{ color: c.text, fontWeight: '700', marginTop: 8 }}>{preset.title}</Text>
          </Pressable>
        ))}
      </View>

      <Card style={{ marginTop: theme.spacing(2) }}>
        <Text style={{ color: c.text, fontWeight: '700', marginBottom: 10 }}>Eigen verzoek</Text>
        <TextField
          placeholder="Wat heb je nodig?"
          value={customTitle}
          onChangeText={setCustomTitle}
        />
        <TextField
          placeholder="Voeg een notitie toe (optioneel)"
          value={note}
          onChangeText={setNote}
          multiline
          style={{ minHeight: 60, textAlignVertical: 'top' }}
        />
        <Button
          title="Verzoek versturen"
          onPress={() => send('custom', customTitle.trim())}
          loading={sending === 'custom'}
          disabled={customTitle.trim().length === 0}
        />
      </Card>

      <Text
        style={{
          color: c.text,
          fontSize: 18,
          fontWeight: '800',
          marginTop: theme.spacing(3),
          marginBottom: theme.spacing(1),
        }}
      >
        Je actieve verzoeken
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.background }} edges={['top']}>
      <FlatList
        data={active}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <RequestCard request={item} />}
        ListHeaderComponent={header}
        contentContainerStyle={{ padding: theme.spacing(2) }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={c.primary} />
        }
        ListEmptyComponent={
          loading ? null : (
            <EmptyState
              icon="✅"
              title="Geen actieve verzoeken"
              subtitle="Tik op een kaart hierboven om iemand om hulp te vragen."
            />
          )
        }
      />
    </SafeAreaView>
  );
}
