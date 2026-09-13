import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('qrcode', () => ({ default: { toDataURL: vi.fn(() => Promise.resolve('data:image/png;base64,QQ==')) } }));

const { SurveySpotlight } = await import('./SurveySpotlight');

const questions = Array.from({ length: 8 }, (_, i) => ({ id: `q${i}`, prompt: `Question ${i + 1}` }));

describe('SurveySpotlight', () => {
  it('shows a giant QR, the link and the open questions', async () => {
    render(<SurveySpotlight url="https://abc.trycloudflare.com/survey" questions={questions} />);
    expect(await screen.findByAltText('QR code for https://abc.trycloudflare.com/survey')).toBeInTheDocument();
    expect(screen.getByText('abc.trycloudflare.com/survey')).toBeInTheDocument();
    expect(screen.getByText('Question 1')).toBeInTheDocument();
    expect(screen.getByText('Question 6')).toBeInTheDocument();
    expect(screen.queryByText('Question 7')).not.toBeInTheDocument();
    expect(screen.getByText(/and 2 more/u)).toBeInTheDocument();
  });

  it('says so when nothing is open or no link exists', () => {
    render(<SurveySpotlight url={null} questions={[]} />);
    expect(screen.getByText(/Nothing open right now/u)).toBeInTheDocument();
    expect(screen.getByText(/Survey link not set yet/u)).toBeInTheDocument();
  });
});
