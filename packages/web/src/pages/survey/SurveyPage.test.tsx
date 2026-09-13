import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../api/survey', () => ({ getOpenQuestions: vi.fn(), submitSurvey: vi.fn() }));

const { getOpenQuestions, submitSurvey } = await import('../../api/survey');
const { SurveyPage } = await import('./SurveyPage');

describe('SurveyPage', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.mocked(getOpenQuestions).mockResolvedValue([
      { id: 'q1', prompt: 'Name a fruit' },
      { id: 'q2', prompt: 'Name a city' },
    ]);
  });

  it('submits the filled answers and thanks the respondent when done', async () => {
    vi.mocked(submitSurvey).mockResolvedValue({ results: [{ questionId: 'q1', status: 'accepted' }] });
    render(<SurveyPage />);
    const submit = await screen.findByRole('button', { name: 'Send answer' });
    expect(submit).toBeDisabled();
    fireEvent.change(screen.getAllByPlaceholderText('Your answer')[0]!, { target: { value: 'Mango' } });
    expect(submit).toBeEnabled();
    fireEvent.click(submit);
    await waitFor(() => expect(submitSurvey).toHaveBeenCalledWith({ token: expect.any(String), answers: [{ questionId: 'q1', text: 'Mango' }] }));
    expect(await screen.findByText('Answer sent!')).toBeInTheDocument();
    expect(screen.getAllByPlaceholderText('Your answer')).toHaveLength(1);

    vi.mocked(submitSurvey).mockResolvedValue({ results: [{ questionId: 'q2', status: 'accepted' }] });
    fireEvent.change(screen.getByPlaceholderText('Your answer'), { target: { value: 'Cairo' } });
    fireEvent.click(screen.getByRole('button', { name: 'Send answer' }));
    expect(await screen.findByText('JazakAllah khair!')).toBeInTheDocument();
  });

  it('explains closed and invalid results', async () => {
    vi.mocked(submitSurvey).mockResolvedValue({ results: [{ questionId: 'q1', status: 'closed' }] });
    render(<SurveyPage />);
    fireEvent.change((await screen.findAllByPlaceholderText('Your answer'))[0]!, { target: { value: 'x' } });
    fireEvent.click(screen.getByRole('button', { name: 'Send answer' }));
    expect(await screen.findByText(/just closed/u)).toBeInTheDocument();
  });

  it('shows a waiting state with no open questions and an error when offline', async () => {
    vi.mocked(getOpenQuestions).mockResolvedValueOnce([]);
    render(<SurveyPage />);
    expect(await screen.findByText('Nothing open yet')).toBeInTheDocument();
    vi.mocked(getOpenQuestions).mockRejectedValueOnce(new Error('Could not reach the server'));
    render(<SurveyPage />);
    expect(await screen.findByRole('alert')).toHaveTextContent('Could not reach the server');
  });
});
