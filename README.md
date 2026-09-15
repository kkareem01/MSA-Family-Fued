# MSA Family Feud

A Family Feud style game for an in-person event. The projector shows the board, the host runs
the game from a phone or laptop, the audience answers survey questions by scanning a QR code,
and the two face-off players buzz in from their own phones. No Fast Money round.

Everything runs from **one Node server on the host laptop**. The projector and host panel use
`localhost`, so the game keeps working even if the venue internet drops. A Cloudflare quick tunnel
exposes only the survey and buzzer pages to the audience.

## Requirements

- Node 24 or newer (`node --version`)
- `cloudflared` for the public link (`brew install cloudflared` on macOS). Optional: without it,
  phones on the same wifi can still use the LAN address.

## First-time setup

```bash
npm install
cp .env.example .env      # then edit HOST_PIN
```

Set `HOST_PIN` in `.env` to something only the host knows. It protects the host panel and the
question editor.

## Pages

| Page | Who | What |
|---|---|---|
| `/` | Host | Start here: the four steps (set up, survey, test, play) and links to everything |
| `/guide` | Host | The full guide, printable |
| `/display` | Projector | The game board. Click once to turn on sound and go fullscreen |
| `/host` | Host phone | Control panel: what to do now, round steps, board, strikes, sound test, settings |
| `/host/questions` | Host | Write questions, open and close surveys, tally, finalize boards |
| `/host/share` | Host | The survey QR code: copy, print, or show it on the projector |
| `/host/checks` | Host | Live pre-show checks: projector, sound, link, buzzers, boards |
| `/survey` | Audience | What the QR code opens |
| `/buzzer` | Two players | Face-off buzzer, one per team |

## Hosting it online (no laptop server, no tunnel)

The whole game is one long-running Node server with WebSockets and a SQLite file, so it needs a
host that runs a real process with a persistent disk. **Vercel, Netlify and GitHub Pages cannot run
it**: they are serverless or static, so the buzzers, the live projector and the saved answers
would all break. Railway or Fly.io work well and cost a few dollars a month (or nothing on a trial).
The repo ships a `Dockerfile`, `railway.json` and `fly.toml`.

Run exactly **one instance**: the game state lives in memory and in the SQLite file of that
instance.

### Railway (easiest)

1. Push this repo to GitHub, then in Railway choose **New project → Deploy from GitHub repo**.
   It picks up the `Dockerfile` automatically.
2. In the service **Variables**, add:
   - `HOST_PIN` – the PIN the host types in (at least 4 characters)
   - `PUBLIC_URL` – the public address Railway gives you, e.g. `https://msa-feud.up.railway.app`
     (Settings → Networking → Generate domain, then paste it here)
3. In **Volumes**, add a volume mounted at `/data`. Without it, every redeploy wipes the questions
   and answers.
4. Deploy. `https://<your-domain>/display` is the projector, `/host` the host panel, and the QR
   code on the projector already carries the public link.

### Fly.io

```bash
fly launch --copy-config --no-deploy      # keeps fly.toml; pick an app name and region
fly volumes create feud_data --size 1
fly secrets set HOST_PIN=your-pin PUBLIC_URL=https://<app>.fly.dev
fly deploy
```

### Keeping the answers safe

- **Attach the volume before collecting answers.** Without a volume the database lives on the
  container's temporary disk and every deploy or restart wipes it. Host → **Checks** shows a red
  "Answers are saved permanently" row when that is the case, and the server logs
  `NO PERSISTENT VOLUME` at start.
- **Download a backup** from Host → Checks whenever the answer count goes up, and once more right
  before the event. It saves every question, answer, tally decision and board as a JSON file on
  your device (`GET /api/backup` with the host PIN does the same).
- Every write is flushed to disk before the phone gets its "sent" reply, so a hard stop cannot
  lose an accepted answer.
- **Do not let the Railway plan lapse.** A trial that runs out or an unpaid bill stops the service.
  Add a payment method or upgrade to the Hobby plan before the event.
- Deleting a question deletes its answers too; the delete button asks first.

### On the day

- Open `https://<your-domain>/display` on the projector laptop and click once. Open `/host` on your
  phone. Everything else is the same as the runbook below, minus `npm run event`.
- The venue must have internet for the projector laptop and the host phone. If that is a risk,
  keep the laptop setup (`npm run event`) as a fallback: it works on the venue wifi alone.
- Redeploying restarts the server; the game and the answers come back from the volume, but phones
  reconnect on their own within a few seconds.

## Event-day runbook

1. **Start everything**
   ```bash
   npm run event
   ```
   This builds the web app, starts the server, opens the tunnel, and prints the links. Keep this
   terminal open all evening. Ctrl+C stops it all.
   - Same-wifi only (no internet): `npm run event -- --no-tunnel`

