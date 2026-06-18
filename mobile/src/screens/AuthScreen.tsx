import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { getErrorMessage } from '../api/client';
import { Role } from '../types';
import { Button, TextField } from '../components/ui';

type Mode = 'login' | 'signup';
type FamilyMode = 'create' | 'join';

export function AuthScreen() {
  const { theme } = useTheme();
  const c = theme.colors;
  const { signIn, register } = useAuth();

  const [mode, setMode] = useState<Mode>('login');
  const [familyMode, setFamilyMode] = useState<FamilyMode>('create');
  const [role, setRole] = useState<Role>('CUSTOMER');

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [familyName, setFamilyName] = useState('');
  const [inviteCode, setInviteCode] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const submit = async () => {
    setError(null);
    setInfo(null);
    setLoading(true);
    try {
      if (mode === 'login') {
        await signIn(email.trim(), password);
      } else {
        const { needsConfirmation } = await register({
          name: name.trim(),
          email: email.trim(),
          password,
          role,
          familyName: familyMode === 'create' ? familyName.trim() : undefined,
          inviteCode: familyMode === 'join' ? inviteCode.trim().toUpperCase() : undefined,
        });
        if (needsConfirmation) {
          // Nieuwe gebruikers worden automatisch bevestigd, dus direct inloggen werkt.
          try {
            await signIn(email.trim(), password);
          } catch {
            setMode('login');
            setPassword('');
            setInfo('Account aangemaakt! Log in om verder te gaan.');
          }
        }
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const Segment = ({
    label,
    active,
    onPress,
  }: {
    label: string;
    active: boolean;
    onPress: () => void;
  }) => (
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
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={{ padding: theme.spacing(3), flexGrow: 1, justifyContent: 'center' }}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={{ fontSize: 44, textAlign: 'center' }}>👨‍👩‍👧‍👦</Text>
          <Text
            style={{
              color: c.text,
              fontSize: 28,
              fontWeight: '800',
              textAlign: 'center',
              marginTop: 8,
            }}
          >
            Familieverzoeken
          </Text>
          <Text style={{ color: c.textMuted, textAlign: 'center', marginTop: 4, marginBottom: 24 }}>
            Snelle verzoeken voor je huisgenoten
          </Text>

          {/* Inloggen / Registreren */}
          <View
            style={{
              flexDirection: 'row',
              backgroundColor: c.surfaceAlt,
              borderRadius: theme.radius.md,
              padding: 4,
              marginBottom: 20,
            }}
          >
            <Segment label="Inloggen" active={mode === 'login'} onPress={() => setMode('login')} />
            <Segment label="Registreren" active={mode === 'signup'} onPress={() => setMode('signup')} />
          </View>

          {mode === 'signup' ? (
            <TextField label="Je naam" placeholder="bijv. Alex" value={name} onChangeText={setName} />
          ) : null}

          <TextField
            label="E-mail"
            placeholder="jij@voorbeeld.nl"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            autoCorrect={false}
          />
          <TextField
            label="Wachtwoord"
            placeholder="••••••••"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          {mode === 'signup' ? (
            <>
              <Text style={{ color: c.textMuted, marginBottom: 6, fontWeight: '600', fontSize: 13 }}>
                Ik ben de…
              </Text>
              <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
                <RoleChip
                  label="🛎️ Klant"
                  hint="Ik stuur verzoeken"
                  active={role === 'CUSTOMER'}
                  onPress={() => setRole('CUSTOMER')}
                />
                <RoleChip
                  label="🏃 Helper"
                  hint="Ik help mee"
                  active={role === 'SERVER'}
                  onPress={() => setRole('SERVER')}
                />
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
                <Segment
                  label="Gezin aanmaken"
                  active={familyMode === 'create'}
                  onPress={() => setFamilyMode('create')}
                />
                <Segment
                  label="Lid worden"
                  active={familyMode === 'join'}
                  onPress={() => setFamilyMode('join')}
                />
              </View>

              {familyMode === 'create' ? (
                <TextField
                  label="Gezinsnaam"
                  placeholder="De familie Jansen"
                  value={familyName}
                  onChangeText={setFamilyName}
                />
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
            </>
          ) : null}

          {error ? (
            <Text style={{ color: c.danger, marginBottom: 12, textAlign: 'center' }}>{error}</Text>
          ) : null}
          {info ? (
            <Text style={{ color: c.success, marginBottom: 12, textAlign: 'center' }}>{info}</Text>
          ) : null}

          <Button
            title={mode === 'login' ? 'Inloggen' : 'Account aanmaken'}
            onPress={submit}
            loading={loading}
          />
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
