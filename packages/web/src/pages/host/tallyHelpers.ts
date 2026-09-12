import { MAX_BOARD_ANSWERS, type TallyGroup, type TallyVariant } from '@feud/shared';

export function defaultTopN(groupCount: number): number {
  return Math.max(1, Math.min(MAX_BOARD_ANSWERS, groupCount));
}

const MAX_VARIANTS_SHOWN = 4;

/** "Pizza ×3, pizza ×1, +2 more" for the host to sanity-check a grouping. */
export function variantsSummary(variants: readonly TallyVariant[]): string {
  const shown = variants.slice(0, MAX_VARIANTS_SHOWN).map((v) => `${v.text} ×${v.count}`);
  const rest = variants.length - shown.length;
  return rest > 0 ? `${shown.join(', ')}, +${rest} more` : shown.join(', ');
}

export function boardPreview(groups: readonly TallyGroup[], topN: number): readonly TallyGroup[] {
  return groups.slice(0, topN);
}
