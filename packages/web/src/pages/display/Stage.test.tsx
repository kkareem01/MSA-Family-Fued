import { render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Stage } from './Stage';

describe('Stage', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('scales to fit the window and centers itself with a translate, not grid alignment', () => {
    vi.stubGlobal('innerWidth', 1440);
    vi.stubGlobal('innerHeight', 780);
    const { container } = render(<Stage><span>content</span></Stage>);
    const stage = container.querySelector<HTMLElement>('.stage')!;
    expect(stage.style.transform).toBe(`translate(-50%, -50%) scale(${780 / 1080})`);
    expect(stage.style.width).toBe('1920px');
  });
});
