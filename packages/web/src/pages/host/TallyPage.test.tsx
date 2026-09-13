import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { buildTally, normalizeAnswer, type QuestionSummary, type SurveyResponse } from '@feud/shared';
import { HostPinContext } from '../../auth/HostPinContext';

vi.mock('../../api/tally', () => ({ getTally: vi.fn(), mergeTally: vi.fn(), unmergeTally: vi.fn(), renameTally: vi.fn(), dropTally: vi.fn(), setTallyPoints: vi.fn(), finalizeTally: vi.fn() }));
vi.mock('../../api/questions', () => ({ listQuestions: vi.fn(), setQuestionStatus: vi.fn(), createQuestion: vi.fn(), deleteQuestion: vi.fn(), getBoard: vi.fn(), updateQuestion: vi.fn() }));

const tallyApi = await import('../../api/tally');
const { listQuestions, setQuestionStatus } = await import('../../api/questions');
const { TallyPage } = await import('./TallyPage');

const responses: SurveyResponse[] = ['Pizza', 'pizza', 'Burgers', 'Shawarma', 'Gum'].map((raw, i) => ({
  id: `r${i}`,
  questionId: 'q1',
  rawText: raw,
  normalizedText: normalizeAnswer(raw),
  submitterToken: `t${i}`,
  createdAt: i,
}));
const view = buildTally('q1', 'open', responses, [
  { key: 'shawarma', displayText: null, mergedIntoKey: 'burger', dropped: false, pointsOverride: null },
  { key: 'gum', displayText: null, mergedIntoKey: null, dropped: true, pointsOverride: null },
]);
const question: QuestionSummary = { id: 'q1', prompt: 'Name a food', status: 'open', sortOrder: 1, createdAt: 0, updatedAt: 0, openedAt: 1, closedAt: null, finalizedAt: null, playedAt: null, responseCount: 5, hasBoard: false };

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/host/tally/q1']}>
      <HostPinContext.Provider value={{ pin: 'pin', signOut: vi.fn() }}>
        <Routes>
          <Route path="/host/tally/:id" element={<TallyPage />} />
        </Routes>
      </HostPinContext.Provider>
    </MemoryRouter>,
  );
}

describe('TallyPage', () => {
  beforeEach(() => {
    vi.mocked(tallyApi.getTally).mockResolvedValue(view);
    vi.mocked(listQuestions).mockResolvedValue([question]);
    for (const fn of [tallyApi.mergeTally, tallyApi.unmergeTally, tallyApi.renameTally, tallyApi.dropTally, tallyApi.setTallyPoints]) {
      vi.mocked(fn).mockResolvedValue(view);
    }
    vi.mocked(tallyApi.finalizeTally).mockResolvedValue({ questionId: 'q1', prompt: 'Name a food', answers: [] });
    vi.mocked(setQuestionStatus).mockResolvedValue({ ...question, status: 'closed' });
  });

  it('shows grouped answers with merges and hidden entries', async () => {
    renderPage();
    expect(await screen.findByText('Name a food')).toBeInTheDocument();
    expect(screen.getByText(/5 responses · 4 counted/u)).toBeInTheDocument();
    expect(screen.getByLabelText('Display text for pizza')).toHaveValue('Pizza');
    expect(screen.getByText(/merged: shawarma/u)).toBeInTheDocument();
    expect(screen.getByText(/Hidden and merged answers \(2\)/u)).toBeInTheDocument();
    expect(screen.getByText(/Survey is live/u)).toBeInTheDocument();
  });

  it('renames, overrides points, merges, hides, restores and unmerges', async () => {
    renderPage();
    const pizza = await screen.findByLabelText('Display text for pizza');
    fireEvent.change(pizza, { target: { value: 'Pizza (any)' } });
    fireEvent.blur(pizza);
    await waitFor(() => expect(tallyApi.renameTally).toHaveBeenCalledWith('pin', 'q1', 'pizza', 'Pizza (any)'));

    const points = screen.getByLabelText('Points override for pizza');
    fireEvent.change(points, { target: { value: '45' } });
    fireEvent.blur(points);
    await waitFor(() => expect(tallyApi.setTallyPoints).toHaveBeenCalledWith('pin', 'q1', 'pizza', 45));

    fireEvent.change(screen.getByLabelText('Merge burger into'), { target: { value: 'pizza' } });
    await waitFor(() => expect(tallyApi.mergeTally).toHaveBeenCalledWith('pin', 'q1', 'burger', 'pizza'));

    fireEvent.click(screen.getAllByRole('button', { name: 'Hide' })[0]!);
    await waitFor(() => expect(tallyApi.dropTally).toHaveBeenCalledWith('pin', 'q1', 'burger', true));

    fireEvent.click(screen.getByRole('button', { name: 'Restore' }));
    await waitFor(() => expect(tallyApi.dropTally).toHaveBeenCalledWith('pin', 'q1', 'gum', false));
    fireEvent.click(screen.getByRole('button', { name: 'Unmerge' }));
    await waitFor(() => expect(tallyApi.unmergeTally).toHaveBeenCalledWith('pin', 'q1', 'shawarma'));
  });

  it('finalizes the top N and can close the survey', async () => {
    renderPage();
    await screen.findByText('Name a food');
    fireEvent.click(screen.getByRole('button', { name: 'Finalize board' }));
    await waitFor(() => expect(tallyApi.finalizeTally).toHaveBeenCalledWith('pin', 'q1', 2));
    fireEvent.click(screen.getByRole('button', { name: 'Close survey' }));
    await waitFor(() => expect(setQuestionStatus).toHaveBeenCalledWith('pin', 'q1', 'closed'));
  });
});