2. **Projector**: open `http://localhost:3000/display` in a browser on the laptop, drag it to the
   projector screen, click once (this turns on sound and goes fullscreen; F11 also works).

3. **Host panel**: open `http://localhost:3000/host` in another window, or on your phone using the
   LAN address printed in the terminal. Enter the PIN once; it is remembered.

4. **Survey link**: Host → **Share QR** shows the code and the link. *Show on projector* puts a
   giant QR plus the open questions on the big screen whenever no round is on the board; it steps
   aside during play and comes back between rounds, so it can be left on all evening. The idle
   screen always shows a QR too. Share it before the event: the survey is open whenever a question
   is *open*.

5. **Buzzers**: in Host → *Settings, links and buzzer codes* there is a link and a 4-letter code
   per team. Send each face-off player their link (or the code and the `/buzzer` address).

6. **Test everything**: Host → **Checks** goes green row by row as the projector, its sound, the
   public link, both buzzers and a finalized board come online. Host → *Sound test* plays each cue
   on your phone and on the projector.

## Question workflow

Host → **Questions**:

| Step | What happens |
|---|---|
| Add question | A draft the audience cannot see yet |
| Open survey | Appears on phones that scan the QR code |
| Close survey | Stops new answers (finalizing also closes) |
| Tally and build board | Group spellings, merge duplicates, hide junk, rename, override points, pick the top N, **Finalize** |
| Load (host panel) | Puts the board on the projector for the next round |

Points are the share of counted responses out of 100, Feud style. The tally auto-refreshes
while a survey is open, so you can build boards live during the event.

## Game flow (host panel)

Load question → Start face-off → phones buzz (or lock a team by hand) → tap the answer they said
or *Not on the board* → Play or Pass → reveal answers / Strike → after 3 strikes the other team
gets one steal → Round over: reveal the rest → Next round. *Undo* reverses any step. Rounds 1–2
are single points, round 3 double, round 4 and later triple (change under Settings → Game rules).

## Sounds

Every cue is synthesized, so it works out of the box. Game cues play on the projector; the host
panel's *Sound test* also plays them on your own phone, so you can hear them without the room.
The projector shows a 🔇 badge whenever the browser is blocking audio: click the screen once and
it goes away. Tapping *Theme* again stops it.

Drop `reveal.mp3`, `strike.mp3`, `buzz.mp3`, `round_start.mp3`, `round_win.mp3`, `win.mp3` or
`theme.mp3` into `sounds/` to override any of them (see `sounds/README.md`). Reload the display
page after adding files.

## If something goes wrong

- **No sound on the projector**: click the display page once; browsers block audio until then.
  The 🔇 badge in the corner tells you when audio is blocked, and Host → Checks shows
  "Projector sound is on" once it works. The host sound test also plays on your phone, so silence
  there means the phone is muted, not the game.
- **Server crashed / laptop rebooted**: run `npm run event` again. Scores, the board, strikes and
  every survey answer come back from `data/feud.db`. The tunnel URL changes, so show the new QR.
- **Tunnel failed**: the game still runs. Use `--no-tunnel` on the same wifi, or paste any public
  URL under Host → Settings.
- **Public link shows a blank 404**: the launcher starts cloudflared with its own empty config, so
  a personal `~/.cloudflared/config.yml` (named tunnels with ingress rules) is ignored on purpose.
  If you run `cloudflared` by hand instead, add `--config /path/to/empty.yml`. The link usually
  answers within about ten seconds of the banner appearing. If it still does not answer after a
  couple of minutes, press Ctrl+C and run `npm run event` again to get a fresh hostname. Warnings
  from cloudflared are printed in the launcher terminal and kept in a log whose path it prints.
- **Buzzer says wrong code**: codes may have been re-issued. Send the new link.
- **Host panel says "Wrong PIN"**: it must match `HOST_PIN` in `.env`.
- **Start fresh**: stop the server and delete `data/feud.db` (this erases questions and answers).

## Development

```bash
npm run dev            # server on :3000 with reload, web on :5173 with HMR
npm test               # unit and integration tests
npm run test:coverage  # with the 80% coverage gate
npm run e2e            # Playwright end-to-end (builds first)
npm run typecheck
```

Layout: `packages/shared` (game reducer, survey grouping, schemas, socket protocol),
`packages/server` (Fastify, Socket.IO, SQLite), `packages/web` (React pages: display, host,
questions, tally, survey, buzzer), `scripts/` (event launcher, tunnel), `e2e/` (Playwright).

The server is the only source of truth: the host sends actions, a pure reducer produces the next
state, it is saved to SQLite, and every screen receives it over a socket. Sound and visual cues
are computed server-side from each state change.
