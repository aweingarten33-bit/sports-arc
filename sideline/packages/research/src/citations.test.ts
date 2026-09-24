import { describe, expect, it } from 'vitest';
import { normalizeCitations } from './sse';
import { parseResearchAnswer } from './schema';
import { MockResearchEngine } from './engine';
import type { ContextEnvelope } from '@sideline/context';
import type { ResearchAnswer } from './engine';

const base: ResearchAnswer = {
  title: 't',
  directAnswer: 'He scored 30 [1] last night.',
  keyPoints: ['Big night [2] for the offense.'],
  stats: [],
  timeline: [],
  claims: [
    { text: 'He scored 30 points [1][2].', citationIds: [] },
    { text: 'The line moved [5] after news [1][1].', citationIds: ['s1', 'nope'] },
  ],
  conflicts: [],
  uncertainty: [],
  relatedQuestions: [],
  sources: [
    { id: 's1', url: 'https://a.test/1', title: 'A', quote: 'q1' },
    { id: 's2', url: 'https://a.test/2', title: 'B', quote: 'q2' },
  ],
  suggestedActions: [],
};

describe('normalizeCitations', () => {
  it('maps [n] markers to source ids and strips them from text', () => {
    const out = normalizeCitations(base);
    expect(out.claims[0]).toEqual({ text: 'He scored 30 points.', citationIds: ['s1', 's2'] });
  });

  it('drops out-of-range markers, dedupes, and filters unknown ids', () => {
    const out = normalizeCitations(base);
    expect(out.claims[1]).toEqual({ text: 'The line moved after news.', citationIds: ['s1'] });
  });

  it('strips markers from directAnswer and keyPoints', () => {
    const out = normalizeCitations(base);
    expect(out.directAnswer).toBe('He scored 30 last night.');
    expect(out.keyPoints).toEqual(['Big night for the offense.']);
  });

  it('leaves answers without markers untouched', () => {
    const plain: ResearchAnswer = { ...base, directAnswer: 'No markers here.', keyPoints: [], claims: [{ text: 'Plain claim.', citationIds: ['s2'] }] };
    const out = normalizeCitations(plain);
    expect(out.claims[0]).toEqual({ text: 'Plain claim.', citationIds: ['s2'] });
  });
});

describe('researchAnswerSchema', () => {
  it('accepts the mock engine output shape', async () => {
    const envelope: ContextEnvelope = {
      seed: { kind: 'player-prop', propId: 'p1', playerId: 'brunson', line: 27.5, odds: -110 },
      screen: 'PlayerProp',
      entities: [],
      capturedAt: new Date().toISOString(),
    };
    let answer: ResearchAnswer | undefined;
    for await (const ev of new MockResearchEngine().research('why did this move?', envelope)) {
      if (ev.answer) answer = ev.answer;
    }
    expect(answer).toBeDefined();
    expect(parseResearchAnswer(answer).success).toBe(true);
  });

  it('rejects malformed payloads', () => {
    expect(parseResearchAnswer({ title: 'x' }).success).toBe(false);
    expect(parseResearchAnswer(null).success).toBe(false);
  });
});
