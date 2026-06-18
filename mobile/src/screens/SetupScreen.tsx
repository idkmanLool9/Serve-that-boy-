import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { getErrorMessage } from '../api/client';
import { Role } from '../types';
import { Button, TextField } from '../components/ui';

type FamilyMode = 'create' | 'join';

/**
 * Shown when a user is signed in but has no profile yet (didn't finish family
 * setup at signup). Lets them create or join a family to complete onboarding.
 */
export function SetupScreen() {
  const { theme } = useTheme();
  const c = theme.colors;
  const { completeSetup, signOut } = useAuth();

  const [familyMode, setFamilyMode] = useState<FamilyMode>('create');
  const [role, setRole] = useState<Role>('CUSTOMER');
  const [name, setName] = useState('');
  const [familyName, setFamilyName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setError(null);
    setLoading(true);
    try {
      await completeSetup({
        name: name.trim(),
        role,
        familyName: familyMode === 'create' ? familyName.trim() : undefined,
        inviteCode: familyMode === 'join' ? inviteCode.trim().toUpperCase() : undefined,
      });
      // On success, AuthContext loads the profile and navigates automatically.
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const Segment = ({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) => (
    <Pressable
      onPress={onPress}
      style={{
        flex: 1,
        paddingVertical: 10,
        borderRadius: theme.radius.md,
        backgroundColor: active ? c.primary : 'transparent',
        alignItems: 'center',
      }}
    >
      <Text style={{ color: active ? c.primaryText : c.textMuted, fontWeight: '700' }}>{label}</Text>
    </Pressable>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.background }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={{ padding: theme.spacing(3), flexGrow: 1, justifyContent: 'center' }}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={{ fontSize: 40, textAlign: 'center' }}>🏡</Text>
          <Text style={{ color: c.text, fontSize: 26, fontWeight: '800', textAlign: 'center', marginTop: 8 }}>
            Maak het account af
          </Text>
          <Text style={{ color: c.textMuted, textAlign: 'center', marginTop: 4, marginBottom: 24 }}>
            Maak een gezin aan of word lid om te beginnen.
          </Text>

          <TextField label="Je naam" placeholder="bijv. Alex" value={name} onChangeText={setName} />

          <Text style={{ color: c.textMuted, marginBottom: 6, fontWeight: '600', fontSize: 13 }}>Ik ben de…</Text>
          <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
            <RoleChip label="🛎️ Klant" hint="Ik stuur verzoeken" active={role === 'CUSTOMER'} onPress={() => setRole('CUSTOMER')} />
            <RoleChip label="🏃 Helper" hint="Ik help mee" active={role === 'SERVER'} onPress={() => setRole('SERVER')} />
          </View>

          <View
            style={{
              flexDirection: 'row',
              backgroundColor: c.surfaceAlt,
              borderRadius: theme.radius.md,
              padding: 4,
              marginBottom: 16,
            }}
          >
            <Segment label="Gezin aanmaken" active={familyMode === 'create'} onPress={() => setFamilyMode('create')} />
            <Segment label="Lid worden" active={familyMode === 'join'} onPress={() => setFamilyMode('join')} />
          </View>

          {familyMode === 'create' ? (
            <TextField label="Gezinsnaam" placeholder="De familie Jansen" value={familyName} onChangeText={setFamilyName} />
          ) : (
            <TextField
              label="Uitnodigingscode"
              placeholder="ABC123"
              value={inviteCode}
              onChangeText={setInviteCode}
              autoCapitalize="characters"
              autoCorrect={false}
            />
          )}

          {error ? <Text style={{ color: c.danger, marginBottom: 12, textAlign: 'center' }}>{error}</Text> : null}

          <Button title="Doorgaan" onPress={submit} loading={loading} />
          <Button title="Uitloggen" variant="ghost" onPress={signOut} style={{ marginTop: 10 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function RoleChip({
  label,
  hint,
  active,
  onPress,
}: {
  label: string;
  hint: string;
  active: boolean;
  onPress: () => void;
}) {
  const { theme } = useTheme();
  const c = theme.colors;
  return (
    <Pressable
      onPress={onPress}
      style={{
        flex: 1,
        borderWidth: 2,
        borderColor: active ? c.primary : c.border,
        backgroundColor: active ? `${c.primary}15` : c.surface,
        borderRadius: theme.radius.md,
        padding: 12,
      }}
    >
      <Text style={{ color: c.text, fontWeight: '700' }}>{label}</Text>
      <Text style={{ color: c.textMuted, fontSize: 12, marginTop: 2 }}>{hint}</Text>
    </Pressable>
  );
}
