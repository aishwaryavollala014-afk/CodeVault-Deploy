import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth, extractToken } from '../../auth/AuthContext';
import { Button, Muted } from '../../components/ui';
import { errMsg } from '../../api/client';
import { colors, radius, space } from '../../lib/theme';

export default function Verify() {
  const { email } = useLocalSearchParams<{ email?: string }>();
  const { verify } = useAuth();
  const router = useRouter();
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function submit() {
    setError('');
    const t = extractToken(token);
    if (!t) {
      setError('Paste the token (or the full magic-link URL).');
      return;
    }
    setLoading(true);
    try {
      await verify(t);
      router.replace('/(tabs)/dashboard');
    } catch (e) {
      setError(errMsg(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={s.wrap}>
      <Text style={s.title}>Enter your token</Text>
      <Muted>
        Sent to {email || 'your email'}. Paste the token from the email — or the whole
        magic-link URL, we&apos;ll pull the token out.
      </Muted>

      <TextInput
        style={s.input}
        placeholder="token or https://…?token=…"
        placeholderTextColor={colors.faint}
        autoCapitalize="none"
        autoCorrect={false}
        multiline
        value={token}
        onChangeText={setToken}
      />
      {error ? <Text style={s.error}>{error}</Text> : null}
      <Button title="Verify & sign in" onPress={submit} loading={loading} />
      <View style={{ marginTop: space(2) }}>
        <Button title="Back" variant="ghost" onPress={() => router.back()} />
      </View>

      <View style={s.devNote}>
        <Text style={s.devTitle}>Dev tip</Text>
        <Muted>
          If SMTP isn&apos;t configured, the magic link is printed to the web-backend
          console. Copy the token from there.
        </Muted>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.bg, padding: space(6), justifyContent: 'center', gap: space(3) },
  title: { fontSize: 28, fontWeight: '800', color: colors.ink },
  input: {
    minHeight: 90,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: space(4),
    fontSize: 15,
    color: colors.ink,
    backgroundColor: colors.card,
    textAlignVertical: 'top',
  },
  error: { color: colors.brand, fontSize: 13 },
  devNote: { marginTop: space(5), padding: space(3), backgroundColor: colors.cardAlt, borderRadius: radius.md, gap: 4 },
  devTitle: { fontWeight: '700', color: colors.ink },
});
