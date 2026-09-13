import type { OpenQuestion } from '@feud/shared';
import { QrImage } from '../../components/QrImage';
import { shortUrl } from '../../share/surveyLink';

type Props = Readonly<{ url: string | null; questions: readonly OpenQuestion[] }>;

const QR_PX = 640;
const MAX_LISTED = 6;

/** Full-screen takeover: a giant survey QR with the questions the audience can answer right now. */
export function SurveySpotlight({ url, questions }: Props) {
  const listed = questions.slice(0, MAX_LISTED);
  const extra = questions.length - listed.length;
  return (
    <section className="survey-spotlight" aria-label="Survey">
      <div className="spotlight-qr">
        <span className="spotlight-kicker">Scan to answer</span>
        {url ? <QrImage url={url} size={QR_PX} className="spotlight-code" /> : <div className="idle-qr-placeholder">Survey link not set yet</div>}
        {url ? <span className="spotlight-url">{shortUrl(url)}</span> : null}
      </div>
      <div className="spotlight-questions">
        <span className="spotlight-kicker">{questions.length === 0 ? 'Nothing open right now' : 'Open questions'}</span>
        <ol>
          {listed.map((q) => (
            <li key={q.id}>{q.prompt}</li>
          ))}
        </ol>
        {extra > 0 ? <span className="spotlight-more">…and {extra} more on your phone</span> : null}
        <span className="spotlight-foot">Your answers build the board for the next rounds</span>
      </div>
    </section>
  );
}
