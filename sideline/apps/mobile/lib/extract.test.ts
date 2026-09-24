import {describe, expect, it} from 'vitest';
import {
  EXTRACT_MARKER,
  detectEntities,
  domainOf,
  faviconUrl,
  parseExtractMessage,
  toParagraphs,
} from './extract';

describe('parseExtractMessage', () => {
  it('parses a valid extraction payload', () => {
    const payload = `${EXTRACT_MARKER}${JSON.stringify({url: 'https://x.com', title: 'T', text: 'hello'})}`;
    expect(parseExtractMessage(payload)).toEqual({url: 'https://x.com', title: 'T', text: 'hello'});
  });
  it('rejects non-extraction messages', () => {
    expect(parseExtractMessage('hello')).toBeNull();
    expect(parseExtractMessage(`${EXTRACT_MARKER}{bad json`)).toBeNull();
    expect(parseExtractMessage(`${EXTRACT_MARKER}${JSON.stringify({url: 1})}`)).toBeNull();
  });
});

describe('domainOf / faviconUrl', () => {
  it('strips www', () => {
    expect(domainOf('https://www.espn.com/nba')).toBe('espn.com');
    expect(faviconUrl('https://www.espn.com')).toContain('domain=espn.com');
  });
});

describe('detectEntities (heuristic)', () => {
  it('finds odds and repeated capitalized phrases', () => {
    const text =
      'Jalen Brunson scored 30. Jalen Brunson is great. The line is -110 and the total is over 224.5 for $50.';
    const entities = detectEntities(text);
    expect(entities).toContain('Jalen Brunson');
    expect(entities.some(e => e.includes('-110') || e.includes('over 224.5'))).toBe(true);
  });
  it('ignores one-off capitalized words', () => {
    expect(detectEntities('Hello world, this is a Test of nothing')).not.toContain('Hello');
  });
});

describe('toParagraphs', () => {
  it('splits and drops short fragments', () => {
    const paras = toParagraphs('Short.\n\nThis is a much longer paragraph with plenty of words in it.');
    expect(paras).toHaveLength(1);
  });
});
