import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import QRCode from 'qrcode';

vi.mock('qrcode', () => ({ default: { toDataURL: vi.fn(() => Promise.resolve('data:image/png;base64,QQ==')) } }));

const { QrImage } = await import('./QrImage');

describe('QrImage', () => {
  it('renders the code for a url at the requested size', async () => {
    render(<QrImage url="https://x.example/survey" size={300} />);
    const img = await screen.findByAltText('QR code for https://x.example/survey');
    expect(img).toHaveAttribute('width', '300');
    expect(vi.mocked(QRCode.toDataURL)).toHaveBeenCalledWith('https://x.example/survey', expect.objectContaining({ width: 300 }));
  });

  it('renders nothing without a url or when encoding fails', async () => {
    const { container } = render(<QrImage url={null} size={100} />);
    expect(container).toBeEmptyDOMElement();
    vi.mocked(QRCode.toDataURL).mockRejectedValueOnce(new Error('too long'));
    const failed = render(<QrImage url="https://x.example/bad" size={100} />);
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(failed.container).toBeEmptyDOMElement();
  });
});
