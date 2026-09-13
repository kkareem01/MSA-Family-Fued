import { useEffect, useState, type ReactNode } from 'react';
import { STAGE_HEIGHT, STAGE_WIDTH } from '../../config';
import { computeStageScale } from './stageScale';

function useStageScale(): number {
  const [scale, setScale] = useState(() => computeStageScale(window.innerWidth, window.innerHeight));
  useEffect(() => {
    const update = () => setScale(computeStageScale(window.innerWidth, window.innerHeight));
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);
  return scale;
}

/**
 * Fixed 1920x1080 canvas scaled to fit any screen, so the layout is pixel-exact on the projector.
 * Centered with an explicit translate: grid/flex centering snaps an overflowing box to the top-left
 * in a hidden-overflow container, which is exactly the case on any window smaller than 1920x1080.
 */
export function Stage({ children }: { children: ReactNode }) {
  const scale = useStageScale();
  return (
    <div className="stage-viewport">
      <div className="stage" style={{ width: STAGE_WIDTH, height: STAGE_HEIGHT, transform: `translate(-50%, -50%) scale(${scale})` }}>
        {children}
      </div>
    </div>
  );
}
