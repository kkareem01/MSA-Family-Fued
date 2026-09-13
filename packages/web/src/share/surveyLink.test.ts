import { describe, expect, it } from 'vitest';
import { buzzerLinkFor, surveyLinkFor } from './surveyLink';

describe('surveyLinkFor', () => {
  it('prefers the public link and falls back to the same-wifi one', () => {
    expect(surveyLinkFor('https://abc.trycloudflare.com', 'http://10.0.0.2:3000')).toEqual({ url: 'https://abc.trycloudflare.com/survey', isPublic: true });
    expect(surveyLinkFor(null, 'http://10.0.0.2:3000')).toEqual({ url: 'http://10.0.0.2:3000/survey', isPublic: false });
  });
});

describe('buzzerLinkFor', () => {
  it('builds a deep link with the team and its code', () => {
    expect(buzzerLinkFor(null, 'http://10.0.0.2:3000', 'B', 'WXYZ')).toBe('http://10.0.0.2:3000/buzzer?team=B&code=WXYZ');
  });
});
