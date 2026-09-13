import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { HostNav } from './HostNav';

describe('HostNav', () => {
  it('links every host area and marks the current one', () => {
    render(<MemoryRouter initialEntries={['/host/share']}><HostNav /></MemoryRouter>);
    const nav = screen.getByRole('navigation', { name: 'Host pages' });
    expect(nav).toBeInTheDocument();
    for (const [name, href] of [['Play', '/host'], ['Questions', '/host/questions'], ['Share QR', '/host/share'], ['Checks', '/host/checks'], ['Guide', '/guide']]) {
      expect(screen.getByRole('link', { name })).toHaveAttribute('href', href);
    }
    expect(screen.getByRole('link', { name: 'Share QR' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: 'Play' })).not.toHaveAttribute('aria-current');
  });
});
