import { describe, expect, it, vi } from 'vitest';
import { debounce, toTitleCase } from '../../src/titleCase.js';

describe('toTitleCase', () => {
  it('converts a simple sentence', () => {
    expect(toTitleCase('hello world')).toBe('Hello World');
  });

  it('handles hyphenated and apostrophe words', () => {
    expect(toTitleCase("well-known o'clock"))
      .toBe("Well-Known O'clock");
  });

  it('keeps leading punctuation and accents', () => {
    expect(toTitleCase('“mañana” said the señor.')).toBe('“Mañana” Said The Señor.');
  });
});

describe('debounce', () => {
  it('delays execution until wait time has passed', () => {
    vi.useFakeTimers();
    try {
      const fn = vi.fn();
      const wrapped = debounce(fn, 100);

      wrapped();
      vi.advanceTimersByTime(80);
      expect(fn).not.toHaveBeenCalled();

      vi.advanceTimersByTime(20);
      expect(fn).toHaveBeenCalledTimes(1);
    } finally {
      vi.useRealTimers();
    }
  });

  it('resets timer when called repeatedly', () => {
    vi.useFakeTimers();
    try {
      const fn = vi.fn();
      const wrapped = debounce(fn, 100);

      wrapped();
      vi.advanceTimersByTime(90);
      wrapped();
      vi.advanceTimersByTime(90);
      expect(fn).not.toHaveBeenCalled();

      vi.advanceTimersByTime(10);
      expect(fn).toHaveBeenCalledTimes(1);
    } finally {
      vi.useRealTimers();
    }
  });
});
