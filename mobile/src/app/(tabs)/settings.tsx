import React from 'react';
import { View, StyleSheet, Pressable, Image, Switch, Alert } from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { listConnections, fetchSettings, updateSettings, removeConnection } from '../../api/endpoints';
import { errMsg } from '../../api/client';
import { useAuth } from '../../auth/AuthContext';
import { Screen, Card, H1, H2, Muted, Body, Pill, Button, Loading } from '../../components/ui';
import { colors, platformColor, space } from '../../lib/theme';

function asList(d: any): any[] {
  if (Array.isArray(d)) return d;
  return d?.items ?? d?.connections ?? [];
}

export default function Settings() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const qc = useQueryClient();
  const conns = useQuery({ queryKey: ['connections'], queryFn: listConnections });
  const settings = useQuery({ queryKey: ['settings'], queryFn: fetchSettings });

  const connList = asList(conns.data);
  const autoSync =
    settings.data?.settings?.sync?.autoSync ??
    settings.data?.sync?.autoSync ??
    settings.data?.autoSync;

  async function toggleAutoSync(v: boolean) {
    try {
      await updateSettings({ sync: { autoSync: v } });
      qc.invalidateQueries({ queryKey: ['settings'] });
    } catch (e) {
      Alert.alert('Could not update', errMsg(e));
    }
  }

  async function disconnect(platform: string) {
    Alert.alert('Disconnect', `Remove ${platform}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          try {
            await removeConnection(platform);
            qc.invalidateQueries({ queryKey: ['connections'] });
            qc.invalidateQueries({ queryKey: ['stats'] });
          } catch (e) {
            Alert.alert('Failed', errMsg(e));
          }
        },
      },
    ]);
  }

  return (
    <Screen refreshing={conns.isRefetching} onRefresh={() => { conns.refetch(); settings.refetch(); }}>
      <H1>Settings</H1>

      <Card style={s.profile}>
        {user?.avatarUrl ? (
          <Image source={{ uri: user.avatarUrl }} style={s.avatar} />
        ) : (
          <View style={[s.avatar, { borderWidth: 1, borderColor: colors.border }]} />
        )}
        <View style={{ flex: 1 }}>
          <Body style={{ fontWeight: '700' }}>{user?.displayName || user?.githubLogin}</Body>
          <Muted>@{user?.handle}</Muted>
          {user?.email ? <Muted>{user.email}</Muted> : null}
        </View>
      </Card>

      <Pressable onPress={() => user?.handle && router.push(`/u/${user.handle}`)}>
        <Card style={s.linkRow}>
          <Body>View public profile</Body>
          <Body style={{ color: colors.faint }}>›</Body>
        </Card>
      </Pressable>

      <Pressable onPress={() => router.push('/notifications')}>
        <Card style={s.linkRow}>
          <Body>Notifications</Body>
          <Body style={{ color: colors.faint }}>›</Body>
        </Card>
      </Pressable>

      <Card>
        <View style={s.linkRow}>
          <View style={{ flex: 1 }}>
            <Body style={{ fontWeight: '600' }}>Auto-sync to GitHub</Body>
            <Muted>Push accepted solutions automatically</Muted>
          </View>
          <Switch
            value={!!autoSync}
            onValueChange={toggleAutoSync}
            trackColor={{ true: colors.brand }}
          />
        </View>
      </Card>

      <Card>
        <View style={s.head}>
          <H2>Connections</H2>
          <Button title="+ Add" variant="ghost" onPress={() => router.push('/connect')} />
        </View>
        {conns.isLoading ? (
          <Loading />
        ) : connList.length === 0 ? (
          <Muted>No platforms connected yet.</Muted>
        ) : (
          <View style={{ marginTop: space(2), gap: space(2) }}>
            {connList.map((c: any, i: number) => (
              <View key={i} style={s.connRow}>
                <Pill text={c.platform} color={platformColor[c.platform] || colors.brand} />
                <Body style={{ flex: 1 }}>{c.username}</Body>
                <Pressable onPress={() => disconnect(c.platform)}>
                  <Body style={{ color: colors.brand }}>Remove</Body>
                </Pressable>
              </View>
            ))}
          </View>
        )}
      </Card>

      <View style={{ marginTop: space(2) }}>
        <Button title="Sign out" variant="ghost" onPress={() => {
          Alert.alert('Sign out', 'Are you sure?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Sign out', style: 'destructive', onPress: () => { signOut(); router.replace('/(auth)/login'); } },
          ]);
        }} />
      </View>
    </Screen>
  );
}

const s = StyleSheet.create({
  profile: { flexDirection: 'row', alignItems: 'center', gap: space(3) },
  avatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: colors.cardAlt },
  linkRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  connRow: { flexDirection: 'row', alignItems: 'center', gap: space(3) },
});
