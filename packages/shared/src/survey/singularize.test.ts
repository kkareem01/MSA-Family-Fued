import { describe, expect, it } from 'vitest';
import { singularize } from './singularize';

describe('singularize', () => {
  it('leaves short words alone', () => {
    expect(singularize('yes')).toBe('yes');
    expect(singularize('gas')).toBe('gas');
  });

  it('respects the exception list', () => {
    for (const word of ['news', 'jeans', 'glasses', 'series', 'species', 'chess', 'tennis']) {
      expect(singularize(word)).toBe(word);
    }
  });

  it('maps ies and ie endings to y so both spellings group together', () => {
    expect(singularize('fries')).toBe('fry');
    expect(singularize('cookies')).toBe(singularize('cookie'));
    expect(singularize('movies')).toBe(singularize('movie'));
  });

  it('handles es endings after sibilants', () => {
    expect(singularize('classes')).toBe('class');
    expect(singularize('dishes')).toBe('dish');
    expect(singularize('churches')).toBe('church');
    expect(singularize('boxes')).toBe('box');
  });

  it('keeps ss, us and is endings', () => {
    expect(singularize('class')).toBe('class');
    expect(singularize('campus')).toBe('campus');
    expect(singularize('tennis')).toBe('tennis');
    expect(singularize('this')).toBe('this');
  });

  it('drops a plain trailing s', () => {
    expect(singularize('burgers')).toBe('burger');
    expect(singularize('pizzas')).toBe('pizza');
    expect(singularize('cats')).toBe('cats'.slice(0, -1));
  });
});
