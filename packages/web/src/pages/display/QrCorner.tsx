import { useEffect, useState } from 'react';
import QRCode from 'qrcode';

type Props = Readonly<{ url: string | null; size: 'small' | 'large'; caption: string }>;

const QR_PX: Record<Props['size'], number> = { small: 220, large: 560 };

/** Renders the survey link as a QR code; hidden until a public URL is known. */
export function QrCorner({ url, size, caption }: Props) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  useEffect(() => {
    if (!url) {
      setDataUrl(null);
      return undefined;
    }
    let cancelled = false;
    QRCode.toDataURL(url, { width: QR_PX[size], margin: 1, color: { dark: '#061443', light: '#ffffff' } })
      .then((result) => {
        if (!cancelled) setDataUrl(result);
      })
      .catch(() => setDataUrl(null));
    return () => {
      cancelled = true;
    };
  }, [url, size]);
  if (!url || !dataUrl) return null;
  const shortUrl = url.replace(/^https?:\/\//u, '');
  return (
    <figure className={`qr-corner qr-${size}`}>
      <img src={dataUrl} alt={`QR code for ${url}`} width={QR_PX[size]} height={QR_PX[size]} />
      <figcaption>
        <span className="qr-caption">{caption}</span>
        <span className="qr-url">{shortUrl}</span>
      </figcaption>
    </figure>
  );
}
