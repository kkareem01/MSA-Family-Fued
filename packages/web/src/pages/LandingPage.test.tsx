import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { LandingPage } from './LandingPage';

describe('LandingPage', () => {
  it('walks a first-time host through set up, survey, test and play', () => {
    render(<MemoryRouter><LandingPage /></MemoryRouter>);
    expect(screen.getByRole('heading', { name: /Start here/u })).toBeInTheDocument();
    const cards = screen.getAllByRole('article');
    expect(cards.map((c) => c.querySelector('h3')?.textContent)).toEqual(['Set up', 'Survey', 'Test', 'Play']);
    expect(screen.getByRole('link', { name: /Run the checks/u })).toHaveAttribute('href', '/host/checks');
    expect(screen.getByRole('link', { name: /Full guide/u })).toHaveAttribute('href', '/guide');
    const nav = screen.getByRole('navigation', { name: 'Pages' });
    for (const href of ['/display', '/host', '/host/questions', '/host/share', '/survey', '/buzzer']) {
      expect(nav.querySelector(`a[href="${href}"]`)).toBeTruthy();
    }
  });
});
