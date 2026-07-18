import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { fetchRepos, fetchProblems } from '../../api/endpoints';
import { errMsg } from '../../api/client';
import { Screen, Card, H1, H2, Muted, Body, Pill, Loading, ErrorView, EmptyView } from '../../components/ui';
import { colors, platformColor, space } from '../../lib/theme';

function asList(d: any): any[] {
  if (Array.isArray(d)) return d;
  return d?.items ?? d?.repos ?? d?.problems ?? [];
}

export default function Repositories() {
  const repos = useQuery({ queryKey: ['repos'], queryFn: fetchRepos });
  const problems = useQuery({ queryKey: ['problems'], queryFn: fetchProblems });

  const loading = repos.isLoading || problems.isLoading;
  if (loading) return <Screen scroll={false}><Loading /></Screen>;
  if (repos.isError) return <Screen scroll={false}><ErrorView message={errMsg(repos.error)} onRetry={repos.refetch} /></Screen>;

  const repoList = asList(repos.data);
  const problemList = asList(problems.data);

  return (
    <Screen
      refreshing={repos.isRefetching || problems.isRefetching}
      onRefresh={() => { repos.refetch(); problems.refetch(); }}
    >
      <H1>Repositories</H1>

      {repoList.length === 0 && problemList.length === 0 ? (
        <EmptyView icon="🗂️" title="Nothing synced yet" hint="Trigger a sync to push your solutions to GitHub." />
      ) : (
        <>
          {repoList.map((r: any, i: number) => (
            <Card key={i}>
              <View style={s.repoHead}>
                <Body style={{ fontWeight: '700' }}>{r.repoFullName || r.name || r.platform}</Body>
                {r.platform ? <Pill text={r.platform} color={platformColor[r.platform] || colors.brand} /> : null}
              </View>
              <Muted>
                {(r.fileCount ?? r.files ?? 0)} files
                {r.visibility ? ` · ${r.visibility}` : ''}
                {r.defaultBranch ? ` · ${r.defaultBranch}` : ''}
              </Muted>
            </Card>
          ))}

          {problemList.length > 0 && (
            <Card>
              <H2>Synced problems ({problemList.length})</H2>
              <View style={{ marginTop: space(2), gap: space(2) }}>
                {problemList.slice(0, 30).map((p: any, i: number) => (
                  <View key={i} style={s.problemRow}>
                    <View style={{ flex: 1 }}>
                      <Body style={{ fontWeight: '600' }} >{p.title || p.number || p.slug}</Body>
                      <Muted>{p.language || ''}{p.difficulty ? ` · ${p.difficulty}` : ''}</Muted>
                    </View>
                    {p.platform ? <Pill text={p.platform} color={platformColor[p.platform] || colors.brand} /> : null}
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

const s = StyleSheet.create({
  repoHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  problemRow: { flexDirection: 'row', alignItems: 'center', gap: space(2) },
});
