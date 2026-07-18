import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, KeyboardAvoidingView, Platform, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../auth/AuthContext';
import { Button, Muted } from '../../components/ui';
import { errMsg } from '../../api/client';
import { colors, radius, space } from '../../lib/theme';

export default function Login() {
  const { requestLogin } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function submit() {
    setError('');
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
      setError('Enter a valid email address.');
      return;
    }
    setLoading(true);
    try {
      await requestLogin(email.trim());
      router.push({ pathname: '/(auth)/verify', params: { email: email.trim() } });
    } catch (e) {
      setError(errMsg(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={s.wrap}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={s.brandRow}>
        <Image
          source={require('../../../assets/images/codevault-icon.png')}
          style={s.logo}
          resizeMode="contain"
        />
        <Text style={s.brand}>CodeVault</Text>
      </View>
      <Text style={s.title}>Sign in</Text>
      <Muted>
        Use the email linked to your account. We&apos;ll send a magic-link token.
      </Muted>

      <TextInput
        style={s.input}
        placeholder="you@example.com"
        placeholderTextColor={colors.faint}
        autoCapitalize="none"
        keyboardType="email-address"
        autoCorrect={false}
        value={email}
        onChangeText={setEmail}
        onSubmitEditing={submit}
      />
      {error ? <Text style={s.error}>{error}</Text> : null}
      <Button title="Send magic link" onPress={submit} loading={loading} />

      <View style={s.hint}>
        <Muted>
          Signed in on the web with GitHub? Use the same email — it resolves to the
          same account and your real analysis.
        </Muted>
      </View>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.bg, padding: space(6), justifyContent: 'center', gap: space(3) },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: space(2), marginBottom: space(2) },
  logo: { width: 40, height: 40 },
  brand: { fontSize: 24, fontWeight: '800', color: colors.ink },
  title: { fontSize: 30, fontWeight: '800', color: colors.ink },
  input: {
    height: 52,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: space(4),
    fontSize: 16,
    color: colors.ink,
    backgroundColor: colors.card,
    marginTop: space(2),
  },
  error: { color: colors.brand, fontSize: 13 },
  hint: { marginTop: space(4), padding: space(3), backgroundColor: colors.cardAlt, borderRadius: radius.md },
});
