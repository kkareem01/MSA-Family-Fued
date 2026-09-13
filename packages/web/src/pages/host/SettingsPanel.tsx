import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { MAX_MAX_STRIKES, MIN_MAX_STRIKES, TEAM_IDS, type GameState, type PublicSettings } from '@feud/shared';
import { getSettings, rotateBuzzerCodes, setPublicUrl } from '../../api/settings';
import { describeError } from '../../api/client';
import { buzzerLinkFor, surveyLinkFor } from '../../share/surveyLink';
import { copyText } from './copyText';
import { useHost } from './HostContext';

function parseMultipliers(text: string): number[] | null {
  const values = text.split(/[\s,]+/u).filter(Boolean).map(Number);
  return values.length > 0 && values.every((v) => Number.isInteger(v) && v >= 1 && v <= 5) ? values : null;
}

function GameRules({ state }: { state: GameState }) {
  const { send, allowed } = useHost();
  const [strikes, setStrikes] = useState(String(state.settings.maxStrikes));
  const [multipliers, setMultipliers] = useState(state.settings.multipliers.join(', '));
  const editable = allowed('UPDATE_SETTINGS');
  const save = async (event: FormEvent) => {
    event.preventDefault();
    const parsed = parseMultipliers(multipliers);
    if (!parsed) return;
    await send({ type: 'UPDATE_SETTINGS', settings: { maxStrikes: Number(strikes), multipliers: parsed } });
  };
  return (
    <form className="stack" onSubmit={(e) => void save(e)}>
      <h3>Game rules</h3>
      {!editable ? <p className="muted small">Rules can only change between rounds.</p> : null}
      <label className="field">
        <span>Strikes per round</span>
        <input type="number" min={MIN_MAX_STRIKES} max={MAX_MAX_STRIKES} value={strikes} disabled={!editable} onChange={(e) => setStrikes(e.target.value)} />
      </label>
      <label className="field">
        <span>Point multipliers by round (last one repeats)</span>
        <input value={multipliers} disabled={!editable} onChange={(e) => setMultipliers(e.target.value)} placeholder="1, 1, 2, 3" />
      </label>
      <button className="btn" type="submit" disabled={!editable || parseMultipliers(multipliers) === null}>Save rules</button>
    </form>
  );
}

/** Public URL for the QR code, buzzer links for the players, and game rules. */
export function SettingsPanel({ state }: { state: GameState }) {
  const { pin, notify } = useHost();
  const [settings, setSettings] = useState<PublicSettings | null>(null);
  const [urlDraft, setUrlDraft] = useState('');

  const refresh = useCallback(async () => {
    try {
      const next = await getSettings(pin);
      setSettings(next);
      setUrlDraft(next.publicUrl ?? '');
    } catch (error) {
      notify(describeError(error), 'error');
    }
  }, [pin, notify]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const saveUrl = async (event: FormEvent) => {
    event.preventDefault();
    try {
      setSettings(await setPublicUrl(pin, urlDraft.trim() || null));
      notify(urlDraft.trim() ? 'Public link saved. The QR code updates on the projector.' : 'Public link cleared.', 'ok');
    } catch (error) {
      notify(describeError(error), 'error');
    }
  };

  const rotate = async () => {
    try {
      setSettings(await rotateBuzzerCodes(pin));
      notify('New buzzer codes issued. Players must rejoin.', 'ok');
    } catch (error) {
      notify(describeError(error), 'error');
    }
  };

  const survey = settings ? surveyLinkFor(settings.publicUrl, settings.lanUrl) : null;
  return (
    <details className="panel">
      <summary>Settings, links and buzzer codes</summary>
      <div className="stack stack-lg">
        <form className="stack" onSubmit={(e) => void saveUrl(e)}>
          <h3>Public link (for the QR code)</h3>
          <p className="muted small">Filled in automatically by <code>npm run event</code>. Paste one here if you use your own tunnel.</p>
          <label className="field">
            <span>Public URL</span>
            <input value={urlDraft} onChange={(e) => setUrlDraft(e.target.value)} placeholder="https://something.trycloudflare.com" inputMode="url" />
          </label>
          <div className="row">
            <button className="btn btn-primary" type="submit">Save</button>
            {settings?.lanUrl ? <span className="muted small">Same-wifi fallback: {settings.lanUrl}</span> : null}
          </div>
          {survey ? (
            <p className="small">
              Survey link: <code>{survey.url}</code>{' '}
              <button type="button" className="btn btn-ghost btn-inline" onClick={() => void copyText(survey.url).then((ok) => notify(ok ? 'Copied' : 'Copy failed'))}>Copy</button>{' '}
              <Link className="btn btn-ghost btn-inline" to="/host/share">Show as QR</Link>
            </p>
          ) : null}
        </form>

        <section className="stack">
          <h3>Buzzer links</h3>
          <p className="muted small">Send each face-off player their team link, or tell them the 4-letter code.</p>
          {settings
            ? TEAM_IDS.map((team) => {
                const link = buzzerLinkFor(settings.publicUrl, settings.lanUrl, team, settings.buzzerCodes[team]);
                return (
                  <div key={team} className="buzzer-link">
                    <strong>{state.teams[team].name}</strong>
                    <span className="code">{settings.buzzerCodes[team]}</span>
                    <button type="button" className="btn btn-ghost btn-inline" onClick={() => void copyText(link).then((ok) => notify(ok ? 'Link copied' : 'Copy failed'))}>Copy link</button>
                  </div>
                );
              })
            : null}
          <button type="button" className="btn btn-ghost" onClick={() => void rotate()}>Issue new codes</button>
        </section>

        <GameRules state={state} />
      </div>
    </details>
  );
}
