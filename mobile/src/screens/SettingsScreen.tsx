import React, { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, Share, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useSocket } from '../context/SocketContext';
import { fetchFamily, getErrorMessage } from '../api/client';
import { Family } from '../types';
import { Button, Card } from '../components/ui';

export function SettingsScreen() {
  const { theme, preference, setPreference } = useTheme();
  const c = theme.colors;
  const { user, signOut } = useAuth();
  const { connected } = useSocket();

  const [family, setFamily] = useState<Family | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchFamily()
      .then(setFamily)
      .catch((err) => setError(getErrorMessage(err)));
  }, []);

  const shareInvite = async () => {
    if (!family) return;
    try {
      await Share.share({
        message: `Join our family on Family Requests! Use invite code: ${family.inviteCode}`,
      });
    } catch {
      // user cancelled — ignore
    }
  };

  const confirmSignOut = () => {
    Alert.alert('Log out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log out', style: 'destructive', onPress: () => signOut() },
    ]);
  };

  const sectionTitle = (t: string) => (
    <Text
      style={{
        color: c.textMuted,
        fontWeight: '700',
        fontSize: 13,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 8,
        marginTop: theme.spacing(2),
      }}
    >
      {t}
    </Text>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.background }} edges={['top']}>
      <ScrollView contentContainerStyle={{ padding: theme.spacing(2) }}>
        <Text style={{ color: c.text, fontSize: 26, fontWeight: '800' }}>Settings</Text>

        {sectionTitle('Account')}
        <Card>
          <Text style={{ color: c.text, fontWeight: '700', fontSize: 16 }}>{user?.name}</Text>
          <Text style={{ color: c.textMuted, marginTop: 2 }}>{user?.email}</Text>
          <View
            style={{
              alignSelf: 'flex-start',
              marginTop: 8,
              backgroundColor: `${c.primary}22`,
              paddingHorizontal: 10,
              paddingVertical: 4,
              borderRadius: theme.radius.pill,
            }}
          >
            <Text style={{ color: c.primary, fontWeight: '700', fontSize: 12 }}>
              {user?.role === 'CUSTOMER' ? '🛎️ Customer' : '🏃 Server'}
            </Text>
          </View>
        </Card>

        {sectionTitle('Family')}
        {error ? <Text style={{ color: c.danger }}>{error}</Text> : null}
        {family ? (
          <Card>
            <Text style={{ color: c.text, fontWeight: '700', fontSize: 16 }}>{family.name}</Text>
            <Text style={{ color: c.textMuted, marginTop: 8, fontSize: 13 }}>Invite code</Text>
            <Text
              style={{
                color: c.primary,
                fontSize: 30,
                fontWeight: '800',
                letterSpacing: 4,
                marginVertical: 4,
              }}
            >
              {family.inviteCode}
            </Text>
            <Button title="Share invite" variant="secondary" onPress={shareInvite} />

            <Text style={{ color: c.textMuted, marginTop: theme.spacing(2), fontSize: 13 }}>
              Members ({family.members.length})
            </Text>
            {family.members.map((m) => (
              <View
                key={m.id}
                style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 }}
              >
                <Text style={{ color: c.text }}>{m.name}</Text>
                <Text style={{ color: c.textMuted }}>
                  {m.role === 'CUSTOMER' ? '🛎️ Customer' : '🏃 Server'}
                </Text>
              </View>
            ))}
          </Card>
        ) : null}

        {sectionTitle('Appearance')}
        <Card>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {(['system', 'light', 'dark'] as const).map((opt) => {
              const active = preference === opt;
              return (
                <Pressable
                  key={opt}
                  onPress={() => setPreference(opt)}
                  style={{
                    flex: 1,
                    paddingVertical: 12,
                    borderRadius: theme.radius.md,
                    backgroundColor: active ? c.primary : c.surfaceAlt,
                    alignItems: 'center',
                  }}
                >
                  <Text style={{ color: active ? c.primaryText : c.text, fontWeight: '700' }}>
                    {opt === 'system' ? 'Auto' : opt === 'light' ? 'Light' : 'Dark'}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </Card>

        {sectionTitle('Status')}
        <Card>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View
              style={{
                width: 10,
                height: 10,
                borderRadius: 5,
                backgroundColor: connected ? c.success : c.textMuted,
                marginRight: 8,
              }}
            />
            <Text style={{ color: c.text }}>
              {connected ? 'Connected — live updates on' : 'Reconnecting…'}
            </Text>
          </View>
        </Card>

        <View style={{ marginTop: theme.spacing(3) }}>
          <Button title="Log out" variant="danger" onPress={confirmSignOut} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
