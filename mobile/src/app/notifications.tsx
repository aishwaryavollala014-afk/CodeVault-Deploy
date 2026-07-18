import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchNotifications, markAllNotificationsRead } from '../api/endpoints';
import { errMsg } from '../api/client';
import { Screen, Card, Muted, Body, Button, Loading, ErrorView, EmptyView } from '../components/ui';
import { colors, space } from '../lib/theme';

function asList(d: any): any[] {
  if (Array.isArray(d)) return d;
  return d?.items ?? d?.notifications ?? [];
}

export default function Notifications() {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ['notifications'], queryFn: fetchNotifications });

  if (q.isLoading) return <Screen scroll={false}><Loading /></Screen>;
  if (q.isError) return <Screen scroll={false}><ErrorView message={errMsg(q.error)} onRetry={q.refetch} /></Screen>;

  const list = asList(q.data);

  return (
    <Screen refreshing={q.isRefetching} onRefresh={q.refetch}>
      {list.length > 0 && (
        <Button
          title="Mark all read"
          variant="ghost"
          onPress={async () => {
            try {
              await markAllNotificationsRead();
              qc.invalidateQueries({ queryKey: ['notifications'] });
            } catch { /* ignore */ }
          }}
        />
      )}
      {list.length === 0 ? (
        <EmptyView icon="🔔" title="All caught up" hint="You have no notifications." />
      ) : (
        list.map((n: any, i: number) => (
          <Card key={i} style={!n.read ? s.unreadCard : undefined}>
            <View style={{ flexDirection: 'row', gap: space(2) }}>
              {!n.read ? <View style={s.dot} /> : null}
              <View style={{ flex: 1 }}>
                <Body style={{ fontWeight: '700' }}>{n.title || n.type}</Body>
                {n.body ? <Muted>{n.body}</Muted> : null}
                <Muted>{n.createdAt ? new Date(n.createdAt).toLocaleString() : ''}</Muted>
              </View>
            </View>
          </Card>
        ))
      )}
    </Screen>
  );
}

const s = StyleSheet.create({
  unreadCard: { borderColor: colors.brand },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.brand, marginTop: 6 },
});
