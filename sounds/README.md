# Custom sounds

The game synthesizes every sound effect with the Web Audio API, so it works out of the box.
Drop an `.mp3` in this folder to override a cue. File name must match the cue name exactly:

| File              | Played when                                  |
|-------------------|----------------------------------------------|
| `reveal.mp3`      | An answer tile flips                          |
| `strike.mp3`      | A strike (red X) or face-off miss             |
| `buzz.mp3`        | A team buzzes in during the face-off          |
| `round_start.mp3` | A new question is loaded                      |
| `round_win.mp3`   | A team wins the round pot                     |
| `win.mp3`         | Game over / winner screen                     |
| `theme.mp3`       | Optional loop, started from the host panel    |

Audio files are git-ignored. Restart is not required; the display page checks on load.

All sounds, files or synthesized, run through one master bus (gain plus a light compressor), so
overlapping cues do not clip. The host panel's sound test plays overrides on the host device too.
