import { streamObject } from 'ai';
import { google } from '@ai-sdk/google';
import { tavily } from '@tavily/core';
import { JSDOM } from 'jsdom';
import { Readability } from '@mozilla/readability';
import {
  MockResearchEngine,
  normalizeCitations,
  researchAnswerSchema,
  routeQuery,
} from '@sideline/research';
import type { Citation, ProgressState, ResearchAnswer } from '@sideline/research';
import type { ContextEnvelope, ContextSeed } from '@sideline/context';
import { isSafeUrl } from '@sideline/providers';

/** Events emitted by the pipeline; serialized 1:1 as SSE frames. */
export type PipelineEvent =
  | { event: 'progress'; data: { state: ProgressState; detail?: string } }
  | { event: 'sources'; data: { sources: Array<{ id: string; url: string; title: string }> } }
  | { event: 'answer'; data: { partial: unknown } }
  | { event: 'done'; data: { answer: ResearchAnswer; mocked: boolean } }
  | { event: 'error'; data: { message: string } };

export interface PipelineLogger {
  info(message: string): void;
  error(message: string, cause?: unknown): void;
}

const defaultLogger: PipelineLogger = {
  info: message => console.log(message),
  error: (message, cause) => console.error(message, cause),
};

const MAX_SOURCES = 5;
const EXTRACT_TIMEOUT_MS = 15000;

type TavilyClient = ReturnType<typeof tavily>;

function providerKeysPresent(): boolean {
  return Boolean(process.env.TAVILY_API_KEY) && Boolean(process.env.GOOGLE_GENERATIVE_AI_API_KEY);
}

/**
 * Run the full research pipeline: classify → search → extract → synthesize.
 * When provider keys are absent (or the live path fails), the mock engine
 * serves the same event shape so clients never need a special case.
 * Key presence is only ever logged server-side, never sent to the client.
 */
export async function* runResearchPipeline(
  question: string,
  context: ContextEnvelope,
  log: PipelineLogger = defaultLogger,
): AsyncGenerator<PipelineEvent> {
  if (!providerKeysPresent()) {
    log.info('[research] provider keys not configured — serving mock research over SSE');
    yield* mockPipeline(question, context);
    return;
  }
  try {
    yield { event: 'progress', data: { state: 'understanding context' } };
    const plan = routeQuery({ question, context });
    yield { event: 'progress', data: { state: 'checking data', detail: plan.reason } };

    yield { event: 'progress', data: { state: 'searching' } };
    const tvly = tavily({ apiKey: process.env.TAVILY_API_KEY as string });
    const hits = await searchSources(tvly, buildSearchQuery(question, context));
    if (hits.length === 0) throw new Error('no usable search results');

    const sources: Citation[] = hits.map((h, i) => ({
      id: `s${i + 1}`,
      url: h.url,
      title: h.title || h.url,
      quote: '',
    }));
    yield {
      event: 'sources',
      data: { sources: sources.map(({ id, url, title }) => ({ id, url, title })) },
    };

    yield { event: 'progress', data: { state: 'reading sources' } };
    const passages = await extractPassages(tvly, hits.map(h => h.url));
    for (const s of sources) {
      const first = passages.get(s.url)?.[0];
      if (first) s.quote = first.slice(0, 240);
    }

    yield { event: 'progress', data: { state: 'verifying' } };
    yield { event: 'progress', data: { state: 'building answer' } };

    const { partialObjectStream, object } = streamObject({
      model: google('gemini-2.5-flash'),
      schema: researchAnswerSchema,
      system: SYSTEM_PROMPT,
      prompt: buildPrompt(question, context, plan.reason, sources, passages),
    });
    for await (const partial of partialObjectStream) {
      yield { event: 'answer', data: { partial } };
    }
    const generated = await object;
    // Authoritative source list (extracted urls/titles/quotes); the model
    // supplies the analysis. Citation markers are normalized onto our ids.
    const answer = normalizeCitations({ ...generated, sources });
    yield { event: 'done', data: { answer, mocked: false } };
  } catch (err) {
    log.error('[research] live pipeline failed — falling back to mock', err);
    yield* mockPipeline(question, context);
  }
}

async function* mockPipeline(
  question: string,
  context: ContextEnvelope,
): AsyncGenerator<PipelineEvent> {
  for await (const ev of new MockResearchEngine().research(question, context)) {
    if (ev.answer) yield { event: 'done', data: { answer: ev.answer, mocked: true } };
    else yield { event: 'progress', data: { state: ev.state } };
  }
}

interface SearchHit {
  url: string;
  title: string;
}

