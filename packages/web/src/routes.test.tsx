import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { AppRoutes } from './routes';

describe('AppRoutes', () => {
  it('links every page from the landing page', () => {
    render(<MemoryRouter initialEntries={['/']}><AppRoutes /></MemoryRouter>);
    expect(screen.getByRole('navigation', { name: 'Pages' })).toBeInTheDocument();
    for (const href of ['/display', '/host', '/host/questions', '/survey', '/buzzer']) {
      expect(document.querySelector(`a[href="${href}"]`)).toBeTruthy();
    }
  });

  it('shows a not-found page for unknown routes', () => {
    render(<MemoryRouter initialEntries={['/nope']}><AppRoutes /></MemoryRouter>);
    expect(screen.getByText('Page not found')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Back to the start' })).toHaveAttribute('href', '/');
  });
});
