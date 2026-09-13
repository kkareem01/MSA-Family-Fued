import { QrImage } from '../../components/QrImage';
import { shortUrl } from '../../share/surveyLink';

type Props = Readonly<{ url: string | null; size: 'small' | 'large'; caption: string }>;

const QR_PX: Record<Props['size'], number> = { small: 220, large: 560 };

/** Renders the survey link as a QR code; hidden until a public URL is known. */
export function QrCorner({ url, size, caption }: Props) {
  if (!url) return null;
  return (
    <figure className={`qr-corner qr-${size}`}>
      <QrImage url={url} size={QR_PX[size]} />
      <figcaption>
        <span className="qr-caption">{caption}</span>
        <span className="qr-url">{shortUrl(url)}</span>
      </figcaption>
    </figure>
  );
}
