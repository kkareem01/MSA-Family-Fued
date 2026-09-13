export type GuideLink = Readonly<{ to: string; label: string }>;
export type GuideStep = Readonly<{ title: string; detail: string; link?: GuideLink }>;
export type GuideSection = Readonly<{ id: string; title: string; intro: string; steps: readonly GuideStep[] }>;
export type StartCard = Readonly<{ section: string; title: string; bullets: readonly string[]; to: string; cta: string }>;

/** Everything a first-time host needs, in the order they need it. Rendered on /guide and reused in-app. */
export const GUIDE_SECTIONS: readonly GuideSection[] = [
  {
    id: 'setup',
    title: 'Set up',
    intro: 'One server runs everything: the projector page, the host panel, the audience survey and the phone buzzers.',
    steps: [
      {
        title: 'Start the server',
        detail:
          'Hosted online (Railway or Fly.io): nothing to start, just open your public address. On the laptop: run `npm run event` in a terminal and keep it open; it prints the links.',
      },
      {
        title: 'Open the projector page',
        detail: 'Open /display on the laptop that feeds the projector, drag it to the big screen, and click once. That click turns on sound and goes fullscreen.',
        link: { to: '/display', label: 'Projector display' },
      },
      {
        title: 'Open the host panel on your phone',
        detail: 'Go to /host and enter the host PIN once. Everything you tap here shows up on the projector instantly.',
        link: { to: '/host', label: 'Host panel' },
      },
      {
        title: 'Check the public link',
        detail:
          'The QR code needs a link phones can open from anywhere. Hosted online it is your site address. On the laptop, `npm run event` creates one; if it fails, paste any public URL under Host → Settings.',
        link: { to: '/host/share', label: 'Share QR' },
      },
      {
        title: 'Name the teams and set the rules',
        detail: 'Tap a team name on the host panel to rename it. Under Settings → Game rules you can change strikes per round and the point multipliers.',
      },
    ],
  },
  {
    id: 'survey',
    title: 'Survey and questions',
    intro: 'Boards are built from real audience answers. Open the survey days before the event, or live in the room.',
    steps: [
      { title: 'Write questions', detail: 'Host → Questions. Each one starts as a draft the audience cannot see.', link: { to: '/host/questions', label: 'Questions' } },
      { title: 'Open the survey', detail: 'Tap “Open survey” on a question. It appears on every phone that scanned the QR code, and the tally starts filling.' },
      {
        title: 'Share the QR code',
        detail: 'Host → Share QR shows a big code and the link. “Show on projector” puts it on the big screen over whatever is showing, with the open questions.',
        link: { to: '/host/share', label: 'Share QR' },
      },
      { title: 'Close the survey', detail: 'When you have enough answers, tap “Close survey”. Finalizing a board also closes it.' },
      {
        title: 'Tally the answers',
        detail: 'Tap “Tally and build board”. Answers are grouped by spelling automatically. Fix wording, merge duplicates into one, hide junk, or override points.',
      },
      {
        title: 'Finalize the board',
        detail: 'Pick how many answers go on the board (top 8 at most) and tap Finalize. Points are each answer’s share of the counted responses, out of 100.',
      },
      { title: 'Load it in the game', detail: 'Back on the host panel, finalized questions appear in the picker between rounds. Load one to start the round.' },
    ],
  },
  {
    id: 'test',
    title: 'Test before the show',
    intro: 'Ten minutes before doors open, run through the checks so nothing surprises you on stage.',
    steps: [
      {
        title: 'Run the checks page',
        detail: 'Host → Checks watches the room live: projector open, projector sound on, public link set, both buzzers joined, boards ready.',
        link: { to: '/host/checks', label: 'Checks' },
      },
      {
        title: 'Test the sounds',
        detail: 'Host → Sound test plays each cue on your phone and on the projector. If the projector stays silent, click its screen once; a 🔇 badge shows when audio is blocked.',
      },
      {
        title: 'Test the buzzers',
        detail: 'Send each face-off player their team link from Settings (or the 4-letter code and the /buzzer address). Start a face-off and have both tap: the first one locks.',
        link: { to: '/buzzer', label: 'Buzzer page' },
      },
      { title: 'Scan the QR with your own phone', detail: 'Make sure the survey opens on mobile data, not just on the venue wifi.' },
      { title: 'Play a dry run', detail: 'Load a board, run a face-off, reveal a few answers, strike out, steal. Then “New game” resets the scores; team names stay.' },
    ],
  },
  {
    id: 'play',
    title: 'Play a round',
    intro: 'The host panel always tells you the next thing to do at the top. This is the full flow.',
    steps: [
      { title: 'Pick a question', detail: 'Between rounds, choose a finalized board. The projector shows the round number and the multiplier.' },
      { title: 'Read it out, start the face-off', detail: 'Read the question, get one player from each team to their phone, then tap “Start face-off”. The buzzers light up.' },
      {
        title: 'Face-off',
        detail: 'The first phone to buzz locks in (or lock a team yourself). Tap the answer they said, or “Not on the board”. Top answer wins outright; otherwise the other team gets a go and the higher answer wins.',
      },
      { title: 'Play or pass', detail: 'Ask the winning team. Play keeps control; Pass hands it to the other team.' },
      {
        title: 'In play',
        detail: 'Reveal each answer the team gets right. Tap Strike for a miss. Three strikes (or your setting) sends the board to the other team for a steal.',
      },
      { title: 'Steal', detail: 'The other team gets one guess. Reveal it if it is on the board and they take the whole pot; otherwise “Steal failed” and the pot goes to the team in control.' },
      { title: 'Round over', detail: 'Reveal the remaining answers for the crowd, then “Next round”. Rounds 1–2 are single points, round 3 double, round 4 and later triple.' },
      { title: 'End the game', detail: 'Between rounds, tap “End game” to crown the winner with confetti. Undo reverses any step if you tap the wrong thing.' },
    ],
  },
  {
    id: 'sounds',
    title: 'Sounds',
    intro: 'Every cue is synthesized, so it works with nothing to install. Real audio files can replace any of them.',
    steps: [
      { title: 'Where sound plays', detail: 'Game cues play on the projector. The host Sound test also plays on your phone so you can hear them without the room.' },
      { title: 'If the projector is silent', detail: 'Browsers block audio until the page is clicked. Click the projector screen once. The 🔇 badge disappears when sound is on.' },
      { title: 'Custom sounds', detail: 'Drop reveal.mp3, strike.mp3, buzz.mp3, round_start.mp3, round_win.mp3, win.mp3 or theme.mp3 into the sounds folder and reload the projector.' },
    ],
  },
  {
    id: 'troubleshooting',
    title: 'If something goes wrong',
    intro: 'Nothing here loses the game: scores, the board, strikes and every answer are saved as they happen.',
    steps: [
      { title: 'Server restarted', detail: 'Reopen the pages. Everything comes back from the database. On the laptop the tunnel link changes, so show the new QR.' },
      { title: 'Phone shows “wrong code”', detail: 'Codes may have been re-issued under Settings. Send the new link.' },
      { title: 'Host panel says “wrong PIN”', detail: 'It must match HOST_PIN in the .env file (or the hosting platform’s variables).' },
      { title: 'A tap did the wrong thing', detail: 'Undo on the host panel reverses the last step, as many times as needed.' },
      { title: 'Venue internet dies', detail: 'On the laptop setup the projector and host panel keep working on localhost. Only phones outside the wifi lose the survey.' },
    ],
  },
];

export function guideSection(id: string): GuideSection | undefined {
  return GUIDE_SECTIONS.find((section) => section.id === id);
}

/** The four cards on the landing page: the whole event in one glance. */
export const START_HERE: readonly StartCard[] = [
  {
    section: 'setup',
    title: 'Set up',
    bullets: ['Open /display on the projector laptop and click once', 'Open /host on your phone, enter the PIN', 'Check the public link under Share QR'],
    to: '/host',
    cta: 'Open the host panel',
  },
  {
    section: 'survey',
    title: 'Survey',
    bullets: ['Write questions, open the survey', 'Share the QR code (or show it on the projector)', 'Tally the answers and finalize a board'],
    to: '/host/questions',
    cta: 'Write questions',
  },
  {
    section: 'test',
    title: 'Test',
    bullets: ['Projector open with sound on', 'Both buzzers joined', 'A board ready to load'],
    to: '/host/checks',
    cta: 'Run the checks',
  },
  {
    section: 'play',
    title: 'Play',
    bullets: ['Pick a question, start the face-off', 'Reveal answers, strike, steal', 'Next round, then end the game'],
    to: '/host',
    cta: 'Start playing',
  },
];
