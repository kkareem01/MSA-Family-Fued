import { describe, expect, it } from 'vitest';
import { GUIDE_SECTIONS, START_HERE, guideSection } from './guideContent';

const KNOWN_ROUTES = ['/', '/guide', '/display', '/host', '/host/questions', '/host/share', '/host/checks', '/survey', '/buzzer'];

describe('guide content', () => {
  it('has unique sections, each with an intro and steps', () => {
    const ids = GUIDE_SECTIONS.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const section of GUIDE_SECTIONS) {
      expect(section.title.length).toBeGreaterThan(0);
      expect(section.intro.length).toBeGreaterThan(0);
      expect(section.steps.length).toBeGreaterThan(0);
      for (const step of section.steps) {
        expect(step.title.length).toBeGreaterThan(0);
        expect(step.detail.length).toBeGreaterThan(0);
      }
    }
  });

  it('only links to pages that exist', () => {
    const links = [...GUIDE_SECTIONS.flatMap((s) => s.steps.map((st) => st.link?.to)), ...START_HERE.map((c) => c.to)].filter(Boolean);
    expect(links.length).toBeGreaterThan(0);
    for (const to of links) expect(KNOWN_ROUTES).toContain(to);
  });

  it('covers setup, survey, testing and play in the start-here cards, in that order', () => {
    expect(START_HERE.map((c) => c.section)).toEqual(['setup', 'survey', 'test', 'play']);
    for (const card of START_HERE) {
      expect(guideSection(card.section)).toBeDefined();
      expect(card.bullets.length).toBeGreaterThanOrEqual(2);
      expect(card.bullets.length).toBeLessThanOrEqual(4);
    }
  });

  it('looks up a section by id', () => {
    expect(guideSection('play')?.title).toMatch(/play/iu);
    expect(guideSection('nope')).toBeUndefined();
  });
});
