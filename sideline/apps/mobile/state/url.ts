// Normalizes raw address-bar input into a loadable URL.
// Full URLs pass through, bare domains get https://, everything else
// becomes a web search. Pure function — covered by url.test.ts.
export function resolveInput(raw: string): string {
  const t = raw.trim();
  if (/^https?:\/\//i.test(t)) return t;
  if (/^[^\s]+\.[^\s]{2,}$/.test(t)) return `https://${t}`;
  return `https://duckduckgo.com/?q=${encodeURIComponent(t)}`;
}
