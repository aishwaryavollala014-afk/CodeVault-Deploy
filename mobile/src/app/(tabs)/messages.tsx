import React from 'react';
import { View, StyleSheet, Pressable, Image } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { listConversations } from '../../api/endpoints';
import { errMsg } from '../../api/client';
import { Screen, Card, H1, Muted, Body, Loading, ErrorView, EmptyView } from '../../components/ui';
import { colors, space } from '../../lib/theme';

function asList(d: any): any[] {
  if (Array.isArray(d)) return d;
  return d?.items ?? d?.conversations ?? [];
}

export default function Messages() {
  const router = useRouter();
  const q = useQuery({ queryKey: ['conversations'], queryFn: listConversations });

  if (q.isLoading) return <Screen scroll={false}><Loading /></Screen>;
  if (q.isError) return <Screen scroll={false}><ErrorView message={errMsg(q.error)} onRetry={q.refetch} /></Screen>;

  const convos = asList(q.data);

  return (
    <Screen refreshing={q.isRefetching} onRefresh={q.refetch}>
      <H1>Inbox</H1>
      {convos.length === 0 ? (
        <EmptyView icon="💬" title="No conversations" hint="Follow people and start a chat from their profile." />
      ) : (
        convos.map((c: any, i: number) => {
          const handle = c.handle || c.user?.handle || c.otherUser?.handle;
          return (
            <Pressable key={i} onPress={() => handle && router.push(`/u/${handle}`)}>
              <Card style={s.row}>
                {c.avatarUrl || c.user?.avatarUrl ? (
                  <Image source={{ uri: c.avatarUrl || c.user?.avatarUrl }} style={s.avatar} />
                ) : (
                  <View style={[s.avatar, s.avatarFallback]} />
                )}
                <View style={{ flex: 1 }}>
                  <Body style={{ fontWeight: '700' }}>{c.displayName || c.user?.displayName || handle}</Body>
                  <Muted>{c.lastMessage || c.preview || `@${handle}`}</Muted>
                </View>
                {c.unread ? <View style={s.unread} /> : null}
              </Card>
            </Pressable>
          );
        })
      )}
    </Screen>
  );
}

const s = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: space(3) },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.cardAlt },
  avatarFallback: { borderWidth: 1, borderColor: colors.border },
  unread: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.brand },
});
