import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { TEAM_IDS, type HealthInfo, type PublicSettings, type QuestionSummary } from '@feud/shared';
import { downloadBackup } from '../../api/backup';
import { getHealth } from '../../api/health';
import { listQuestions } from '../../api/questions';
import { getSettings } from '../../api/settings';
import { describeError } from '../../api/client';
import { useHostSession } from '../../auth/HostPinContext';
import { Toasts, useToasts } from '../../components/Toast';
import { SURVEY_POLL_INTERVAL_MS } from '../../config';
import { GameSocketProvider, useGameSocketContext } from '../../socket/GameSocketContext';
import { useSoundEngine } from '../../sound/useSoundEngine';
import { buzzerLinkFor } from '../../share/surveyLink';
import { buildChecks, checkSummary, type CheckFix, type CheckItem } from './checks';
import { copyText } from './copyText';
import { HostChrome } from './HostChrome';
import './host.css';

function FixLink({ fix }: { fix: CheckFix }) {
  if (fix.external) {
    return <a className="btn btn-ghost btn-inline" href={fix.to} target="_blank" rel="noreferrer">{fix.label} ↗</a>;
  }
  return <Link className="btn btn-ghost btn-inline" to={fix.to}>{fix.label}</Link>;
}

function BuzzerLinks({ settings, notify }: { settings: PublicSettings | null; notify: (m: string) => void }) {
  if (!settings) return null;
  return (
    <ul className="check-links">
      {TEAM_IDS.map((team) => {
        const link = buzzerLinkFor(settings.publicUrl, settings.lanUrl, team, settings.buzzerCodes[team]);
        return (
          <li key={team}>
            Team {team}: <span className="code">{settings.buzzerCodes[team]}</span>{' '}
            <button type="button" className="btn btn-ghost btn-inline" onClick={() => void copyText(link).then((ok) => notify(ok ? 'Link copied' : 'Copy failed'))}>Copy link</button>
          </li>
        );
      })}
    </ul>
  );
}

type RowProps = Readonly<{ check: CheckItem; extra?: React.ReactNode }>;

function CheckRow({ check, extra }: RowProps) {
  return (
    <li className={`check-row ${check.ok ? 'ok' : 'todo'}`}>
      <span className={`badge ${check.ok ? 'badge-ok' : 'badge-warn'}`} aria-label={check.ok ? 'Pass' : 'To do'}>{check.ok ? '✓' : '!'}</span>
      <div className="stack check-body">
        <strong>{check.label}</strong>
        <span className="muted small">{check.detail}</span>
        {extra}
        {!check.ok && check.fix ? <FixLink fix={check.fix} /> : null}
      </div>
    </li>
  );
}

function ChecksBody() {
  const { pin } = useHostSession();
  const { toasts, notify } = useToasts();
  const { connected, presence, meta, sendCue } = useGameSocketContext();
  const { playNow } = useSoundEngine();
  const [questions, setQuestions] = useState<readonly QuestionSummary[] | null>(null);
  const [settings, setSettings] = useState<PublicSettings | null>(null);
  const [health, setHealth] = useState<HealthInfo | null>(null);

  const refresh = useCallback(async () => {
    try {
      const [qs, st, hp] = await Promise.all([listQuestions(pin), getSettings(pin), getHealth()]);
      setQuestions(qs);
      setSettings(st);
      setHealth(hp);
    } catch (error) {
      notify(describeError(error), 'error');
    }
  }, [pin, notify]);

  const backup = async () => {
    try {
      notify(`Saved ${await downloadBackup(pin)}`, 'ok');
    } catch (error) {
      notify(describeError(error), 'error');
    }
  };

  useEffect(() => {
    void refresh();
    const timer = setInterval(() => void refresh(), SURVEY_POLL_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [refresh]);

  const testDing = () => {
    void playNow({ name: 'reveal' });
    sendCue('reveal');
  };

  const checks = buildChecks({ connected, presence, meta, questions, health });
  const extras: Partial<Record<CheckItem['id'], React.ReactNode>> = {
    storage: (
      <div className="stack">
        <button type="button" className="btn btn-inline" onClick={() => void backup()}>⬇ Download backup</button>
        <span className="muted small">Saves every question, answer and board as a file on this device. Do it whenever the count goes up.</span>
      </div>
    ),
    sound: <button type="button" className="btn btn-inline" onClick={testDing}>🔊 Play test ding</button>,
    buzzerA: <BuzzerLinks settings={settings} notify={notify} />,
  };

  return (
    <main className="page page-narrow host-page stack stack-lg">
      <HostChrome title="Pre-show checks">
        <p className="muted small">Updates live as people connect. Green all the way down means you are ready.</p>
        <p className="check-summary" role="status">{checkSummary(checks)}</p>
      </HostChrome>
      <ul className="check-list">
        {checks.map((check) => <CheckRow key={check.id} check={check} extra={extras[check.id]} />)}
      </ul>
      <Toasts toasts={toasts} />
    </main>
  );
}

/** Live readiness checklist for the minutes before the show. */
export function ChecksPage() {
  const { pin } = useHostSession();
  return (
    <GameSocketProvider auth={{ role: 'host', pin }}>
      <ChecksBody />
    </GameSocketProvider>
  );
}
