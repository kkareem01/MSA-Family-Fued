import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import type { QuestionSummary } from '@feud/shared';
import { SurveySteps } from './SurveySteps';

const q = (status: QuestionSummary['status'], hasBoard = false): QuestionSummary =>
  ({ id: status + String(hasBoard), prompt: 'p', status, sortOrder: 1, createdAt: 0, updatedAt: 0, openedAt: null, closedAt: null, finalizedAt: null, playedAt: null, responseCount: 0, hasBoard });

describe('SurveySteps', () => {
  it('walks through the workflow with live counts', () => {
    render(<MemoryRouter><SurveySteps questions={[q('draft'), q('open'), q('open'), q('finalized', true), q('played', true)]} /></MemoryRouter>);
    expect(screen.getByText('1 draft')).toBeInTheDocument();
    expect(screen.getByText('2 open')).toBeInTheDocument();
    expect(screen.getByText('1 board ready')).toBeInTheDocument();
    expect(screen.getByText('1 played')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Share QR/u })).toHaveAttribute('href', '/host/share');
  });
});
