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
import {Favicon} from './Favicon';
import {detectEntities, domainOf, type ExtractedPage} from '../lib/extract';
import type {BrowserTab} from '../state/tabs';
import type {ScoutAsk} from '../state/scout';

interface ScoutPanelProps {
  tab: BrowserTab;
  extractPage: () => Promise<ExtractedPage | null>;
  /** A question pushed from another screen (e.g. Lore). Runs instead of page extraction. */
  externalAsk: ScoutAsk | null;
  onClose: () => void;
}

type Phase = 'reading' | 'researching' | 'done' | 'error';

const HEADLINE_BLUE = '#7aa7ff';

/**
 * Scout panel: AI research about the page you're actually on — no retyping.
 * Loading mirrors the reference vibe (purple→pink gradient, "Reading this
 * page" + domain); the answer mirrors the reference answer format (source
 * chips, blue headline, emoji-led fact sections). Powered by the existing
 * (mock) ResearchEngine.
 */
export function ScoutPanel({tab, extractPage, externalAsk, onClose}: ScoutPanelProps) {
  const [phase, setPhase] = useState<Phase>('reading');
  const [progress, setProgress] = useState<ProgressState[]>([]);
  const [answer, setAnswer] = useState<ResearchAnswer | null>(null);
  const [pageLabel, setPageLabel] = useState(domainOf(tab.url));
  const [sourcesOpen, setSourcesOpen] = useState(true);
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
          <AnswerView
            answer={answer}
            pageUrl={tab.url}
            sourcesOpen={sourcesOpen}
            onToggleSources={() => setSourcesOpen(v => !v)}
            onFollowUp={q => {
              setFollowUp(q);
              setRunKey(k => k + 1);
            }}
            onClose={onClose}
          />
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

function AnswerView({
  answer,
  pageUrl,
  sourcesOpen,
  onToggleSources,
  onFollowUp,
  onClose,
}: {
  answer: ResearchAnswer;
  pageUrl: string;
  sourcesOpen: boolean;
  onToggleSources: () => void;
  onFollowUp: (q: string) => void;
  onClose: () => void;
}) {
  const sourceIndex = new Map(answer.sources.map((s, i) => [s.id, i + 1]));
  const chips =
    answer.sources.length > 0
      ? answer.sources.map(s => ({title: s.title, url: s.url}))
      : [{title: domainOf(pageUrl), url: pageUrl}];
  return (
    <View style={{flex: 1}}>
      <View style={{alignItems: 'center', paddingTop: 10}}>
        <View style={{width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border}} />
      </View>
      <ScrollView style={{flex: 1}} contentContainerStyle={{padding: 20, paddingBottom: 40}}>
        <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12}}>
          <TouchableOpacity onPress={onToggleSources} style={{flexDirection: 'row', alignItems: 'center'}}>
            <Text style={{color: colors.text, fontSize: 17, fontWeight: '700', marginRight: 6}}>
              Read {chips.length} web page{chips.length === 1 ? '' : 's'}
            </Text>
            <Text style={{color: colors.muted, fontSize: 16}}>{sourcesOpen ? '﹀' : '︿'}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onClose}>
            <Text style={{color: colors.muted, fontSize: 16}}>✕</Text>
          </TouchableOpacity>
        </View>

        {sourcesOpen && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{marginBottom: 16, marginHorizontal: -20, paddingHorizontal: 20}}>
            {chips.map((c, i) => (
              <View
                key={`${c.url}-${i}`}
                style={{
                  backgroundColor: colors.panel,
                  borderWidth: 1,
                  borderColor: colors.border,
                  borderRadius: 12,
                  padding: 12,
                  marginRight: 10,
                  width: 200,
                }}>
                <Text style={{color: colors.text, fontSize: 14, fontWeight: '600', marginBottom: 8}} numberOfLines={2}>
                  {c.title}
                </Text>
                <View style={{flexDirection: 'row', alignItems: 'center'}}>
                  <Favicon url={c.url} size={16} />
                  <Text style={{color: colors.muted, fontSize: 13, marginLeft: 6}} numberOfLines={1}>
                    {domainOf(c.url)}
                  </Text>
                </View>
              </View>
            ))}
          </ScrollView>
        )}

        <Text style={{color: HEADLINE_BLUE, fontSize: 30, fontWeight: '800', lineHeight: 36, marginBottom: 14}}>
          {answer.title}
        </Text>
        <Text style={{color: colors.text, fontSize: 17, lineHeight: 25, marginBottom: 18}}>{answer.directAnswer}</Text>

        <FactSection emoji="📌" label="Key points">
          {answer.keyPoints.map((k, i) => (
            <Text key={i} style={sectionText()}>• {k}</Text>
          ))}
        </FactSection>
        <FactSection emoji="📊" label="Stats">
          {answer.stats.map((row, i) => (
            <Text key={i} style={sectionText()}>
              {Object.entries(row).map(([k, v]) => `${k}: ${v}`).join(' · ')}
            </Text>
          ))}
        </FactSection>
        <FactSection emoji="🗓" label="Timeline">
          {answer.timeline.map((t, i) => (
            <Text key={i} style={sectionText()}>→ {t}</Text>
          ))}
        </FactSection>
        {answer.fantasyImpact && (
          <FactSection emoji="🏈" label="Fantasy impact">
            <Text style={sectionText()}>{answer.fantasyImpact}</Text>
          </FactSection>
        )}
        {answer.bettingContext && (
          <FactSection emoji="📈" label="Betting context">
            <Text style={sectionText()}>{answer.bettingContext}</Text>
          </FactSection>
        )}
        <FactSection emoji="✅" label="Sourced claims">
          {answer.claims.map((c, i) => (
            <Text key={i} style={sectionText()}>
              {c.text}
              {c.citationIds.map(id => ` [${sourceIndex.get(id) ?? '?'}]`).join('')}
            </Text>
          ))}
        </FactSection>
        <FactSection emoji="⚠️" label="Conflicting reports">
          {answer.conflicts.map((c, i) => (
            <Text key={i} style={sectionText()}>• {c}</Text>
          ))}
        </FactSection>
        <FactSection emoji="❓" label="Still uncertain">
          {answer.uncertainty.map((u, i) => (
            <Text key={i} style={sectionText()}>• {u}</Text>
          ))}
        </FactSection>

        {answer.relatedQuestions.length > 0 && (
          <View style={{marginTop: 8}}>
            <Text style={{fontSize: 17, fontWeight: '700', marginBottom: 8}}>
              <Text>🔗 </Text>
              <Text style={{color: colors.text}}>Related</Text>
            </Text>
            {answer.relatedQuestions.map((q, i) => (
              <TouchableOpacity key={i} onPress={() => onFollowUp(q)} style={{paddingVertical: 8}}>
                <Text style={{color: colors.accent, fontSize: 16}}>{q} ›</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function FactSection({emoji, label, children}: {emoji: string; label: string; children: React.ReactNode}) {
  const kids = React.Children.toArray(children);
  if (kids.length === 0) return null;
  return (
    <View style={{marginBottom: 18}}>
      <Text style={{fontSize: 17, fontWeight: '700', marginBottom: 8}}>
        <Text>{emoji} </Text>
        <Text style={{color: colors.text}}>{label}</Text>
      </Text>
      {kids}
    </View>
  );
}

function sectionText() {
  return {color: colors.text, fontSize: 16, lineHeight: 24, marginBottom: 6} as const;
}
