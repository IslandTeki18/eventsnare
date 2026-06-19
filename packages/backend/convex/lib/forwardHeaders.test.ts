import { describe, it, expect } from 'vitest';
import { isReservedForwardHeader, validateForwardHeaders } from './forwardHeaders';

describe('isReservedForwardHeader', () => {
  it('flags Eventsnare-controlled and transport headers, case-insensitively', () => {
    expect(isReservedForwardHeader('X-Eventsnare-Event-Id')).toBe(true);
    expect(isReservedForwardHeader('x-eventsnare-signature')).toBe(true);
    expect(isReservedForwardHeader('Content-Type')).toBe(true);
    expect(isReservedForwardHeader('content-length')).toBe(true);
    expect(isReservedForwardHeader('HOST')).toBe(true);
  });

  it('allows ordinary headers', () => {
    expect(isReservedForwardHeader('Authorization')).toBe(false);
    expect(isReservedForwardHeader('X-Api-Key')).toBe(false);
  });
});

describe('validateForwardHeaders', () => {
  it('accepts valid custom headers', () => {
    expect(() =>
      validateForwardHeaders({ Authorization: 'Bearer abc', 'X-Api-Key': 'k' }),
    ).not.toThrow();
  });

  it('rejects reserved headers', () => {
    expect(() => validateForwardHeaders({ 'X-Eventsnare-Source': 'x' })).toThrow(/reserved/);
    expect(() => validateForwardHeaders({ 'Content-Type': 'text/plain' })).toThrow(/reserved/);
  });

  it('rejects empty and malformed header names', () => {
    expect(() => validateForwardHeaders({ '   ': 'v' })).toThrow(/empty/);
    expect(() => validateForwardHeaders({ 'bad header': 'v' })).toThrow(/Invalid header name/);
  });

  it('accepts an empty map (clears headers)', () => {
    expect(() => validateForwardHeaders({})).not.toThrow();
  });
});
