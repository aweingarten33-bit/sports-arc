import { describe, expect, it } from 'vitest';
import { streamResearch } from './sse';
import type { ContextEnvelope } from '@sideline/context';

const envelope: ContextEnvelope = {
  seed: { kind: 'player', playerId: 'brunson', name: 'Jalen Brunson' },
  screen: 'Player',
  entities: [],
  capturedAt: new Date().toISOString(),
};

describe('streamResearch fallback', () => {
  it('falls back to the mock engine when the API is unreachable', async () => {
    const events = [];
    for await (const ev of streamResearch({
      baseUrl: 'http://127.0.0.1:1',
      question: 'how did he play?',
      context: envelope,
    })) {
      events.push(ev);
    }
    expect(events.length).toBeGreaterThan(0);
    expect(events.every(e => e.mocked)).toBe(true);
    const final = events[events.length - 1];
    expect(final?.answer).toBeDefined();
    expect(final?.answer?.sources.length).toBeGreaterThan(0);
  });

  it('yields nothing when aborted before the request', async () => {
    const ctrl = new AbortController();
    ctrl.abort();
    const events = [];
    for await (const ev of streamResearch({
      baseUrl: 'http://127.0.0.1:1',
      question: 'q',
      context: envelope,
      signal: ctrl.signal,
    })) {
      events.push(ev);
    }
    // fetch rejects with AbortError -> streamResearch returns silently
    expect(events.length).toBe(0);
  });
});
