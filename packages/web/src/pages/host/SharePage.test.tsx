import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { PublicSettings } from '@feud/shared';
import { HostPinContext } from '../../auth/HostPinContext';

vi.mock('qrcode', () => ({ default: { toDataURL: vi.fn(() => Promise.resolve('data:image/png;base64,QQ==')) } }));
vi.mock('../../api/settings', () => ({ getSettings: vi.fn(), setPublicUrl: vi.fn(), rotateBuzzerCodes: vi.fn(), setSpotlight: vi.fn() }));
vi.mock('../../api/survey', () => ({ getOpenQuestions: vi.fn(), submitSurvey: vi.fn() }));

const { getSettings, setSpotlight } = await import('../../api/settings');
const { getOpenQuestions } = await import('../../api/survey');
const { SharePage } = await import('./SharePage');

const settings: PublicSettings = { publicUrl: 'https://abc.trycloudflare.com', lanUrl: 'http://192.168.1.5:3000', buzzerCodes: { A: 'ABCD', B: 'EFGH' }, spotlight: null };

function renderPage() {
  return render(
    <MemoryRouter>
      <HostPinContext.Provider value={{ pin: 'pin', signOut: vi.fn() }}>
        <SharePage />
      </HostPinContext.Provider>
    </MemoryRouter>,
  );
}

describe('SharePage', () => {
  beforeEach(() => {
    vi.mocked(getSettings).mockResolvedValue(settings);
    vi.mocked(setSpotlight).mockImplementation((_pin, spotlight) => Promise.resolve({ ...settings, spotlight }));
    vi.mocked(getOpenQuestions).mockResolvedValue([{ id: 'q1', prompt: 'Name a fruit' }]);
  });
  afterEach(() => vi.restoreAllMocks());

  it('shows the QR, the link, the open questions and the projector toggle', async () => {
    renderPage();
    expect(await screen.findByAltText('QR code for https://abc.trycloudflare.com/survey')).toBeInTheDocument();
    expect(screen.getByText('https://abc.trycloudflare.com/survey')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Open survey' })).toHaveAttribute('href', 'https://abc.trycloudflare.com/survey');
    expect(await screen.findByText('Name a fruit')).toBeInTheDocument();
    expect(screen.getByText(/1 question open/u)).toBeInTheDocument();
    expect(screen.queryByText(/same-wifi/iu)).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Show on projector' }));
    await waitFor(() => expect(setSpotlight).toHaveBeenCalledWith('pin', 'survey'));
    expect(await screen.findByRole('button', { name: 'Hide from projector' })).toBeInTheDocument();
    expect(screen.getByText(/projector is showing the QR code/u)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Hide from projector' }));
    await waitFor(() => expect(setSpotlight).toHaveBeenCalledWith('pin', null));
  });

  it('copies and prints', async () => {
    const writeText = vi.fn(() => Promise.resolve());
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
    const print = vi.spyOn(window, 'print').mockImplementation(() => undefined);
    renderPage();
    await screen.findByAltText(/QR code/u);
    fireEvent.click(screen.getByRole('button', { name: 'Copy link' }));
    await waitFor(() => expect(writeText).toHaveBeenCalledWith('https://abc.trycloudflare.com/survey'));
    expect(await screen.findByText('Link copied')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Print/u }));
    expect(print).toHaveBeenCalled();
  });

  it('warns when only the same-wifi link exists and when nothing is open', async () => {
    vi.mocked(getSettings).mockResolvedValue({ ...settings, publicUrl: null });
    vi.mocked(getOpenQuestions).mockResolvedValue([]);
    renderPage();
    expect(await screen.findByAltText('QR code for http://192.168.1.5:3000/survey')).toBeInTheDocument();
    expect(screen.getByText(/same-wifi/iu)).toBeInTheDocument();
    expect(screen.getByText(/npm run event/u)).toBeInTheDocument();
    expect(await screen.findByText(/Nothing is open/u)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Open a question/u })).toHaveAttribute('href', '/host/questions');
  });

  it('surfaces errors as a toast', async () => {
    vi.mocked(getSettings).mockRejectedValue(new Error('Server down'));
    renderPage();
    expect(await screen.findByRole('alert')).toHaveTextContent('Server down');
  });
});
