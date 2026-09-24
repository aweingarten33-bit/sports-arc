import React, {useEffect, useRef, useState} from 'react';
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {LinearGradient} from 'expo-linear-gradient';
import {MockResearchEngine, type ProgressState, type ResearchAnswer} from '@sideline/research';
import type {ContextEnvelope} from '@sideline/context';
import {colors} from '../ui/theme';
import {ScoutAnswerView} from './ScoutAnswerView';
import {detectEntities, domainOf, type ExtractedPage} from '../lib/extract';
import {useTabsStore, type BrowserTab} from '../state/tabs';
import type {ScoutAsk} from '../state/scout';

interface ScoutPanelProps {
  tab: BrowserTab;
  extractPage: () => Promise<ExtractedPage | null>;
  /** A question pushed from another screen (e.g. Lore). Runs instead of page extraction. */
  externalAsk: ScoutAsk | null;
  onClose: () => void;
}

type Phase = 'reading' | 'researching' | 'done' | 'error';

/**
 * Scout panel: AI research about the page you're actually on — no retyping.
 * Loading mirrors the reference vibe (purple→pink gradient, "Reading this
 * page" + domain); the answer uses the shared ScoutAnswerView (query pill,
 * source cards, blue headline, emoji-led sections, pull quotes, follow-ups,
 * feedback, sources). Powered by the existing (mock) ResearchEngine.
 */
export function ScoutPanel({tab, extractPage, externalAsk, onClose}: ScoutPanelProps) {
  const [phase, setPhase] = useState<Phase>('reading');
  const [progress, setProgress] = useState<ProgressState[]>([]);
  const [answer, setAnswer] = useState<ResearchAnswer | null>(null);
  const [pageLabel, setPageLabel] = useState(domainOf(tab.url));
  const [question, setQuestion] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [runKey, setRunKey] = useState(0);
  const [followUp, setFollowUp] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const envelopeRef = useRef<ContextEnvelope | null>(null);

  useEffect(() => {
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    let alive = true;
    const engine = new MockResearchEngine();

    (async () => {
      try {
        let question: string;
        let envelope: ContextEnvelope;
        const ask = externalAsk;
        if (ask && followUp === null && runKey === 0) {
          // Pushed from another screen: research the question against its seed.
          question = ask.question;
          envelope = {seed: ask.seed, screen: 'Scout', entities: [], capturedAt: new Date().toISOString()};
          setPageLabel('Scout');
        } else {
          const page = await extractPage();
          if (!alive || ctrl.signal.aborted) return;
          const text = page?.text ?? '';
          const title = page?.title || tab.title;
          setPageLabel(domainOf(page?.url ?? tab.url));
          envelope = {
            seed: {kind: 'web-page', url: page?.url ?? tab.url, title},
            screen: 'Browser',
            entities: detectEntities(text),
            capturedAt: new Date().toISOString(),
          };
          question = followUp ?? `Analyze this page for me: ${title}`;
        }
        envelopeRef.current = envelope;
        setQuestion(question);
        if (!alive || ctrl.signal.aborted) return;
        setPhase('researching');
        setProgress([]);
        setAnswer(null);
        setError(null);
        for await (const ev of engine.research(question, envelope, ctrl.signal)) {
          if (!alive || ctrl.signal.aborted) return;
          if (ev.answer) {
            setAnswer(ev.answer);
            setPhase('done');
          } else {
            setProgress(prev => (prev.includes(ev.state) ? prev : [...prev, ev.state]));
          }
        }
      } catch (e) {
        if (!alive || ctrl.signal.aborted) return;
        setError(e instanceof Error ? e.message : 'Scout hit a snag.');
        setPhase('error');
      }
    })();

    return () => {
      alive = false;
      ctrl.abort();
      abortRef.current = null;
    };
    // runKey re-runs (retry / follow-up). tab identity change remounts via parent key.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [runKey]);

  const cancel = () => {
    abortRef.current?.abort();
    onClose();
  };

  return (
    <View style={{position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'flex-end'}}>
      <TouchableOpacity style={{flex: 1}} onPress={onClose} activeOpacity={1} />
      <View
        style={{
          height: '92%',
          backgroundColor: colors.background,
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          borderTopWidth: 1,
          borderLeftWidth: 1,
          borderRightWidth: 1,
          borderColor: colors.border,
          overflow: 'hidden',
        }}>
        {phase === 'done' && answer ? (
          <View style={{flex: 1}}>
            <View style={{alignItems: 'center', paddingTop: 10}}>
              <View style={{width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border}} />
            </View>
            <ScrollView style={{flex: 1}} contentContainerStyle={{paddingBottom: 140}}>
              <ScoutAnswerView
                question={question}
                answer={answer}
                pageUrl={tab.url}
                pad={20}
                onOpenSource={url => {
                  useTabsStore.getState().openTab(url);
                  onClose();
                }}
                onFollowUp={q => {
                  setFollowUp(q);
                  setRunKey(k => k + 1);
                }}
              />
            </ScrollView>
          </View>
        ) : phase === 'error' ? (
          <View style={{flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24}}>
            <Text style={{color: colors.text, fontSize: 20, fontWeight: '700', marginBottom: 8}}>Scout hit a snag</Text>
            <Text style={{color: colors.muted, fontSize: 16, textAlign: 'center', marginBottom: 16}}>{error}</Text>
            <TouchableOpacity onPress={() => setRunKey(k => k + 1)}>
              <Text style={{color: colors.accent, fontSize: 17, fontWeight: '600'}}>Retry ›</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <LoadingView phase={phase} pageLabel={pageLabel} progress={progress} onCancel={cancel} />
        )}
      </View>
    </View>
  );
}

function LoadingView({
  phase,
  pageLabel,
  progress,
  onCancel,
}: {
  phase: Phase;
  pageLabel: string;
  progress: ProgressState[];
  onCancel: () => void;
}) {
  return (
    <LinearGradient
      colors={['#2b2140', '#7c5cff', '#ff5c8a']}
      locations={[0, 0.55, 1]}
      style={{flex: 1, padding: 28, justifyContent: 'space-between'}}>
      <View style={{marginTop: 40}}>
        <Text style={{color: '#fff', fontSize: 30, fontWeight: '800', marginBottom: 10}}>
          {phase === 'reading' ? 'Reading this page' : 'Researching'}
        </Text>
        <Text style={{color: 'rgba(255,255,255,0.75)', fontSize: 22}}>{pageLabel}</Text>
        {progress.length > 0 && (
          <View style={{marginTop: 24}}>
            {progress.map(s => (
              <Text key={s} style={{color: 'rgba(255,255,255,0.85)', fontSize: 15, marginBottom: 6}}>
                ✓ {s}
              </Text>
            ))}
            <ActivityIndicator color="#fff" style={{alignSelf: 'flex-start', marginTop: 8}} />
          </View>
        )}
      </View>
      <TouchableOpacity
        onPress={onCancel}
        style={{
          alignSelf: 'center',
          borderWidth: 1.5,
          borderColor: 'rgba(255,255,255,0.6)',
          borderRadius: 999,
          paddingHorizontal: 28,
          paddingVertical: 12,
        }}>
        <Text style={{color: '#fff', fontSize: 16, fontWeight: '600'}}>Cancel</Text>
      </TouchableOpacity>
    </LinearGradient>
  );
}

