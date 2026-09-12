import { STAGE_HEIGHT, STAGE_WIDTH } from '../../config';

/** Uniform scale that fits the fixed stage inside the viewport (letterboxed, never cropped). */
export function computeStageScale(viewportWidth: number, viewportHeight: number): number {
  if (viewportWidth <= 0 || viewportHeight <= 0) return 1;
  return Math.min(viewportWidth / STAGE_WIDTH, viewportHeight / STAGE_HEIGHT);
}
