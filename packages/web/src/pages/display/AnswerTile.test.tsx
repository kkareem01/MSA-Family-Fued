import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { AnswerTile, textSizeFor } from './AnswerTile';

describe('AnswerTile', () => {
  it('shows only the number while hidden', () => {
    const { container } = render(<AnswerTile answer={{ id: 'a', rank: 3, text: '', points: 0, revealed: false, scored: false }} />);
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(container.firstChild).not.toHaveClass('revealed');
    expect(container.querySelector('.tile-text')?.textContent).toBe('');
  });

  it('flips to show text and points once revealed', () => {
    const { container } = render(<AnswerTile answer={{ id: 'a', rank: 1, text: 'Pizza', points: 38, revealed: true, scored: true }} />);
    expect(container.firstChild).toHaveClass('revealed');
    expect(screen.getByText('Pizza')).toBeInTheDocument();
    expect(screen.getByText('38')).toBeInTheDocument();
  });

  it('steps the text size down for long answers', () => {
    expect(textSizeFor('Pizza')).toBe('lg');
    expect(textSizeFor('Chicken shawarma')).toBe('md');
    expect(textSizeFor('Late night biryani from the halal cart')).toBe('sm');
  });

  it('renders an empty slot for missing ranks', () => {
    const { container } = render(<AnswerTile answer={null} />);
    expect(container.firstChild).toHaveClass('tile-empty');
  });
});
