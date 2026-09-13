import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import type { PublicSettings, Spotlight } from '@feud/shared';
import { getSettings, setSpotlight } from '../../api/settings';
import { describeError } from '../../api/client';
import { useHostSession } from '../../auth/HostPinContext';
import { QrImage } from '../../components/QrImage';
import { Toasts, useToasts } from '../../components/Toast';
import { useOpenQuestions } from '../../hooks/useOpenQuestions';
import { surveyLinkFor } from '../../share/surveyLink';
import { copyText } from './copyText';
import { HostChrome } from './HostChrome';
import './host.css';

const QR_PX = 320;

const HOW_IT_WORKS = [
  'They scan the code (or open the link) on their phone.',
  'They type one answer per question and tap Send.',
  'They keep the page open: new questions appear on their own.',
] as const;

function openCountLine(count: number): string {
  return count === 1 ? '1 question open' : `${count} questions open`;
}

function LinkWarning({ isPublic }: { isPublic: boolean }) {
  if (isPublic) return null;
  return (
    <div className="share-warning">
      <strong>This is the same-wifi link.</strong> Phones on mobile data cannot open it. Run <code>npm run event</code> on the laptop to get a public link
      automatically, or paste one under Settings on the host panel.
    </div>
  );
}

function ProjectorToggle({ spotlight, busy, onChange }: { spotlight: Spotlight; busy: boolean; onChange: (next: Spotlight) => void }) {
  const showing = spotlight === 'survey';
  return (
    <div className="stack">
      <button type="button" className={`btn btn-big ${showing ? 'btn-ghost' : 'btn-gold'}`} disabled={busy} onClick={() => onChange(showing ? null : 'survey')}>
        {showing ? 'Hide from projector' : 'Show on projector'}
      </button>
      <p className="muted small">
        {showing
          ? 'The projector is showing the QR code and the open questions over the game.'
          : 'Puts a giant QR code and the open questions on the projector, on top of whatever is showing.'}
      </p>
    </div>
  );
}

/** One place to find the survey QR code, share it, and put it on the projector. */
export function SharePage() {
  const { pin } = useHostSession();
  const { toasts, notify } = useToasts();
  const [settings, setSettings] = useState<PublicSettings | null>(null);
  const [busy, setBusy] = useState(false);
  const openQuestions = useOpenQuestions();

  const refresh = useCallback(async () => {
    try {
      setSettings(await getSettings(pin));
    } catch (error) {
      notify(describeError(error), 'error');
    }
  }, [pin, notify]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const changeSpotlight = async (next: Spotlight) => {
    setBusy(true);
    try {
      setSettings(await setSpotlight(pin, next));
      notify(next ? 'The projector now shows the QR code.' : 'Projector back to the game.', 'ok');
    } catch (error) {
      notify(describeError(error), 'error');
    } finally {
      setBusy(false);
    }
  };

  const link = settings ? surveyLinkFor(settings.publicUrl, settings.lanUrl) : null;

  return (
    <main className="page page-narrow host-page stack stack-lg">
      <HostChrome title="Share the survey QR" back={{ to: '/host', label: 'Host panel' }}>
        <p className="muted small">The audience scans this to answer the open questions. Show it on the projector, print it, or send the link.</p>
      </HostChrome>

      {link ? (
        <section className="panel stack share-card">
          <QrImage url={link.url} size={QR_PX} className="qr-image" />
          <p className="share-url">{link.url}</p>
          <div className="row">
            <button type="button" className="btn btn-primary" onClick={() => void copyText(link.url).then((ok) => notify(ok ? 'Link copied' : 'Copy failed', ok ? 'ok' : 'error'))}>
              Copy link
            </button>
            <a className="btn" href={link.url} target="_blank" rel="noreferrer">Open survey</a>
            <button type="button" className="btn btn-ghost" onClick={() => window.print()}>Print this page</button>
          </div>
          <LinkWarning isPublic={link.isPublic} />
        </section>
      ) : (
        <p className="muted">Loading…</p>
      )}

      {settings ? (
        <section className="panel stack">
          <h2>Projector</h2>
          <ProjectorToggle spotlight={settings.spotlight} busy={busy} onChange={(next) => void changeSpotlight(next)} />
        </section>
      ) : null}

      <section className="panel stack">
        <h2>{openQuestions ? openCountLine(openQuestions.length) : 'Open questions'}</h2>
        {openQuestions?.length === 0 ? (
          <p className="muted small">
            Nothing is open, so the audience sees “Nothing open yet”. <Link to="/host/questions">Open a question</Link> first.
          </p>
        ) : null}
        <ul className="share-questions">
          {openQuestions?.map((q) => <li key={q.id}>{q.prompt}</li>)}
        </ul>
      </section>

      <section className="panel stack">
        <h2>How the audience answers</h2>
        <ol className="share-steps">
          {HOW_IT_WORKS.map((step) => <li key={step}>{step}</li>)}
        </ol>
      </section>
      <Toasts toasts={toasts} />
    </main>
  );
}
