import React, {useState} from 'react';
import {ScrollView, Text, TouchableOpacity, View} from 'react-native';
import type {ResearchAnswer} from '@sideline/research';
import {colors} from '../ui/theme';
import {Favicon} from './Favicon';
import {domainOf} from '../lib/extract';

const BLUE = '#5e9bff';
const BLACK = '#000000';
const QUOTE_GRAY = '#a7b0c0';
const FEEDBACK_BG = '#1b2342';
const FEEDBACK_BTN = '#242c52';
const FEEDBACK_BTN_ACTIVE = '#2c3a6e';

export interface ScoutAnswerViewProps {
  /** The question being answered; shown in the black query pill. */
  question: string;
  answer: ResearchAnswer;
  /** Fallback source when the answer carries no citations. */
  pageUrl?: string;
  onOpenSource: (url: string) => void;
  /** Run a new Scout query (follow-up pill). */
  onFollowUp: (q: string) => void;
  /** Horizontal padding of the surrounding scroll content; full-bleed rows compensate. */
  pad?: number;
}

interface TermLink {
  term: string;
  url: string;
}

/**
 * Answer page shared by the Scout panel and the Research answer screen.
 * Layout follows the reference answer-page pattern (query pill, source cards,
 * blue headline, emoji-led sections, pull quotes, follow-up pills, feedback,
 * wavy divider, sources) — with our own marks and no third-party branding.
 */
