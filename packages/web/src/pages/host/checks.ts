import type { MetaPayload, PresencePayload, QuestionSummary, TeamId } from '@feud/shared';

export type CheckId = 'host' | 'display' | 'sound' | 'link' | 'buzzerA' | 'buzzerB' | 'boards' | 'surveys';
export type CheckFix = Readonly<{ to: string; label: string; external?: boolean }>;
export type CheckItem = Readonly<{ id: CheckId; label: string; ok: boolean; detail: string; fix?: CheckFix }>;
export type CheckInput = Readonly<{
  connected: boolean;
  presence: PresencePayload | null;
  meta: MetaPayload | null;
  questions: readonly QuestionSummary[] | null;
}>;

const OPEN_DISPLAY: CheckFix = { to: '/display', label: 'Open the projector', external: true };

function hostCheck({ connected }: CheckInput): CheckItem {
  return connected
    ? { id: 'host', label: 'This panel is connected', ok: true, detail: 'Live link to the server.' }
    : { id: 'host', label: 'This panel is connected', ok: false, detail: 'Not connected. Check the wifi, or that the server is running.' };
}

function displayCheck({ presence }: CheckInput): CheckItem {
  const open = (presence?.displays ?? 0) > 0;
  return open
    ? { id: 'display', label: 'Projector page is open', ok: true, detail: `${presence?.displays} display${presence?.displays === 1 ? '' : 's'} connected.` }
    : { id: 'display', label: 'Projector page is open', ok: false, detail: 'Open /display on the projector laptop.', fix: OPEN_DISPLAY };
}

function soundCheck({ presence }: CheckInput): CheckItem {
  const on = (presence?.displaysWithSound ?? 0) > 0;
  return on
    ? { id: 'sound', label: 'Projector sound is on', ok: true, detail: 'Cues will play out loud.' }
    : { id: 'sound', label: 'Projector sound is on', ok: false, detail: 'Click the projector screen once to turn audio on. Then play the test ding.', fix: OPEN_DISPLAY };
}

function linkCheck({ meta }: CheckInput): CheckItem {
  if (meta?.publicUrl) return { id: 'link', label: 'Public survey link is set', ok: true, detail: meta.publicUrl };
  return {
    id: 'link',
    label: 'Public survey link is set',
    ok: false,
    detail: meta ? `Only the same-wifi link (${meta.lanUrl}) exists. Phones on mobile data cannot open it.` : 'Waiting for the server.',
    fix: { to: '/host/share', label: 'Share QR' },
  };
}

function buzzerCheck(team: TeamId, { presence }: CheckInput): CheckItem {
  const id: CheckId = team === 'A' ? 'buzzerA' : 'buzzerB';
  const joined = (presence?.buzzers[team] ?? 0) > 0;
  return joined
    ? { id, label: `Team ${team} buzzer joined`, ok: true, detail: `${presence?.buzzers[team]} phone${presence?.buzzers[team] === 1 ? '' : 's'} ready.` }
    : { id, label: `Team ${team} buzzer joined`, ok: false, detail: 'Send the player their buzzer link, or the code and the /buzzer address.', fix: { to: '/buzzer', label: 'Buzzer page', external: true } };
}

function boardsCheck({ questions }: CheckInput): CheckItem {
  const ready = questions?.filter((q) => q.hasBoard && q.status === 'finalized').length ?? 0;
  return ready > 0
    ? { id: 'boards', label: 'A board is ready to load', ok: true, detail: `${ready} finalized board${ready === 1 ? '' : 's'} waiting.` }
    : { id: 'boards', label: 'A board is ready to load', ok: false, detail: 'Tally a question and finalize it.', fix: { to: '/host/questions', label: 'Questions' } };
}

function surveysCheck({ questions }: CheckInput): CheckItem {
  const open = questions?.filter((q) => q.status === 'open').length ?? 0;
  return open > 0
    ? { id: 'surveys', label: 'A survey is open for the audience', ok: true, detail: `${open} question${open === 1 ? '' : 's'} open.` }
    : { id: 'surveys', label: 'A survey is open for the audience', ok: false, detail: 'Optional, but the QR code shows “Nothing open yet” until you open one.', fix: { to: '/host/questions', label: 'Questions' } };
}

/** Pure: turns what the socket and the API report into pass/fail rows with a fix for each. */
export function buildChecks(input: CheckInput): readonly CheckItem[] {
  return [hostCheck(input), displayCheck(input), soundCheck(input), linkCheck(input), buzzerCheck('A', input), buzzerCheck('B', input), boardsCheck(input), surveysCheck(input)];
}

export function checkSummary(checks: readonly CheckItem[]): string {
  return `${checks.filter((c) => c.ok).length} of ${checks.length} checks pass`;
}
