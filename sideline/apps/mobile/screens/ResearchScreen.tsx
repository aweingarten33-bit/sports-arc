import React, {useEffect, useRef, useState} from 'react';
import {ActivityIndicator, Linking, ScrollView, Text, TouchableOpacity, View} from 'react-native';
import {useNavigation, useRoute, type RouteProp} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {MockResearchEngine, type ProgressState, type ResearchAnswer} from '@sideline/research';
import {useCurrentEnvelope} from '../state/context';
import {colors, styles} from '../ui/theme';
import {ScoutAnswerView} from '../components/ScoutAnswerView';
import type {ResearchStackParamList} from '../App';

const ALL_STATES: ProgressState[] = [
  'understanding context',
  'checking data',
  'searching',
  'reading sources',
  'verifying',
  'building answer',
];

export function ResearchScreen() {
  const route = useRoute<RouteProp<ResearchStackParamList, 'Answer'>>();
  const navigation = useNavigation<NativeStackNavigationProp<ResearchStackParamList>>();
  const envelope = useCurrentEnvelope();

  const [runId, setRunId] = useState(0);
  const [progress, setProgress] = useState<ProgressState[]>([]);
  const [answer, setAnswer] = useState<ResearchAnswer | null>(null);
  const [cancelled, setCancelled] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!envelope) return;
    const engine = new MockResearchEngine();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setProgress([]);
    setAnswer(null);
    setCancelled(false);
    let alive = true;
    (async () => {
      for await (const ev of engine.research(route.params.question, envelope, ctrl.signal)) {
        if (!alive || ctrl.signal.aborted) return;
        if (ev.answer) setAnswer(ev.answer);
        else setProgress(prev => (prev.includes(ev.state) ? prev : [...prev, ev.state]));
      }
    })();
    return () => {
      alive = false;
      ctrl.abort();
      abortRef.current = null;
    };
    // Re-run only when the user hits retry (runId) or the question changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [runId, route.params.question]);

  const cancel = () => {
    abortRef.current?.abort();
    abortRef.current = null;
    setCancelled(true);
  };

  if (!envelope) {
    return (
      <View style={[styles.root, {justifyContent: 'center'}]}>
        <Text style={styles.title}>No context</Text>
        <Text style={[styles.body, styles.muted]}>Open something in Content first, then ask about it.</Text>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.button}>‹ Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.root}>
      {/* Streaming progress */}
      <View style={styles.card}>
        {ALL_STATES.map(s => {
          const done = progress.includes(s);
          const active = !done && !answer && !cancelled;
          return (
            <View key={s} style={{flexDirection: 'row', alignItems: 'center', paddingVertical: 3}}>
              {done ? (
                <Text style={{color: colors.accent, marginRight: 8}}>✓</Text>
              ) : (
                <ActivityIndicator size="small" color={active ? colors.accent : colors.muted} style={{marginRight: 8}} />
              )}
              <Text style={[styles.body, {opacity: done || active ? 1 : 0.4}]}>{s}</Text>
            </View>
          );
        })}
        {!answer && !cancelled && (
          <TouchableOpacity onPress={cancel} style={{marginTop: 8}}>
            <Text style={[styles.button, {color: colors.danger}]}>Cancel</Text>
          </TouchableOpacity>
        )}
      </View>

      {cancelled && !answer && (
        <View style={styles.card}>
          <Text style={styles.body}>Research cancelled.</Text>
          <TouchableOpacity onPress={() => setRunId(id => id + 1)}>
            <Text style={styles.button}>Retry ›</Text>
          </TouchableOpacity>
        </View>
      )}

      {answer && (
        <View style={{marginHorizontal: -16, marginTop: 4}}>
          <ScoutAnswerView
            question={route.params.question}
            answer={answer}
            pad={16}
            onOpenSource={url => Linking.openURL(url)}
            onFollowUp={q => navigation.push('Answer', {question: q})}
          />
        </View>
      )}
    </ScrollView>
  );
}
