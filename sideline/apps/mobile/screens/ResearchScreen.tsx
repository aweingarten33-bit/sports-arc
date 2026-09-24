import React, {useEffect, useRef, useState} from 'react';
import {ActivityIndicator, ScrollView, Text, TouchableOpacity, View} from 'react-native';
import {useNavigation, useRoute, type RouteProp} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {MockResearchEngine, type ProgressState, type ResearchAnswer} from '@sideline/research';
import {useCurrentEnvelope} from '../state/context';
import {colors, styles} from '../ui/theme';
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
      <Text style={styles.title}>{route.params.question}</Text>

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

      {answer && <AnswerView answer={answer} onAsk={q => navigation.push('Answer', {question: q})} />}
    </ScrollView>
  );
}

function AnswerView({answer, onAsk}: {answer: ResearchAnswer; onAsk: (q: string) => void}) {
  const sourceIndex = new Map(answer.sources.map((s, i) => [s.id, i + 1]));
  return (
    <View>
      <Text style={[styles.title, {fontSize: 21}]}>{answer.title}</Text>
      <View style={styles.card}>
        <Text style={[styles.body, {fontSize: 17}]}>{answer.directAnswer}</Text>
      </View>

      {answer.keyPoints.length > 0 && (
        <View style={styles.card}>
          <SectionTitle text="Key points" />
          {answer.keyPoints.map((k, i) => (
            <Text key={i} style={[styles.body, {marginBottom: 4}]}>• {k}</Text>
          ))}
        </View>
      )}

      {answer.stats.length > 0 && (
        <View style={styles.card}>
          <SectionTitle text="Stats" />
          {answer.stats.map((row, i) => (
            <Text key={i} style={styles.body}>
              {Object.entries(row).map(([k, v]) => `${k}: ${v}`).join(' · ')}
            </Text>
          ))}
        </View>
      )}

      {answer.timeline.length > 0 && (
        <View style={styles.card}>
          <SectionTitle text="Timeline" />
          {answer.timeline.map((t, i) => (
            <Text key={i} style={[styles.body, {marginBottom: 4}]}>→ {t}</Text>
          ))}
        </View>
      )}

      {answer.fantasyImpact && (
        <View style={styles.card}>
          <SectionTitle text="Fantasy impact" />
          <Text style={styles.body}>{answer.fantasyImpact}</Text>
        </View>
      )}
      {answer.bettingContext && (
        <View style={styles.card}>
          <SectionTitle text="Betting context" />
          <Text style={styles.body}>{answer.bettingContext}</Text>
        </View>
      )}

      {answer.claims.length > 0 && (
        <View style={styles.card}>
          <SectionTitle text="Sourced claims" />
          {answer.claims.map((c, i) => (
            <Text key={i} style={[styles.body, {marginBottom: 6}]}>
              {c.text}
              {c.citationIds.map(id => ` [${sourceIndex.get(id) ?? '?'}]`).join('')}
            </Text>
          ))}
        </View>
      )}

      {answer.conflicts.length > 0 && (
        <View style={styles.card}>
          <SectionTitle text="Conflicting reports" />
          {answer.conflicts.map((c, i) => (
            <Text key={i} style={styles.body}>• {c}</Text>
          ))}
        </View>
      )}
      {answer.uncertainty.length > 0 && (
        <View style={styles.card}>
          <SectionTitle text="Uncertainty" />
          {answer.uncertainty.map((u, i) => (
            <Text key={i} style={styles.body}>• {u}</Text>
          ))}
        </View>
      )}

      {answer.sources.length > 0 && (
        <View>
          <SectionTitle text="Sources" />
          {answer.sources.map((s, i) => (
            <View key={s.id} style={styles.card}>
              <Text style={[styles.body, {fontWeight: '700'}]}>[{i + 1}] {s.title}</Text>
              <Text style={[styles.body, {marginTop: 6, fontStyle: 'italic'}]}>"{s.quote}"</Text>
              <Text style={[styles.muted, {marginTop: 6}]}>{s.url}</Text>
            </View>
          ))}
        </View>
      )}

      {answer.relatedQuestions.length > 0 && (
        <View style={styles.card}>
          <SectionTitle text="Related questions" />
          {answer.relatedQuestions.map((q, i) => (
            <TouchableOpacity key={i} onPress={() => onAsk(q)}>
              <Text style={[styles.button, {textAlign: 'left'}]}>{q} ›</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {answer.suggestedActions.length > 0 && (
        <View style={styles.card}>
          <SectionTitle text="Suggested actions" />
          {answer.suggestedActions.map((a, i) => (
            <TouchableOpacity key={i} onPress={() => onAsk(a)}>
              <Text style={[styles.button, {textAlign: 'left'}]}>{a} ›</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

function SectionTitle({text}: {text: string}) {
  return <Text style={[styles.muted, {marginBottom: 8, fontWeight: '700'}]}>{text.toUpperCase()}</Text>;
}