export function ScoutAnswerView({
  question,
  answer,
  pageUrl,
  onOpenSource,
  onFollowUp,
  pad = 20,
}: ScoutAnswerViewProps) {
  const [sourcesOpen, setSourcesOpen] = useState(true);
  const [vote, setVote] = useState<'up' | 'down' | null>(null);

  const sourceIndex = new Map(answer.sources.map((s, i) => [s.id, i + 1]));
  const chips =
    answer.sources.length > 0
      ? answer.sources.map(s => ({title: s.title, url: s.url}))
      : pageUrl
        ? [{title: domainOf(pageUrl), url: pageUrl}]
        : [];
  const sourceRows =
    answer.sources.length > 0
      ? answer.sources
      : pageUrl
        ? [{id: 'page', title: domainOf(pageUrl), url: pageUrl, quote: ''}]
        : [];

  // Inline link terms: source titles that appear verbatim in the prose.
  const termLinks: TermLink[] = [];
  for (const s of answer.sources) {
    const t = s.title.trim();
    if (t.length >= 4 && !termLinks.some(l => l.url === s.url)) {
      termLinks.push({term: t, url: s.url});
    }
  }

  const groups = buildGroups(answer, sourceIndex, termLinks, onOpenSource);
  const quotes = answer.sources.filter(s => s.quote && s.quote.trim().length > 0).slice(0, 3);
  const followUps = [...answer.relatedQuestions, ...answer.suggestedActions].filter(
    (q, i, arr) => q.trim().length > 0 && arr.indexOf(q) === i,
  ).slice(0, 6);

  const bleed = {marginHorizontal: -pad, paddingHorizontal: pad};

  return (
    <View style={{paddingHorizontal: pad}}>
      {/* 1 — query pill */}
      <View
        style={{
          backgroundColor: BLACK,
          borderRadius: 999,
          paddingVertical: 14,
          paddingHorizontal: 18,
          flexDirection: 'row',
          alignItems: 'center',
          marginBottom: 14,
        }}>
        <Text style={{color: '#8a93a3', fontSize: 18, marginRight: 10}}>⌕</Text>
        <Text style={{color: '#c9d1de', fontSize: 17, fontWeight: '600', flex: 1}} numberOfLines={1}>
          {question}
        </Text>
      </View>

      {/* 2 — "Read N web pages" + collapse */}
      {chips.length > 0 && (
        <View>
          <TouchableOpacity
            onPress={() => setSourcesOpen(v => !v)}
            style={{flexDirection: 'row', alignItems: 'center', marginBottom: 12}}>
            <Text style={{color: '#8a93a3', fontSize: 16, marginRight: 8}}>◉</Text>
            <Text style={{color: '#e8ecf3', fontSize: 17, fontWeight: '700', marginRight: 8}}>
              Read {chips.length} web page{chips.length === 1 ? '' : 's'}
            </Text>
            <Text style={{color: '#8a93a3', fontSize: 18, fontWeight: '700'}}>{sourcesOpen ? '^' : 'v'}</Text>
          </TouchableOpacity>

          {/* 3 — source cards */}
          {sourcesOpen && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={[{marginBottom: 18}, bleed]}>
              {chips.map((c, i) => (
                <TouchableOpacity
                  key={`${c.url}-${i}`}
                  onPress={() => onOpenSource(c.url)}
                  style={{
                    backgroundColor: BLACK,
                    borderRadius: 18,
                    padding: 16,
                    marginRight: 12,
                    width: 230,
                    minHeight: 118,
                    justifyContent: 'space-between',
                  }}>
                  <Text
                    style={{color: '#ffffff', fontSize: 16, fontWeight: '600', lineHeight: 22, marginBottom: 12}}
                    numberOfLines={2}>
                    {c.title}
                  </Text>
                  <View style={{flexDirection: 'row', alignItems: 'center'}}>
                    <Favicon url={c.url} size={20} />
                    <Text style={{color: '#8a93a3', fontSize: 14, marginLeft: 8, flex: 1}} numberOfLines={1}>
                      {domainOf(c.url)}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>
      )}

      {/* 4 — blue headline */}
      <Text style={{color: BLUE, fontSize: 32, fontWeight: '800', lineHeight: 38, marginBottom: 14}}>
        {answer.title}
      </Text>

      {/* lead paragraph */}
      {answer.directAnswer.trim().length > 0 && (
        <Text style={{color: colors.text, fontSize: 19, lineHeight: 29, marginBottom: 20}}>
          {linkedNodes(answer.directAnswer, termLinks, onOpenSource)}
        </Text>
      )}

      {groups.details.length > 0 && (
        <View>
          {groups.details.map(s => (
            <SectionRow key={s.label} emoji={s.emoji} label={s.label}>
              {s.body}
            </SectionRow>
          ))}
        </View>
      )}

      {/* 6 — pull-quote cards */}
      {quotes.map(q => (
        <TouchableOpacity
          key={q.id}
          onPress={() => onOpenSource(q.url)}
          activeOpacity={0.85}
          style={{backgroundColor: '#050507', borderRadius: 22, padding: 22, marginBottom: 16}}>
          <Text style={{color: QUOTE_GRAY, fontSize: 23, lineHeight: 32, fontWeight: '500'}}>
            &ldquo;{q.quote}&rdquo;
          </Text>
          <View style={{flexDirection: 'row', alignItems: 'center', marginTop: 16}}>
            <Favicon url={q.url} size={30} />
            <View style={{marginLeft: 12, flex: 1}}>
              <Text style={{color: '#ffffff', fontSize: 16, fontWeight: '600'}} numberOfLines={1}>
                {q.title}
              </Text>
              <Text style={{color: '#8a93a3', fontSize: 14, marginTop: 2}}>{domainOf(q.url)}</Text>
            </View>
          </View>
        </TouchableOpacity>
      ))}

      {/* 7 — follow-up pills */}
      {followUps.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={[{marginBottom: 8, marginTop: 4}, bleed]}>
          {followUps.map(q => (
            <TouchableOpacity
              key={q}
              onPress={() => onFollowUp(q)}
              style={{
                backgroundColor: BLACK,
                borderRadius: 999,
                paddingVertical: 14,
                paddingHorizontal: 22,
                marginRight: 12,
              }}>
              <Text style={{color: '#ffffff', fontSize: 17, fontWeight: '600'}}>{q}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* 8 — blue sub-section headers */}
      {groups.analysis.length > 0 && (
        <View style={{marginTop: 16}}>
          <Text style={{color: BLUE, fontSize: 30, fontWeight: '800', marginBottom: 18}}>Analysis</Text>
          {groups.analysis.map(s => (
            <SectionRow key={s.label} emoji={s.emoji} label={s.label}>
              {s.body}
            </SectionRow>
          ))}
        </View>
      )}
      {groups.caveats.length > 0 && (
        <View style={{marginTop: 8}}>
          <Text style={{color: BLUE, fontSize: 30, fontWeight: '800', marginBottom: 18}}>Caveats</Text>
          {groups.caveats.map(s => (
            <SectionRow key={s.label} emoji={s.emoji} label={s.label}>
              {s.body}
            </SectionRow>
          ))}
        </View>
      )}

      {/* 9 — feedback card */}
      <View
        style={{
          backgroundColor: FEEDBACK_BG,
          borderRadius: 22,
          padding: 22,
          marginTop: 12,
          flexDirection: 'row',
          alignItems: 'center',
        }}>
        <Text style={{flex: 1, color: BLUE, fontSize: 24, lineHeight: 32, fontWeight: '800'}}>
          Did Scout answer your question?
        </Text>
        <View style={{flexDirection: 'row', marginLeft: 12}}>
          {(['up', 'down'] as const).map(v => (
            <TouchableOpacity
              key={v}
              onPress={() => setVote(v)}
              style={{
                backgroundColor: vote === v ? FEEDBACK_BTN_ACTIVE : FEEDBACK_BTN,
                borderRadius: 16,
                padding: 12,
                marginLeft: 8,
              }}>
              <Text style={{fontSize: 26}}>{v === 'up' ? '👍' : '👎'}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
      {vote !== null && (
        <Text style={{color: colors.muted, fontSize: 14, marginTop: 8}}>Thanks — noted.</Text>
      )}

      {/* 10 — wavy divider + Sources */}
      <View style={[{flexDirection: 'row', marginTop: 28}, bleed]}>
        {Array.from({length: 28}).map((_, i) => (
          <View
            key={i}
            style={{
              flex: 1,
              height: 12,
              backgroundColor: BLACK,
              borderTopLeftRadius: 200,
              borderTopRightRadius: 200,
            }}
          />
        ))}
      </View>
      <View style={[{backgroundColor: BLACK, paddingTop: 10, paddingBottom: 48}, bleed]}>
        <Text style={{color: '#8a93a3', fontSize: 26, fontWeight: '800', marginBottom: 12}}>Sources</Text>
        {sourceRows.map(s => (
          <TouchableOpacity
            key={s.id}
            onPress={() => onOpenSource(s.url)}
            style={{flexDirection: 'row', alignItems: 'center', paddingVertical: 12}}>
            <Favicon url={s.url} size={34} />
            <View style={{marginLeft: 14, flex: 1}}>
              <Text style={{color: '#ffffff', fontSize: 17, fontWeight: '700'}} numberOfLines={1}>
                {s.title}
              </Text>
              <Text style={{color: '#8a93a3', fontSize: 15, marginTop: 2}}>{domainOf(s.url)}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

interface BodySection {
  emoji: string;
  label: string;
  body: React.ReactNode;
}

function buildGroups(
  answer: ResearchAnswer,
  sourceIndex: Map<string, number>,
  termLinks: TermLink[],
  onOpenSource: (url: string) => void,
): {details: BodySection[]; analysis: BodySection[]; caveats: BodySection[]} {
  const para = (text: string) => linkedNodes(text, termLinks, onOpenSource);
  const details: BodySection[] = [];
  if (answer.keyPoints.length > 0) {
    details.push({emoji: '📌', label: 'Key points', body: para(answer.keyPoints.join('\n\n'))});
  }
  if (answer.stats.length > 0) {
    details.push({
      emoji: '📊',
      label: 'Stats',
      body: para(answer.stats.map(row => Object.entries(row).map(([k, v]) => `${k}: ${v}`).join(' · ')).join('\n')),
    });
  }
  if (answer.timeline.length > 0) {
    details.push({emoji: '🗓', label: 'Timeline', body: para(answer.timeline.join(' → '))});
  }

  const analysis: BodySection[] = [];
  if (answer.fantasyImpact) {
    analysis.push({emoji: '🏈', label: 'Fantasy impact', body: para(answer.fantasyImpact)});
  }
  if (answer.bettingContext) {
    analysis.push({emoji: '📈', label: 'Betting context', body: para(answer.bettingContext)});
  }
  if (answer.claims.length > 0) {
    analysis.push({
      emoji: '✅',
      label: 'Sourced claims',
      body: (
        <Text>
          {answer.claims.map((c, ci) => (
            <Text key={ci}>
              {para(c.text)}
              {c.citationIds.map(id => {
                const n = sourceIndex.get(id);
                const src = n ? answer.sources[n - 1] : undefined;
                if (!n || !src) return null;
                return (
                  <Text key={id} style={{color: BLUE}} onPress={() => onOpenSource(src.url)}>
                    {' '}[{n}]
                  </Text>
                );
              })}
              {ci < answer.claims.length - 1 ? '\n\n' : ''}
            </Text>
          ))}
        </Text>
      ),
    });
  }

  const caveats: BodySection[] = [];
  if (answer.conflicts.length > 0) {
    caveats.push({emoji: '⚠️', label: 'Conflicting reports', body: para(answer.conflicts.join('\n\n'))});
  }
  if (answer.uncertainty.length > 0) {
    caveats.push({emoji: '❓', label: 'Still uncertain', body: para(answer.uncertainty.join('\n\n'))});
  }
  return {details, analysis, caveats};
}

function SectionRow({emoji, label, children}: {emoji: string; label: string; children: React.ReactNode}) {
  return (
    <View style={{flexDirection: 'row', marginBottom: 24}}>
      <Text style={{fontSize: 27, width: 46, lineHeight: 34}}>{emoji}</Text>
      <Text style={{flex: 1, color: colors.text, fontSize: 19, lineHeight: 29}}>
        <Text style={{fontWeight: '800'}}>{label}</Text>
        {' — '}
        {children}
      </Text>
    </View>
  );
}

function escapeRegExp(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Split prose on linkable terms; matching terms render as tappable blue
 * underlined links. Only terms that actually occur link — nothing is invented.
 */
function linkedNodes(
  text: string,
  links: TermLink[],
  onOpenSource: (url: string) => void,
): React.ReactNode[] {
  const terms = links
    .map(l => l.term)
    .filter(t => t.length >= 3 && text.toLowerCase().includes(t.toLowerCase()))
    .sort((a, b) => b.length - a.length);
  if (terms.length === 0) return [text];
  const re = new RegExp(`(${terms.map(escapeRegExp).join('|')})`, 'gi');
  return text.split(re).map((part, i) => {
    const hit = links.find(l => l.term.toLowerCase() === part.toLowerCase());
    if (!hit || part.length === 0) return part;
    return (
      <Text
        key={`link-${i}`}
        style={{color: BLUE, textDecorationLine: 'underline'}}
        onPress={() => onOpenSource(hit.url)}>
        {part}
      </Text>
    );
  });
}
