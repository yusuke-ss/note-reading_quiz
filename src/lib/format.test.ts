import { describe, expect, it } from 'vitest';
import { formatDuration } from './format';

describe('formatDuration', () => {
  it('formats zero as 00:00', () => {
    expect(formatDuration(0)).toBe('00:00');
  });

  it('formats sub-minute durations with a zero-padded minute', () => {
    expect(formatDuration(5000)).toBe('00:05');
  });

  it('pads seconds under 10', () => {
    expect(formatDuration(65000)).toBe('01:05');
  });

  it('formats multi-minute durations', () => {
    expect(formatDuration(599000)).toBe('09:59');
  });

  it('rounds to the nearest second', () => {
    expect(formatDuration(1499)).toBe('00:01');
    expect(formatDuration(1500)).toBe('00:02');
  });

  it('handles durations over an hour by rolling minutes past 60', () => {
    expect(formatDuration(3661000)).toBe('61:01');
  });
});
