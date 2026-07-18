import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import { Screen, Card, H1, Muted, Body, Pill } from '../../../components/ui';
import { platformColor, colors, space } from '../../../lib/theme';
import { View } from 'react-native';

export default function ProblemDetail() {
  const { platform, number, title } = useLocalSearchParams<{
    platform: string;
    number: string;
    title?: string;
  }>();

  return (
    <Screen>
      <Pill text={String(platform)} color={platformColor[String(platform)] || colors.brand} />
      <H1>{title || `Problem ${number}`}</H1>
      <Card>
        <View style={{ gap: space(2) }}>
          <Body style={{ fontWeight: '600' }}>#{number}</Body>
          <Muted>
            Full question + solution rendering pulls from the git-service problem
            store; the list view links here. (Detail endpoint wiring lands in the next
            phase.)
          </Muted>
        </View>
      </Card>
    </Screen>
  );
}
