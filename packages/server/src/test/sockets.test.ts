import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { buildTestApp, seedFinalizedQuestion, TEST_PIN, type TestApp } from './helpers';
import { connectClient, listenTestApp, sendAction, sleep, waitFor, type ClientSocket } from './socketHelpers';

describe('sockets', () => {
  let t: TestApp;
  let port: number;
  const clients: ClientSocket[] = [];
  const connect = async (auth: Record<string, unknown>) => {
    const socket = await connectClient(port, auth);
    clients.push(socket);
    return socket;
  };
  const buzzerCodes = async () =>
    (await t.app.inject({ method: 'GET', url: '/api/settings', headers: t.hostHeaders })).json().data.buzzerCodes as { A: string; B: string };
  const loadQuestion = async () => {
    const qid = await seedFinalizedQuestion(t);
    const board = (await t.app.inject({ method: 'GET', url: `/api/questions/${qid}/board`, headers: t.hostHeaders })).json().data;
    await t.app.inject({ method: 'POST', url: '/api/game/action', headers: t.hostHeaders, payload: { action: { type: 'LOAD_QUESTION', board } } });
  };

  beforeEach(async () => {
    t = await buildTestApp();
    port = await listenTestApp(t);
  });
  afterEach(async () => {
    clients.splice(0).forEach((c) => c.close());
    await t.app.close();
  });

  it('rejects bad handshakes', async () => {
    await expect(connect({ role: 'host', pin: 'wrong-pin' })).rejects.toThrow(/unauthorized/);
    await expect(connect({ role: 'buzzer', team: 'A', code: 'ZZZZ' })).rejects.toThrow(/bad_code/);
    await expect(connect({ role: 'pirate' })).rejects.toThrow(/bad_auth/);
  });

  it('sends meta and a masked state to the display on connect', async () => {
    await loadQuestion();
    const display = await connect({ role: 'display' });
    const [meta, state] = await Promise.all([waitFor(display, 'meta'), waitFor(display, 'state')]);
    expect(meta).toMatchObject({ publicUrl: null, surveyPath: '/survey', buzzerPath: '/buzzer' });
    expect(meta.lanUrl).toMatch(/^http:\/\//u);
    expect(state.state.phase).toBe('round_intro');
    expect(state.state.round.board?.answers.every((a) => a.text === '' && a.points === 0)).toBe(true);
  });

  it('gives the host the full state and applies actions with acks and cues', async () => {
    await loadQuestion();
    const host = await connect({ role: 'host', pin: TEST_PIN });
    const display = await connect({ role: 'display' });
    const full = await waitFor(host, 'state');
    expect(full.state.round.board?.answers[0]?.text).toBe('Pizza');
    await waitFor(display, 'state');

    expect(await sendAction(host, { type: 'START_FACEOFF' })).toMatchObject({ ok: true, changed: true });
    expect(await sendAction(host, { type: 'SET_CONTROL', team: 'A' })).toMatchObject({ ok: true, changed: true });
    const cuePromise = waitFor(display, 'cue', (c) => c.name === 'reveal');
    const statePromise = waitFor(display, 'state', (s) => s.state.phase === 'in_play' && s.state.round.board?.answers[0]?.revealed === true);
    const ack = await sendAction(host, { type: 'REVEAL_ANSWER', rank: 1 });
    expect(ack).toMatchObject({ ok: true, changed: true });
    expect(await cuePromise).toEqual({ name: 'reveal', rank: 1 });
    expect((await statePromise).state.round.board?.answers[0]?.text).toBe('Pizza');

    expect(await sendAction(host, { type: 'START_FACEOFF' })).toMatchObject({ ok: true, changed: false });
    expect(await sendAction(host, { type: 'REVEAL_ANSWER', rank: 42 })).toMatchObject({ ok: false });
    expect(await sendAction(host, { nope: true })).toMatchObject({ ok: false });
  });

  it('relays host sound tests to the display only', async () => {
    const host = await connect({ role: 'host', pin: TEST_PIN });
    const display = await connect({ role: 'display' });
    const cuePromise = waitFor(display, 'cue');
    host.emit('host:cue', { name: 'win' });
    expect(await cuePromise).toEqual({ name: 'win' });
    await expect(waitFor(host, 'cue', () => true, 200)).rejects.toThrow(/Timed out/);
  });

  it('locks exactly one buzzer during the face-off and ignores buzzes otherwise', async () => {
    await loadQuestion();
    const codes = await buzzerCodes();
    const host = await connect({ role: 'host', pin: TEST_PIN });
    const display = await connect({ role: 'display' });
    const a = await connect({ role: 'buzzer', team: 'A', code: codes.A });
    const b = await connect({ role: 'buzzer', team: 'B', code: codes.B.toLowerCase() });
    const initial = await waitFor(a, 'buzzer_state');
    expect(initial).toMatchObject({ phase: 'round_intro', buzzersOpen: false, yourTeam: 'A', teamName: 'Team A' });

    a.emit('buzzer:buzz');
    await sleep(50);
    expect((await sendAction(host, { type: 'START_FACEOFF' })).changed).toBe(true);
    await waitFor(a, 'buzzer_state', (s) => s.buzzersOpen);
    await waitFor(b, 'buzzer_state', (s) => s.buzzersOpen);

    const buzzCues: string[] = [];
    display.on('cue', (c) => {
      if (c.name === 'buzz') buzzCues.push(c.team ?? '?');
    });
    const lockedA = waitFor(a, 'buzzer_state', (s) => s.lockedTeam !== null);
    const lockedB = waitFor(b, 'buzzer_state', (s) => s.lockedTeam !== null);
    b.emit('buzzer:buzz');
    a.emit('buzzer:buzz');
    const [sa, sb] = await Promise.all([lockedA, lockedB]);
    expect(sa.lockedTeam).toBe('B');
    expect(sb.lockedTeam).toBe('B');
    expect(sa.phase).toBe('faceoff_answering');
    await sleep(100);
    expect(buzzCues).toEqual(['B']);
    const state = (await t.app.inject({ method: 'GET', url: '/api/game/state', headers: t.hostHeaders })).json().data;
    expect(state.state.round.faceoff).toMatchObject({ lockedTeam: 'B', lockedBy: 'buzzer' });
    expect(typeof state.state.round.faceoff.lockedAt).toBe('number');
  });

  it('pushes new meta when the public url changes', async () => {
    const display = await connect({ role: 'display' });
    await waitFor(display, 'meta');
    const next = waitFor(display, 'meta', (m) => m.publicUrl !== null);
    await t.app.inject({ method: 'PUT', url: '/api/settings/public-url', headers: t.hostHeaders, payload: { url: 'https://abc.trycloudflare.com' } });
    expect((await next).publicUrl).toBe('https://abc.trycloudflare.com');
  });
});
