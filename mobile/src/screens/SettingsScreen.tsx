import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, Share, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useSocket } from '../context/SocketContext';
import { fetchFamily, getErrorMessage } from '../api/client';
import { accentFor } from '../theme/theme';
import { Family } from '../types';
import { Button, Card } from '../components/ui';
import { confirmAction, notify } from '../utils/alert';

export function SettingsScreen() {
  const { theme, preference, setPreference, accent, setAccent, accents } = useTheme();
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
    const message = `Doe mee met ons gezin in Familieverzoeken! Gebruik uitnodigingscode: ${family.inviteCode}`;
    try {
      // Share is not available on web — fall back to a copyable message.
      if (typeof (Share as { share?: unknown }).share === 'function') {
        await Share.share({ message });
      } else {
        notify('Uitnodigingscode', message);
      }
    } catch {
      notify('Uitnodigingscode', message);
    }
  };

  const confirmSignOut = () => {
    confirmAction({
      title: 'Uitloggen',
      message: 'Weet je zeker dat je wilt uitloggen?',
      confirmLabel: 'Uitloggen',
      cancelLabel: 'Annuleren',
      destructive: true,
      onConfirm: () => signOut(),
    });
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
        <Text style={{ color: c.text, fontSize: 26, fontWeight: '800' }}>Instellingen</Text>

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
              {user?.role === 'CUSTOMER' ? '🛎️ Klant' : '🏃 Helper'}
            </Text>
          </View>
        </Card>

        {sectionTitle('Gezin')}
        {error ? <Text style={{ color: c.danger }}>{error}</Text> : null}
        {family ? (
          <Card>
            <Text style={{ color: c.text, fontWeight: '700', fontSize: 16 }}>{family.name}</Text>
            <Text style={{ color: c.textMuted, marginTop: 8, fontSize: 13 }}>Uitnodigingscode</Text>
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
            <Button title="Uitnodiging delen" variant="secondary" onPress={shareInvite} />

            <Text style={{ color: c.textMuted, marginTop: theme.spacing(2), fontSize: 13 }}>
              Leden ({family.members.length})
            </Text>
            {family.members.map((m) => (
              <View
                key={m.id}
                style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 }}
              >
                <Text style={{ color: c.text }}>{m.name}</Text>
                <Text style={{ color: c.textMuted }}>
                  {m.role === 'CUSTOMER' ? '🛎️ Klant' : '🏃 Helper'}
                </Text>
              </View>
            ))}
          </Card>
        ) : null}

        {sectionTitle('Weergave')}
        <Card>
          <Text style={{ color: c.textMuted, fontSize: 13, marginBottom: 8 }}>Thema</Text>
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
                    {opt === 'system' ? 'Auto' : opt === 'light' ? 'Licht' : 'Donker'}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Text style={{ color: c.textMuted, fontSize: 13, marginTop: theme.spacing(2), marginBottom: 10 }}>
            Accentkleur
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 14 }}>
            {accents.map((a) => {
              const color = accentFor(a.key, theme.mode);
              const active = accent === a.key;
              return (
                <Pressable key={a.key} onPress={() => setAccent(a.key)} style={{ alignItems: 'center', width: 56 }}>
                  <View
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 22,
                      backgroundColor: color,
                      borderWidth: active ? 3 : 0,
                      borderColor: c.text,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {active ? <Text style={{ color: '#fff', fontWeight: '900', fontSize: 18 }}>✓</Text> : null}
                  </View>
                  <Text style={{ color: c.textMuted, fontSize: 11, marginTop: 4 }}>{a.label}</Text>
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
              {connected ? 'Verbonden — live updates aan' : 'Opnieuw verbinden…'}
            </Text>
          </View>
        </Card>

        <View style={{ marginTop: theme.spacing(3) }}>
          <Button title="Uitloggen" variant="danger" onPress={confirmSignOut} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
