import { useEffect, useState } from 'react';
import QRCode from 'qrcode';

const QR_COLORS = { dark: '#000000', light: '#ffffff' } as const;

/** Encodes a url as a PNG data url; null while encoding, when there is no url, or when encoding fails. */
export function useQrDataUrl(url: string | null, size: number): string | null {
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  useEffect(() => {
    if (!url) {
      setDataUrl(null);
      return undefined;
    }
    let cancelled = false;
    QRCode.toDataURL(url, { width: size, margin: 1, color: QR_COLORS })
      .then((result) => {
        if (!cancelled) setDataUrl(result);
      })
      .catch(() => setDataUrl(null));
    return () => {
      cancelled = true;
    };
  }, [url, size]);
  return dataUrl;
}

type Props = Readonly<{ url: string | null; size: number; className?: string }>;

export function QrImage({ url, size, className }: Props) {
  const dataUrl = useQrDataUrl(url, size);
  if (!url || !dataUrl) return null;
  return <img className={className} src={dataUrl} alt={`QR code for ${url}`} width={size} height={size} />;
}
