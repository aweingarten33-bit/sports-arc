import React, {useCallback, useReducer, useState} from 'react';
import {ScrollView, Text, TextInput, TouchableOpacity, View} from 'react-native';
import {useFocusEffect, useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {contextLabel} from '@sideline/context';
import {aiHome} from '@sideline/ui';
import {DefaultCompanion} from '@sideline/config';
import {useAppContext, useCurrentEnvelope} from '../state/context';
import {mockUserContext, privacyStore} from '../state/privacy';
import {colors, styles} from '../ui/theme';
import type {ResearchStackParamList} from '../App';

const companionEngine = new DefaultCompanion();

export function AIHomeScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<ResearchStackParamList>>();
  const ctx = useAppContext();
  const envelope = useCurrentEnvelope();
  const [question, setQuestion] = useState('');

  // The context store is not reactive; re-read the envelope every time
  // this tab regains focus so the label always matches current context.
  const [, force] = useReducer(x => x + 1, 0);
  useFocusEffect(useCallback(() => { force(); }, []));

  const companionLine = companionEngine.line(mockUserContext, privacyStore.preferences);
  const home = envelope ? aiHome(envelope) : null;
  const label = envelope ? contextLabel(envelope.seed) : 'Research';

  const ask = (q: string) => {
    const query = q.trim();
    if (!query) return;
    // No context yet (fresh launch): the typed question becomes the seed,
    // so plain search still flows into Browse.
    if (!envelope) ctx.setSeed({kind: 'search-query', query}, 'Research');
    setQuestion('');
    navigation.navigate('Answer', {question: query});
  };

  return (
    <ScrollView style={styles.root} keyboardShouldPersistTaps="handled">
      <Text style={styles.title}>{label}</Text>

      {/* Companion voice: visually distinct, never a cited factual claim. */}
      {companionLine && (
        <View style={styles.companion}>
          <Text style={[styles.muted, {marginBottom: 4, fontSize: 12}]}>COMPANION</Text>
          <Text style={[styles.body, {color: colors.warm}]}>{companionLine}</Text>
        </View>
      )}

      {envelope ? (
        <View style={styles.card}>
          <Text style={styles.muted}>Current context</Text>
          <Text style={[styles.body, {marginTop: 4}]}>Screen: {envelope.screen}</Text>
          <Text style={[styles.body, {marginTop: 2}]}>Seed: {envelope.seed.kind}</Text>
        </View>
      ) : (
        <View style={styles.card}>
          <Text style={styles.body}>Nothing open yet — open something in Content, or just ask below.</Text>
        </View>
      )}

      {home && (
        <View style={{marginBottom: 8}}>
          {home.suggestedActions.map(a => (
            <TouchableOpacity key={a} onPress={() => ask(a)} style={[styles.card, {marginVertical: 4}]}>
              <Text style={styles.body}>{a} ›</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <TextInput
        style={styles.input}
        value={question}
        onChangeText={setQuestion}
        onSubmitEditing={e => ask(e.nativeEvent.text)}
        placeholder="Ask a question…"
        placeholderTextColor={colors.muted}
        returnKeyType="search"
      />
      <TouchableOpacity onPress={() => ask(question)}>
        <Text style={styles.button}>Research ›</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
