import { describe, expect, it } from 'vitest';
import { parseSseFrames, parseServerEvent } from './sse';

describe('parseSseFrames', () => {
  it('parses multiple frames', () => {
    const raw = 'event: progress\ndata: {"state":"searching"}\n\nevent: done\ndata: {"answer":{},"mocked":true}\n\n';
    const { frames, rest } = parseSseFrames(raw);
    expect(frames).toHaveLength(2);
    expect(frames[0]).toEqual({ event: 'progress', data: '{"state":"searching"}' });
    expect(frames[1]).toEqual({ event: 'done', data: '{"answer":{},"mocked":true}' });
    expect(rest).toBe('');
  });

  it('holds an incomplete trailing frame in rest', () => {
    const { frames, rest } = parseSseFrames('event: progress\ndata: {"state":"sea');
    expect(frames).toHaveLength(0);
    expect(rest).toBe('event: progress\ndata: {"state":"sea');
  });

  it('reassembles a frame split across chunks', () => {
    const first = parseSseFrames('event: progress\ndata: {"state":"');
    const combined = first.rest + 'searching"}\n\n';
    const { frames, rest } = parseSseFrames(combined);
    expect(frames).toEqual([{ event: 'progress', data: '{"state":"searching"}' }]);
    expect(rest).toBe('');
  });

  it('joins multi-line data payloads', () => {
    const raw = 'event: answer\ndata: {"partial":\ndata: {"a":1}}\n\n';
    const { frames } = parseSseFrames(raw);
    expect(frames[0]?.data).toBe('{"partial":\n{"a":1}}');
  });

  it('ignores comment lines and frames without an event', () => {
    const raw = ': keep-alive\n\ndata: {"x":1}\n\n';
    const { frames } = parseSseFrames(raw);
    expect(frames).toHaveLength(0);
  });
});

describe('parseServerEvent', () => {
  it('parses known event types', () => {
    expect(parseServerEvent({ event: 'progress', data: '{"state":"searching"}' })).toEqual({
      event: 'progress',
      data: { state: 'searching' },
    });
    expect(parseServerEvent({ event: 'error', data: '{"message":"boom"}' })).toEqual({
      event: 'error',
      data: { message: 'boom' },
    });
  });

  it('returns null for malformed JSON, non-objects, and unknown events', () => {
    expect(parseServerEvent({ event: 'progress', data: 'not json' })).toBeNull();
    expect(parseServerEvent({ event: 'progress', data: '"just a string"' })).toBeNull();
    expect(parseServerEvent({ event: 'bogus', data: '{"a":1}' })).toBeNull();
  });
});
