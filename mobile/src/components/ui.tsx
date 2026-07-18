import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Pressable,
  ScrollView,
  RefreshControl,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, radius, space } from '../lib/theme';

export function Screen({
  children,
  refreshing,
  onRefresh,
  scroll = true,
}: {
  children: React.ReactNode;
  refreshing?: boolean;
  onRefresh?: () => void;
  scroll?: boolean;
}) {
  return (
    <SafeAreaView style={s.screen} edges={['top']}>
      {scroll ? (
        <ScrollView
          contentContainerStyle={s.scrollBody}
          refreshControl={
            onRefresh ? (
              <RefreshControl
                refreshing={!!refreshing}
                onRefresh={onRefresh}
                tintColor={colors.brand}
              />
            ) : undefined
          }
        >
          {children}
        </ScrollView>
      ) : (
        <View style={s.scrollBody}>{children}</View>
      )}
    </SafeAreaView>
  );
}

export function Card({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: ViewStyle;
}) {
  return <View style={[s.card, style]}>{children}</View>;
}

export function H1({ children }: { children: React.ReactNode }) {
  return <Text style={s.h1}>{children}</Text>;
}
export function H2({ children }: { children: React.ReactNode }) {
  return <Text style={s.h2}>{children}</Text>;
}
export function Muted({ children, style }: { children: React.ReactNode; style?: TextStyle }) {
  return <Text style={[s.muted, style]}>{children}</Text>;
}
export function Body({ children, style }: { children: React.ReactNode; style?: TextStyle }) {
  return <Text style={[s.body, style]}>{children}</Text>;
}

export function StatCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: React.ReactNode;
  accent?: string;
}) {
  return (
    <Card style={s.stat}>
      <Text style={[s.statValue, accent ? { color: accent } : null]}>{value}</Text>
      <Text style={s.statLabel}>{label}</Text>
    </Card>
  );
}

export function Button({
  title,
  onPress,
  loading,
  disabled,
  variant = 'primary',
}: {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: 'primary' | 'ghost';
}) {
  const isPrimary = variant === 'primary';
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        s.btn,
        isPrimary ? s.btnPrimary : s.btnGhost,
        (disabled || loading) && { opacity: 0.5 },
        pressed && { opacity: 0.85 },
      ]}
    >
      {loading ? (
        <ActivityIndicator color={isPrimary ? '#fff' : colors.brand} />
      ) : (
        <Text style={[s.btnText, isPrimary ? { color: '#fff' } : { color: colors.brand }]}>
          {title}
        </Text>
      )}
    </Pressable>
  );
}

export function Pill({ text, color = colors.brand }: { text: string; color?: string }) {
  return (
    <View style={[s.pill, { backgroundColor: color + '22' }]}>
      <Text style={[s.pillText, { color }]}>{text}</Text>
    </View>
  );
}

export function Loading({ label }: { label?: string }) {
  return (
    <View style={s.center}>
      <ActivityIndicator color={colors.brand} size="large" />
      {label ? <Text style={s.muted}>{label}</Text> : null}
    </View>
  );
}

export function ErrorView({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <View style={s.center}>
      <Text style={s.errIcon}>⚠️</Text>
      <Text style={[s.body, { textAlign: 'center' }]}>{message}</Text>
      {onRetry ? (
        <View style={{ marginTop: space(3) }}>
          <Button title="Retry" onPress={onRetry} variant="ghost" />
        </View>
      ) : null}
    </View>
  );
}

export function EmptyView({ icon = '📭', title, hint }: { icon?: string; title: string; hint?: string }) {
  return (
    <View style={s.center}>
      <Text style={s.errIcon}>{icon}</Text>
      <Text style={s.h2}>{title}</Text>
      {hint ? <Text style={[s.muted, { textAlign: 'center' }]}>{hint}</Text> : null}
    </View>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  scrollBody: { padding: space(4), gap: space(3), paddingBottom: space(12) },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: space(4),
  },
  h1: { fontSize: 26, fontWeight: '800', color: colors.ink },
  h2: { fontSize: 18, fontWeight: '700', color: colors.ink },
  body: { fontSize: 15, color: colors.ink, lineHeight: 21 },
  muted: { fontSize: 13, color: colors.muted },
  stat: { flex: 1, alignItems: 'center', paddingVertical: space(4) },
  statValue: { fontSize: 26, fontWeight: '800', color: colors.ink },
  statLabel: { fontSize: 12, color: colors.muted, marginTop: 2 },
  btn: {
    height: 50,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: space(5),
  },
  btnPrimary: { backgroundColor: colors.brand },
  btnGhost: { borderWidth: 1, borderColor: colors.brand, backgroundColor: 'transparent' },
  btnText: { fontSize: 16, fontWeight: '700' },
  pill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, alignSelf: 'flex-start' },
  pillText: { fontSize: 12, fontWeight: '700' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: space(2), padding: space(6) },
  errIcon: { fontSize: 34 },
});
