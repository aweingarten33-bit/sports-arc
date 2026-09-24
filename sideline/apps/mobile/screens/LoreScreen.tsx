import React, {useState} from 'react';
import {ScrollView, Text, TouchableOpacity, View} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import type {BottomTabNavigationProp} from '@react-navigation/bottom-tabs';
import {mockLoreCards, type LoreCard} from '@sideline/lore';
import {DefaultCompanion} from '@sideline/config';
import {useAppContext} from '../state/context';
import {mockUserContext, privacyStore} from '../state/privacy';
import {colors, styles} from '../ui/theme';
import type {LoreStackParamList, RootTabs} from '../App';

const companionEngine = new DefaultCompanion();

const EXTRA_CARDS: LoreCard[] = [
  {
    id: 'l3',
    nodeId: 'prop-move',
    title: 'The market reacted before the latest injury report',
    body: 'The prop line moved a full point on early action, hours before the questionable tag appeared.',
  },
  {
    id: 'l4',
    nodeId: 'hart',
    title: 'This may matter more for Josh Hart',
    body: 'When Brunson sits, usage flows to the wings — Hart’s rebound and assist lines tick up.',
  },
];

const ROOT_CARD: LoreCard = {
  id: 'root',
  nodeId: 'brunson',
  title: 'Jalen Brunson',
  body: 'Pick a direction to explore. Move forward, go back, or branch.',
};

const CARDS: Record<string, LoreCard> = {
  root: ROOT_CARD,
  l1: mockLoreCards[0] ?? ROOT_CARD,
  l2: mockLoreCards[1] ?? ROOT_CARD,
  l3: EXTRA_CARDS[0] ?? ROOT_CARD,
  l4: EXTRA_CARDS[1] ?? ROOT_CARD,
};

// Mock discovery graph: which cards each card can branch to.
const CHILDREN: Record<string, string[]> = {
  root: ['l1', 'l2'],
  l1: ['l3', 'l4'],
  l2: ['l4'],
  l3: [],
  l4: [],
};

export function LoreScreen() {
  const ctx = useAppContext();
  const navigation = useNavigation<NativeStackNavigationProp<LoreStackParamList>>();
  const [trail, setTrail] = useState<string[]>(['root']);
  const currentId = trail[trail.length - 1] ?? 'root';
  const card = CARDS[currentId] ?? ROOT_CARD;
  const children = (CHILDREN[currentId] ?? []).filter(id => id !== currentId);

  const companionLine =
    card.companionLine ?? companionEngine.line(mockUserContext, privacyStore.preferences);

  const forward = () => {
    const next = children.find(id => !trail.includes(id)) ?? children[0];
    if (next) setTrail(t => [...t, next]);
  };
  const back = () => {
    if (trail.length > 1) setTrail(t => t.slice(0, -1));
  };
  const branch = (id: string) => {
    setTrail(t => [...t.slice(0, t.indexOf(currentId) + 1), id]);
  };
  const researchThis = () => {
    ctx.setSeed({kind: 'search-query', query: card.title}, 'Lore');
    navigation.getParent<BottomTabNavigationProp<RootTabs>>()?.navigate('Research', {screen: 'Answer', params: {question: card.title}});
  };

  return (
    <ScrollView style={styles.root}>
      <Text style={styles.title}>Lore</Text>
      <Text style={[styles.muted, {marginBottom: 12}]}>
        Trail: {trail.map(id => (CARDS[id]?.nodeId ?? id)).join(' → ')}
      </Text>

      {companionLine && (
        <View style={styles.companion}>
          <Text style={[styles.muted, {marginBottom: 4, fontSize: 12}]}>COMPANION</Text>
          <Text style={[styles.body, {color: colors.warm}]}>{companionLine}</Text>
        </View>
      )}

      <View style={styles.card}>
        <Text style={[styles.body, {fontWeight: '700', fontSize: 18, marginBottom: 8}]}>{card.title}</Text>
        <Text style={styles.body}>{card.body}</Text>
      </View>

      <View style={{flexDirection: 'row', justifyContent: 'space-between', marginVertical: 8}}>
        <TouchableOpacity onPress={back} disabled={trail.length <= 1} style={{opacity: trail.length <= 1 ? 0.35 : 1}}>
          <Text style={styles.button}>‹ Back</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={forward} disabled={children.length === 0} style={{opacity: children.length === 0 ? 0.35 : 1}}>
          <Text style={styles.button}>Forward ›</Text>
        </TouchableOpacity>
      </View>

      {children.length > 0 && (
        <View style={styles.card}>
          <Text style={[styles.muted, {marginBottom: 8, fontWeight: '700'}]}>BRANCH</Text>
          {children.map(id => (
            <TouchableOpacity key={id} onPress={() => branch(id)} style={{paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.border}}>
              <Text style={styles.body}>{CARDS[id]?.title ?? id} ›</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <TouchableOpacity onPress={researchThis} style={{marginBottom: 32}}>
        <Text style={styles.button}>Research this node ›</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
