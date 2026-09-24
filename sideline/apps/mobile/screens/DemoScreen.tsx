import React, {useCallback} from 'react';
import {ScrollView, Text, TouchableOpacity, View} from 'react-native';
import {useFocusEffect, useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import type {BottomTabNavigationProp} from '@react-navigation/bottom-tabs';
import {contextLabel, type ContextSeed} from '@sideline/context';
import {useAppContext} from '../state/context';
import {colors, styles} from '../ui/theme';
import type {ContentStackParamList, RootTabs} from '../App';

export type DemoMode = 'search' | 'article' | 'player' | 'prop' | 'fantasy';

const SEEDS: Record<DemoMode, {seed: ContextSeed; screen: string; heading: string}> = {
  search: {
    seed: {kind: 'search-query', query: 'Superman III movie'},
    screen: 'WebSearch',
    heading: 'Web search demo',
  },
  article: {
    seed: {
      kind: 'article',
      articleId: 'art-1',
      title: 'Knicks concerned about Jalen Brunson ankle ahead of Celtics game',
      url: 'https://mock.sideline.test/article',
    },
    screen: 'Article',
    heading: 'Article demo',
  },
  player: {
    seed: {kind: 'player', playerId: 'brunson', name: 'Jalen Brunson'},
    screen: 'Player',
    heading: 'Player demo',
  },
  prop: {
    seed: {kind: 'player-prop', propId: 'prop-1', playerId: 'brunson', line: 27.5, odds: -110},
    screen: 'PlayerProp',
    heading: 'Player prop demo',
  },
  fantasy: {
    seed: {kind: 'fantasy-matchup', matchupId: 'mu-4'},
    screen: 'FantasyMatchup',
    heading: 'Fantasy matchup demo',
  },
};

export function DemoScreen({mode}: {mode: DemoMode}) {
  const ctx = useAppContext();
  const navigation = useNavigation<NativeStackNavigationProp<ContentStackParamList>>();
  const {seed, screen, heading} = SEEDS[mode];

  // Publishing the seed on focus is the whole contract: whatever the user
  // was looking at becomes the AI's context. Tab switches don't unmount
  // this screen, so scroll position is preserved automatically.
  useFocusEffect(
    useCallback(() => {
      ctx.setSeed(seed, screen);
    }, [ctx, seed, screen]),
  );

  const openResearch = () => {
    navigation.getParent<BottomTabNavigationProp<RootTabs>>()?.navigate('Research', {screen: 'Home'});
  };

  return (
    <ScrollView style={styles.root}>
      <Text style={styles.title}>{heading}</Text>
      <View style={styles.card}>
        <Text style={[styles.muted, {marginBottom: 6}]}>Context seed: {seed.kind}</Text>
        <Text style={[styles.body, {color: colors.accent}]}>{contextLabel(seed)}</Text>
      </View>
      <DemoBody mode={mode} />
      <TouchableOpacity onPress={openResearch} style={{marginTop: 8, marginBottom: 32}}>
        <Text style={styles.button}>Ask about this in Research ›</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

function DemoBody({mode}: {mode: DemoMode}) {
  switch (mode) {
    case 'search':
      return (
        <View style={styles.card}>
          <Text style={styles.body}>Results for "Superman III movie" (mock)</Text>
          <Text style={[styles.muted, {marginTop: 8}]}>1. Superman III (1983) — the one with Richard Pryor.{'\n'}2. Why Superman III divides fans.{'\n'}3. Box office and legacy.</Text>
        </View>
      );
    case 'article':
      return (
        <View style={styles.card}>
          <Text style={[styles.body, {fontWeight: '700', marginBottom: 8}]}>
            Knicks concerned about Jalen Brunson ankle ahead of Celtics game
          </Text>
          <Text style={styles.muted}>Bleacher Report (mock)</Text>
          <Text style={[styles.body, {marginTop: 12}]}>
            The Knicks listed Jalen Brunson as questionable with ankle soreness ahead of tonight's matchup
            with Boston. Brunson went through shootaround but the team is calling it a game-time decision.
            {'\n\n'}Beat reporters note the injury first appeared on the report two days ago, and the line on
            his points prop has already started to drift. If he sits, the usage has to go somewhere — and
            recent history says it flows downhill to the wings.
            {'\n\n'}(Scroll position on this article is preserved when you leave and come back.)
          </Text>
        </View>
      );
    case 'player':
      return (
        <View style={styles.card}>
          <Text style={[styles.body, {fontWeight: '700', fontSize: 20}]}>Jalen Brunson</Text>
          <Text style={styles.muted}>New York Knicks · Guard (mock)</Text>
          <Text style={[styles.body, {marginTop: 12}]}>PPG 27.4 · APG 6.8 · FG% 47.1</Text>
          <Text style={[styles.body, {marginTop: 8, color: colors.warm}]}>Status: Questionable (ankle)</Text>
        </View>
      );
    case 'prop':
      return (
        <View style={styles.card}>
          <Text style={styles.muted}>Knicks vs Celtics · Player prop (mock)</Text>
          <Text style={[styles.body, {fontWeight: '700', fontSize: 20, marginTop: 8}]}>Jalen Brunson</Text>
          <Text style={[styles.body, {fontSize: 18, marginTop: 4}]}>Over 27.5 points · -110</Text>
          <Text style={[styles.muted, {marginTop: 8}]}>Opened 26.5 → now 27.5. Analytical context only — no wagering.</Text>
        </View>
      );
    case 'fantasy':
      return (
        <View style={styles.card}>
          <Text style={styles.muted}>Week 4 · Half-PPR Superflex (mock)</Text>
          <Text style={[styles.body, {fontWeight: '700', fontSize: 18, marginTop: 8}]}>The Dart Knight vs Rival</Text>
          <Text style={[styles.body, {marginTop: 8}]}>Projected: 142.6 — 138.1</Text>
          <Text style={[styles.muted, {marginTop: 8}]}>Roster: Willis, Hall, Jeanty, Nabers, Pittman, St. Brown, Fannin, Dart</Text>
        </View>
      );
  }
}
