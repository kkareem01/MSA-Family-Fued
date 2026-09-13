import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { QuestionSummary } from '@feud/shared';
import { HostPinContext } from '../../auth/HostPinContext';

vi.mock('../../api/questions', () => ({ listQuestions: vi.fn(), createQuestion: vi.fn(), deleteQuestion: vi.fn(), setQuestionStatus: vi.fn(), getBoard: vi.fn(), updateQuestion: vi.fn() }));

const { createQuestion, deleteQuestion, listQuestions, setQuestionStatus } = await import('../../api/questions');
const { QuestionsPage } = await import('./QuestionsPage');

const base: QuestionSummary = { id: 'q1', prompt: 'Name a fruit', status: 'draft', sortOrder: 1, createdAt: 0, updatedAt: 0, openedAt: null, closedAt: null, finalizedAt: null, playedAt: null, responseCount: 0, hasBoard: false };

function renderPage() {
  return render(
    <MemoryRouter>
      <HostPinContext.Provider value={{ pin: 'pin', signOut: vi.fn() }}>
        <QuestionsPage />
      </HostPinContext.Provider>
    </MemoryRouter>,
  );
}

describe('QuestionsPage', () => {
  beforeEach(() => {
    vi.mocked(listQuestions).mockResolvedValue([base, { ...base, id: 'q2', prompt: 'Name a city', status: 'open', responseCount: 4 }]);
    vi.mocked(createQuestion).mockResolvedValue({ ...base, id: 'q3' });
    vi.mocked(setQuestionStatus).mockResolvedValue({ ...base, status: 'open' });
    vi.mocked(deleteQuestion).mockResolvedValue(undefined);
  });

  it('lists questions with their status and moves them along', async () => {
    renderPage();
    expect(await screen.findByText('Name a fruit')).toBeInTheDocument();
    expect(screen.getByText('4 responses')).toBeInTheDocument();
    expect(screen.getByText(/1 open right now/u)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Open survey' }));
    await waitFor(() => expect(setQuestionStatus).toHaveBeenCalledWith('pin', 'q1', 'open'));
    expect(screen.getByRole('link', { name: 'Tally and build board' })).toHaveAttribute('href', '/host/tally/q2');
  });

  it('creates a question from the form', async () => {
    renderPage();
    await screen.findByText('Name a fruit');
    const input = screen.getByPlaceholderText(/Name something people forget/u);
    fireEvent.change(input, { target: { value: '  Name a drink ' } });
    fireEvent.click(screen.getByRole('button', { name: 'Add question' }));
    await waitFor(() => expect(createQuestion).toHaveBeenCalledWith('pin', 'Name a drink'));
    await waitFor(() => expect(input).toHaveValue(''));
  });

  it('deletes only after confirming', async () => {
    renderPage();
    await screen.findByText('Name a fruit');
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(deleteQuestion).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));
    fireEvent.click(screen.getByRole('button', { name: /^Delete "/u }));
    await waitFor(() => expect(deleteQuestion).toHaveBeenCalledWith('pin', 'q1'));
  });

  it('surfaces API errors as a toast', async () => {
    vi.mocked(listQuestions).mockRejectedValueOnce(new Error('Server down'));
    renderPage();
    expect(await screen.findByRole('alert')).toHaveTextContent('Server down');
  });
});
