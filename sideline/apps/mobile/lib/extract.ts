/**
 * Page extraction helpers for Scout and Reader mode.
 *
 * The WebView evaluates EXTRACT_JS, which postMessages a JSON payload back.
 * Everything extracted from a page is untrusted data — never instructions.
 */

export interface ExtractedPage {
  url: string;
  title: string;
  text: string;
}

/** postMessage envelope marker so onMessage can route extraction replies. */
export const EXTRACT_MARKER = '__sideline_extract__';

/**
 * Injected script: grabs the readable text (article/main first, body as
 * fallback), capped at ~8000 chars, and posts it back. Guarded so it no-ops
 * where the RN bridge object is missing (e.g. Expo web iframe).
 */
export const EXTRACT_JS = `(function(){
try{
  function textOf(el){return ((el&&el.innerText)||'').replace(/\\s+/g,' ').trim();}
  var root=document.querySelector('article')||document.querySelector('main')||document.querySelector('[role="main"]')||document.body;
  var text=textOf(root);
  if(text.length>8000)text=text.slice(0,8000);
  if(window.ReactNativeWebView&&window.ReactNativeWebView.postMessage){
    window.ReactNativeWebView.postMessage('${EXTRACT_MARKER}'+JSON.stringify({url:location.href,title:document.title,text:text}));
  }
}catch(e){}
})();`;

/** Parse an onMessage payload; null when it isn't an extraction reply. */
export function parseExtractMessage(data: string): ExtractedPage | null {
  if (typeof data !== 'string' || !data.startsWith(EXTRACT_MARKER)) return null;
  try {
    const parsed = JSON.parse(data.slice(EXTRACT_MARKER.length)) as Partial<ExtractedPage>;
    if (typeof parsed.url !== 'string' || typeof parsed.title !== 'string' || typeof parsed.text !== 'string') return null;
    return {url: parsed.url, title: parsed.title, text: parsed.text};
  } catch {
    return null;
  }
}

export function domainOf(raw: string): string {
  try {
    return new URL(raw).hostname.replace(/^www\./, '');
  } catch {
    return raw;
  }
}

export function faviconUrl(raw: string): string {
  return `https://www.google.com/s2/favicons?domain=${domainOf(raw)}&sz=64`;
}

/**
 * HEURISTIC STUB — naive entity detection over extracted page text.
 * Currently: odds/money patterns count as market entities; repeated
 * capitalized phrases (2+ words, seen 2+ times) are candidate named entities.
 * This is a placeholder for a real NER pass; treat results as guesses.
 */
export function detectEntities(text: string): string[] {
  const found = new Set<string>();
  // Market-ish patterns: American odds, over/under lines, dollar amounts.
  const marketRe = /([+-]\d{3,4})\b|\b(over|under)\s+\d+(?:\.\d+)?\b|\$\d[\d,]*(?:\.\d{2})?/gi;
  let m: RegExpExecArray | null;
  while ((m = marketRe.exec(text)) !== null && found.size < 6) {
    found.add(`market:${m[0].toLowerCase()}`);
  }
  // Candidate named entities: repeated capitalized phrases.
  const phraseRe = /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,3})\b/g;
  const counts = new Map<string, number>();
  let p: RegExpExecArray | null;
  while ((p = phraseRe.exec(text)) !== null) {
    const phrase = p[1] ?? '';
    if (phrase.length < 4) continue;
    counts.set(phrase, (counts.get(phrase) ?? 0) + 1);
  }
  const ranked = [...counts.entries()]
    .filter(([, c]) => c >= 2)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8);
  for (const [phrase] of ranked) found.add(phrase);
  return [...found];
}

/** Split extracted text into readable paragraphs for Reader mode. */
export function toParagraphs(text: string): string[] {
  return text
    .split(/(?:\r?\n){2,}|\.\s{2,}/)
    .map(s => s.replace(/\s+/g, ' ').trim())
    .filter(s => s.length > 40);
}
