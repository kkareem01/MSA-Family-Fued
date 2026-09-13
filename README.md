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

4. **Survey link**: the projector's idle screen shows a big QR code as soon as the tunnel is up.
   Share it before the event too: the survey is open whenever a question is marked *open*.

5. **Buzzers**: in Host → *Settings, links and buzzer codes* there is a link and a 4-letter code
   per team. Send each face-off player their link (or the code and the `/buzzer` address).

6. **Test sounds**: Host → *Sound test*. Each button plays on the projector.

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

Every cue is synthesized, so it works out of the box. Drop `reveal.mp3`, `strike.mp3`,
`buzz.mp3`, `round_start.mp3`, `round_win.mp3`, `win.mp3` or `theme.mp3` into `sounds/` to
override any of them (see `sounds/README.md`). Reload the display page after adding files.

## If something goes wrong

- **No sound on the projector**: click the display page once. Browsers block audio until then.
- **Server crashed / laptop rebooted**: run `npm run event` again. Scores, the board, strikes and
  every survey answer come back from `data/feud.db`. The tunnel URL changes, so show the new QR.
- **Tunnel failed**: the game still runs. Use `--no-tunnel` on the same wifi, or paste any public
  URL under Host → Settings.
- **Public link shows a blank 404**: the launcher starts cloudflared with its own empty config, so
  a personal `~/.cloudflared/config.yml` (named tunnels with ingress rules) is ignored on purpose.
  If you run `cloudflared` by hand instead, add `--config /path/to/empty.yml`. The link usually
  answers within about ten seconds of the banner appearing.
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
