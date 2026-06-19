import { describe, it, expect } from 'vitest';
import { buildSearchText } from './searchText';

describe('buildSearchText', () => {
  it('joins event type and provider event id', () => {
    expect(buildSearchText('payment.succeeded', 'evt_123')).toBe('payment.succeeded evt_123');
  });

  it('appends a capped slice of the inline body', () => {
    const body = 'x'.repeat(5000);
    const result = buildSearchText('a', 'b', body);
    expect(result.startsWith('a b ')).toBe(true);
    // metadata ("a b ") + 1024 body chars
    expect(result.length).toBe('a b '.length + 1024);
  });

  it('omits the body segment when there is no inline body', () => {
    expect(buildSearchText('a', 'b', undefined)).toBe('a b');
    expect(buildSearchText('a', 'b', '')).toBe('a b');
  });
});
