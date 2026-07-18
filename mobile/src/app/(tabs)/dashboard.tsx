import React from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Image } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { fetchStats } from '../../api/endpoints';
import { errMsg } from '../../api/client';
import { normalizeStats, diffColors } from '../../lib/stats';
import { useAuth } from '../../auth/AuthContext';
import {
  Screen, Card, H1, H2, Muted, Body, StatCard, Loading, ErrorView, EmptyView, Pill,
} from '../../components/ui';
import { Donut, Heatmap, BarList } from '../../components/charts';
import { colors, platformColor, space } from '../../lib/theme';

export default function Dashboard() {
  const { user } = useAuth();
  const router = useRouter();
  const q = useQuery({ queryKey: ['stats'], queryFn: fetchStats });

  if (q.isLoading) return <Screen scroll={false}><Loading label="Fetching your analysis…" /></Screen>;
  if (q.isError)
    return <Screen scroll={false}><ErrorView message={errMsg(q.error)} onRetry={q.refetch} /></Screen>;

  const vm = normalizeStats(q.data);
  const diff = vm.byDifficulty;
  const diffTotal = diff.easy + diff.medium + diff.hard;

  return (
    <Screen refreshing={q.isRefetching} onRefresh={q.refetch}>
      <View style={s.brandRow}>
        <Image
          source={require('../../../assets/images/codevault-icon.png')}
          style={s.brandLogo}
          resizeMode="contain"
        />
        <Text style={s.brandName}>CodeVault</Text>
      </View>
      <View>
        <Muted>Welcome back</Muted>
        <H1>{user?.displayName || user?.githubLogin || user?.handle}</H1>
      </View>

      {vm.connected.length === 0 ? (
        <Card>
          <EmptyView
            icon="🔌"
            title="No platforms connected"
            hint="Connect LeetCode, Codeforces, CodeChef or HackerRank to see your stats."
          />
          <Pressable style={s.cta} onPress={() => router.push('/connect')}>
            <Text style={s.ctaText}>Connect a platform</Text>
          </Pressable>
        </Card>
      ) : (
        <>
          <View style={s.row}>
            <StatCard label="Total solved" value={vm.totalSolved} accent={colors.brand} />
            <StatCard label="Platforms" value={vm.connected.length} />
          </View>

          {diffTotal > 0 && (
            <Card>
              <H2>Difficulty</H2>
              <View style={s.diffRow}>
                <Donut
                  segments={[
                    { value: diff.easy, color: diffColors.easy },
                    { value: diff.medium, color: diffColors.medium },
                    { value: diff.hard, color: diffColors.hard },
                  ]}
                  centerLabel={String(diffTotal)}
                  centerSub="solved"
                />
                <View style={{ gap: space(2), flex: 1 }}>
                  <Legend color={diffColors.easy} label="Easy" value={diff.easy} />
                  <Legend color={diffColors.medium} label="Medium" value={diff.medium} />
                  <Legend color={diffColors.hard} label="Hard" value={diff.hard} />
                </View>
              </View>
            </Card>
          )}

          <Card>
            <H2>By platform</H2>
            <View style={{ marginTop: space(2) }}>
              <BarList data={vm.perPlatform.map((p) => ({ ...p }))} />
            </View>
          </Card>

          {vm.heatmap.length > 0 && (
            <Card>
              <H2>Activity</H2>
              <Muted>Last 12 months</Muted>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={{ marginTop: space(3) }}
              >
                <Heatmap days={vm.heatmap} />
              </ScrollView>
            </Card>
          )}

          {vm.recent.length > 0 && (
            <Card>
              <H2>Recent solves</H2>
              <View style={{ marginTop: space(2), gap: space(2) }}>
                {vm.recent.slice(0, 6).map((r, i) => (
                  <View key={i} style={s.recentRow}>
                    <View style={{ flex: 1 }}>
                      <Body style={{ fontWeight: '600' }}>{r.title}</Body>
                      <Muted>{r.when}</Muted>
                    </View>
                    <Pill text={r.platform} color={platformColor[r.platform] || colors.brand} />
                  </View>
                ))}
              </View>
            </Card>
          )}
        </>
      )}
    </Screen>
  );
}

function Legend({ color, label, value }: { color: string; label: string; value: number }) {
  return (
    <View style={s.legend}>
      <View style={[s.dot, { backgroundColor: color }]} />
      <Text style={s.legendLabel}>{label}</Text>
      <Text style={s.legendValue}>{value}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: space(2) },
  brandLogo: { width: 28, height: 28 },
  brandName: { fontSize: 18, fontWeight: '800', color: colors.ink },
  row: { flexDirection: 'row', gap: space(3) },
  diffRow: { flexDirection: 'row', alignItems: 'center', gap: space(4), marginTop: space(3) },
  legend: { flexDirection: 'row', alignItems: 'center', gap: space(2) },
  dot: { width: 12, height: 12, borderRadius: 6 },
  legendLabel: { flex: 1, color: colors.ink, fontSize: 14 },
  legendValue: { fontWeight: '700', color: colors.ink },
  recentRow: { flexDirection: 'row', alignItems: 'center', gap: space(2) },
  cta: { marginTop: space(3), backgroundColor: colors.brand, padding: space(3), borderRadius: 12, alignItems: 'center' },
  ctaText: { color: '#fff', fontWeight: '700' },
});
