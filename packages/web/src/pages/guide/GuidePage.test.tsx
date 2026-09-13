import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { GUIDE_SECTIONS } from '../../guide/guideContent';
import { GuidePage } from './GuidePage';

describe('GuidePage', () => {
  it('renders a table of contents and every section', () => {
    render(<MemoryRouter><GuidePage /></MemoryRouter>);
    expect(screen.getByRole('navigation', { name: 'Guide sections' })).toBeInTheDocument();
    for (const section of GUIDE_SECTIONS) {
      expect(screen.getByRole('heading', { name: section.title, level: 2 })).toHaveAttribute('id', section.id);
      expect(screen.getByRole('link', { name: section.title })).toHaveAttribute('href', `#${section.id}`);
    }
    expect(screen.getByRole('link', { name: /Back to the start/u })).toHaveAttribute('href', '/');
  });
});
