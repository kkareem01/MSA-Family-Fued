import { describe, expect, it } from 'vitest';
import { normalizeAnswer } from './normalize';

describe('normalizeAnswer', () => {
  it('trims, lowercases and collapses whitespace', () => {
    expect(normalizeAnswer('  Pizza   Slice ')).toBe('pizza slice');
  });

  it('applies NFKC so full-width text matches ASCII', () => {
    expect(normalizeAnswer('ｐｉｚｚａ')).toBe('pizza');
  });

  it('deletes apostrophes, including curly ones', () => {
    expect(normalizeAnswer("Don't know")).toBe('dont know');
    expect(normalizeAnswer('Don’t know')).toBe('dont know');
  });

  it('turns punctuation into spaces', () => {
    expect(normalizeAnswer('fries, fries!')).toBe('fry fry');
    expect(normalizeAnswer('mac-n-cheese')).toBe('mac n cheese');
  });

  it('strips one leading article only when more words remain', () => {
    expect(normalizeAnswer('The beach')).toBe('beach');
    expect(normalizeAnswer('an apple')).toBe('apple');
    expect(normalizeAnswer('a')).toBe('a');
    expect(normalizeAnswer('the')).toBe('the');
    expect(normalizeAnswer('the the beach')).toBe('the beach');
  });

  it('singularizes each token', () => {
    expect(normalizeAnswer('Burgers')).toBe('burger');
    expect(normalizeAnswer('Two boxes')).toBe('two box');
  });

  it('keeps non-Latin letters and digits', () => {
    expect(normalizeAnswer('Salām 2x')).toBe('salām 2x');
    expect(normalizeAnswer('شاورما')).toBe('شاورما');
  });

  it('returns an empty string when nothing survives', () => {
    expect(normalizeAnswer('!!! ...')).toBe('');
    expect(normalizeAnswer('')).toBe('');
  });
});
