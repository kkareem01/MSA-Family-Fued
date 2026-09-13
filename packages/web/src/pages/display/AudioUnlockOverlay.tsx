import { Brand } from '../../components/Brand';

type Props = Readonly<{ onUnlock: () => void }>;

async function requestFullscreen(): Promise<void> {
  try {
    if (!document.fullscreenElement) await document.documentElement.requestFullscreen();
  } catch {
    /* fullscreen is optional; F11 works too */
  }
}

/** Browsers only allow audio after a user gesture, so the projector page starts with one click. */
export function AudioUnlockOverlay({ onUnlock }: Props) {
  const handleClick = () => {
    onUnlock();
    void requestFullscreen();
  };
  return (
    <button type="button" className="unlock-overlay" onClick={handleClick}>
      <Brand />
      <span className="unlock-title">FAMILY FEUD.</span>
      <span className="unlock-hint">Click anywhere to start the show</span>
      <span className="unlock-sub">Turns on sound and goes fullscreen</span>
      <span className="unlock-sub">Keep this window on the projector and run the game from /host on your phone</span>
    </button>
  );
}
