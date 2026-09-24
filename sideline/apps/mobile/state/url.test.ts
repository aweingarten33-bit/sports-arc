import {describe, expect, it} from 'vitest';
import {resolveInput} from './url';

describe('resolveInput', () => {
  it('keeps full https URLs untouched', () => {
    expect(resolveInput('https://example.com/a?b=1')).toBe('https://example.com/a?b=1');
  });

  it('keeps http URLs untouched', () => {
    expect(resolveInput('http://example.com')).toBe('http://example.com');
  });

  it('adds https to bare domains', () => {
    expect(resolveInput('example.com')).toBe('https://example.com');
    expect(resolveInput('  espn.com/nba  ')).toBe('https://espn.com/nba');
  });

  it('turns plain text into a search URL', () => {
    expect(resolveInput('Superman III movie')).toBe('https://duckduckgo.com/?q=Superman%20III%20movie');
  });

  it('treats single words without a dot as search', () => {
    expect(resolveInput('knicks')).toBe('https://duckduckgo.com/?q=knicks');
  });
});
