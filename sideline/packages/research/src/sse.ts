import type { ContextEnvelope } from '@sideline/context';
import {
  MockResearchEngine,
  type ProgressState,
  type ResearchAnswer,
  type ResearchEngine,
} from './engine';
import { parseResearchAnswer } from './schema';

/** Events the API emits over POST /api/research/stream. */
export type ServerSseEvent =
  | { event: 'progress'; data: { state: string; detail?: string } }
  | { event: 'sources'; data: { sources: Array<{ id: string; url: string; title: string }> } }
  | { event: 'answer'; data: { partial: unknown } }
  | { event: 'done'; data: { answer: unknown; mocked: boolean } }
  | { event: 'error'; data: { message: string } };

export interface ParsedSseFrame {
  event: string;
  data: string;
}

const PROGRESS_STATES: ProgressState[] = [
  'understanding context',
  'checking data',
  'searching',
  'reading sources',
  'verifying',
  'building answer',
];

export function isProgressState(value: unknown): value is ProgressState {
  return typeof value === 'string' && (PROGRESS_STATES as string[]).includes(value);
}

/**
 * Parse raw SSE text into frames. Handles chunks split mid-frame:
 * returns parsed frames plus any trailing incomplete text to prepend
 * to the next chunk.
 */
export function parseSseFrames(buffer: string): { frames: ParsedSseFrame[]; rest: string } {
  const frames: ParsedSseFrame[] = [];
  const parts = buffer.split('\n\n');
  const rest = parts.pop() ?? '';
  for (const part of parts) {
    let event = '';
    const dataLines: string[] = [];
    for (const line of part.split('\n')) {
      if (line.startsWith('event:')) event = line.slice('event:'.length).trim();
      else if (line.startsWith('data:')) dataLines.push(line.slice('data:'.length).trimStart());
      // comments (":...") and other fields are ignored
    }
    if (event) frames.push({ event, data: dataLines.join('\n') });
  }
  return { frames, rest };
}

/** Parse one frame into a typed server event; null when malformed or unknown. */
export function parseServerEvent(frame: ParsedSseFrame): ServerSseEvent | null {
  let data: unknown;
  try {
    data = JSON.parse(frame.data);
  } catch {
    return null;
  }
  if (typeof data !== 'object' || data === null) return null;
  switch (frame.event) {
    case 'progress':
    case 'sources':
    case 'answer':
    case 'done':
    case 'error':
      return { event: frame.event, data } as ServerSseEvent;
    default:
      return null;
  }
}

export interface ResearchStreamEvent {
  state: ProgressState;
  answer?: ResearchAnswer;
  /** True when the answer came from the mock engine (offline or keyless server). */
  mocked: boolean;
}

export interface StreamResearchOptions {
  baseUrl: string;
  question: string;
  context: ContextEnvelope;
  signal?: AbortSignal;
  /** Used automatically when the API is unreachable or the stream fails. */
  fallback?: ResearchEngine;
}

/**
 * Stream a research run from the API, yielding UI-ready events.
 * Falls back to the mock engine automatically when the API is unreachable,
 * returns an error payload, or the stream breaks mid-flight — the UI never hangs.
 */
export async function* streamResearch(
  opts: StreamResearchOptions,
): AsyncGenerator<ResearchStreamEvent> {
  const fallback = opts.fallback ?? new MockResearchEngine();
  let body: ReadableStream<Uint8Array>;
  try {
    const res = await fetch(`${opts.baseUrl.replace(/\/$/, '')}/api/research/stream`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'text/event-stream' },
      body: JSON.stringify({ question: opts.question, context: opts.context }),
      signal: opts.signal,
    });
    if (!res.ok || !res.body) throw new Error(`research stream failed: HTTP ${res.status}`);
    body = res.body;
  } catch (err) {
    if (isAbort(err) || opts.signal?.aborted) return;
    yield* runFallback(fallback, opts, true);
    return;
  }

  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const { frames, rest } = parseSseFrames(buffer);
      buffer = rest;
      for (const frame of frames) {
        const ev = parseServerEvent(frame);
        if (!ev) continue;
        if (ev.event === 'progress' && isProgressState(ev.data.state)) {
          yield { state: ev.data.state, mocked: false };
        } else if (ev.event === 'done') {
          const parsed = parseResearchAnswer(ev.data.answer);
          if (!parsed.success) throw new Error('invalid answer payload');
          yield { state: 'building answer', answer: parsed.data, mocked: ev.data.mocked };
          return;
        } else if (ev.event === 'error') {
          throw new Error('research stream error');
        }
        // 'sources' and partial 'answer' events: the progress UI already covers
        // the stages, so partial payloads are intentionally not rendered.
      }
    }
    // Stream ended without a done event — fall back rather than hanging the UI.
    yield* runFallback(fallback, opts, true);
  } catch (err) {
    if (isAbort(err) || opts.signal?.aborted) return;
    yield* runFallback(fallback, opts, true);
  } finally {
    reader.releaseLock();
  }
}

async function* runFallback(
  fallback: ResearchEngine,
  opts: StreamResearchOptions,
  mocked: boolean,
): AsyncGenerator<ResearchStreamEvent> {
  for await (const ev of fallback.research(opts.question, opts.context, opts.signal)) {
    yield { state: ev.state, answer: ev.answer, mocked };
  }
}

function isAbort(err: unknown): boolean {
  return err instanceof Error && err.name === 'AbortError';
}

const MARKER_RE = /\[(\d+)\]/g;

/**
 * Map inline [n] citation markers in claim text onto citationIds, then strip
 * the inline markers — the UI renders [n] from citationIds exactly once.
 * Markers pointing past the source list, and ids not present in sources, are dropped.
 * Markers in directAnswer/keyPoints are stripped (claims carry the citations).
 */
export function normalizeCitations(answer: ResearchAnswer): ResearchAnswer {
  const validIds = new Set(answer.sources.map(s => s.id));
  const claims = answer.claims.map(claim => {
    const ids: string[] = [];
    for (const m of claim.text.matchAll(MARKER_RE)) {
      const src = answer.sources[Number(m[1]) - 1];
      if (src && validIds.has(src.id) && !ids.includes(src.id)) ids.push(src.id);
    }
    for (const id of claim.citationIds ?? []) {
      if (validIds.has(id) && !ids.includes(id)) ids.push(id);
    }
    return { text: stripMarkers(claim.text), citationIds: ids };
  });
  return {
    ...answer,
    directAnswer: stripMarkers(answer.directAnswer),
    keyPoints: answer.keyPoints.map(stripMarkers),
    claims,
  };
}

function stripMarkers(text: string): string {
  return text
    .replace(MARKER_RE, '')
    .replace(/[ \t]+([.,;:!?])/g, '$1')
    .replace(/[ \t]{2,}/g, ' ')
    .trim();
}
