import React, { useMemo, useState } from 'react';
import { FlatList, Pressable, RefreshControl, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import { useRequests } from '../hooks/useRequests';
import { RequestStatus } from '../types';
import { RequestCard } from '../components/RequestCard';
import { EmptyState } from '../components/ui';

type Filter = 'ALL' | RequestStatus;

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'ALL', label: 'Alles' },
  { key: 'PENDING', label: 'In afwachting' },
  { key: 'ACCEPTED', label: 'Geaccepteerd' },
  { key: 'COMPLETED', label: 'Voltooid' },
];

export function HistoryScreen() {
  const { theme } = useTheme();
  const c = theme.colors;
  const { requests, loading, refreshing, refresh } = useRequests();
  const [filter, setFilter] = useState<Filter>('ALL');

  const filtered = useMemo(
    () => (filter === 'ALL' ? requests : requests.filter((r) => r.status === filter)),
    [requests, filter],
  );

  const header = (
    <View style={{ marginBottom: theme.spacing(1) }}>
      <Text style={{ color: c.text, fontSize: 26, fontWeight: '800', marginBottom: theme.spacing(1.5) }}>
        Geschiedenis
      </Text>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        {FILTERS.map((f) => {
          const active = filter === f.key;
          return (
            <Pressable
              key={f.key}
              onPress={() => setFilter(f.key)}
              style={{
                paddingHorizontal: 14,
                paddingVertical: 8,
                borderRadius: theme.radius.pill,
                backgroundColor: active ? c.primary : c.surface,
                borderWidth: 1,
                borderColor: active ? c.primary : c.border,
              }}
            >
              <Text style={{ color: active ? c.primaryText : c.textMuted, fontWeight: '700', fontSize: 13 }}>
                {f.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.background }} edges={['top']}>
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <RequestCard request={item} />}
        ListHeaderComponent={header}
        contentContainerStyle={{ padding: theme.spacing(2) }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={c.primary} />
        }
        ListEmptyComponent={
          loading ? null : (
            <EmptyState icon="🗂️" title="Nog geen verzoeken" subtitle="Verzoeken verschijnen hier." />
          )
        }
      />
    </SafeAreaView>
  );
}