async function searchSources(tvly: TavilyClient, query: string): Promise<SearchHit[]> {
  const res = await tvly.search(query, { search_depth: 'basic', max_results: 6 });
  return (res.results ?? [])
    .filter(r => typeof r.url === 'string' && isSafeUrl(r.url))
    .slice(0, MAX_SOURCES)
    .map(r => ({ url: r.url, title: r.title || r.url }));
}

async function extractPassages(
  tvly: TavilyClient,
  urls: string[],
): Promise<Map<string, string[]>> {
  const out = new Map<string, string[]>();
  const pending = new Set(urls);
  try {
    const res = await tvly.extract(urls, {
      extract_depth: 'basic',
      format: 'text',
      timeout: EXTRACT_TIMEOUT_MS / 1000,
    });
    for (const r of res.results ?? []) {
      if (r.rawContent && r.rawContent.trim()) {
        out.set(r.url, splitPassages(r.rawContent));
        pending.delete(r.url);
      }
    }
  } catch {
    // fall through to the Readability fallback for every url
  }
  for (const url of pending) {
    try {
      const passages = await readabilityExtract(url);
      if (passages.length > 0) out.set(url, passages);
    } catch {
      // skip sources we cannot read; the answer is built from what we have
    }
  }
  return out;
}

/** Fallback extractor: fetch the page and run Mozilla Readability over it. */
async function readabilityExtract(url: string): Promise<string[]> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), EXTRACT_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: {
        'User-Agent': 'SidelineBot/1.0 (+https://github.com/aweingarten33-bit/sports-arc)',
        Accept: 'text/html',
      },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    if (!(res.headers.get('content-type') ?? '').includes('html')) throw new Error('non-HTML');
    const dom = new JSDOM(await res.text(), { url });
    const text = new Readability(dom.window.document).parse()?.textContent?.trim() ?? '';
    if (!text) throw new Error('empty article');
    return splitPassages(text);
  } finally {
    clearTimeout(timer);
  }
}

function splitPassages(text: string): string[] {
  const out: string[] = [];
  let total = 0;
  for (const para of text.split(/\n\s*\n/)) {
    if (total >= 6000 || out.length >= 10) break;
    const chunk = para.replace(/\s+/g, ' ').trim().slice(0, 800);
    if (!chunk) continue;
    out.push(chunk);
    total += chunk.length;
  }
  return out;
}

function describeSeed(seed: ContextSeed): string {
  switch (seed.kind) {
    case 'player':
      return seed.name;
    case 'team':
      return seed.name;
    case 'article':
      return seed.title;
    case 'web-page':
      return seed.title ?? seed.url;
    case 'search-query':
      return seed.query;
    case 'player-prop':
      return `player prop ${seed.propId}`;
    case 'fantasy-matchup':
      return 'fantasy matchup';
    default:
      return seed.kind;
  }
}

function buildSearchQuery(question: string, context: ContextEnvelope): string {
  return `${question} ${describeSeed(context.seed)}`.trim().slice(0, 300);
}

function buildPrompt(
  question: string,
  context: ContextEnvelope,
  routeReason: string,
  sources: Citation[],
  passages: Map<string, string[]>,
): string {
  const sourceBlock = sources
    .map((s, i) => {
      const ps = passages.get(s.url) ?? [];
      const body = ps.slice(0, 4).join('\n---\n') || '(no extractable text)';
      return `[${i + 1}] ${s.title}\n${s.url}\n${body}`;
    })
    .join('\n\n');
  return [
    `Question: ${question}`,
    `On-screen context: ${describeSeed(context.seed)} (screen: ${context.screen}; ${routeReason}).`,
    '',
    'Sources:',
    sourceBlock,
  ].join('\n');
}

const SYSTEM_PROMPT = [
  'You are Sideline\'s research analyst: a sharp, concise sports analyst.',
  'Answer the user\'s sports question using ONLY the numbered sources provided.',
  'Rules:',
  '- Every factual claim in "claims" MUST carry inline [n] markers referencing the source list, e.g. "Brunson averaged 28.4 ppg over the last ten [1][2]". Also list the matching source ids in "citationIds".',
  '- "directAnswer" is 1-2 sentences, no inline markers needed (claims carry the citations).',
  '- Never invent stats, scores, injuries, or transactions. If sources disagree, say so in "conflicts". If something is unknown, say so in "uncertainty".',
  '- "bettingContext", when relevant, is analytical only: describe line movement and market context. Never recommend wagers.',
  '- Omit "companionLine". Keep "fantasyImpact" to one or two sentences when relevant.',
  '- "relatedQuestions": 2-4 natural follow-ups. "suggestedActions": 1-3 concrete next steps.',
  '- "stats": rows of label/value pairs for the key numbers. "timeline": chronological events when relevant, otherwise [].',
].join('\n');
