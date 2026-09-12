import { SINGULARIZE_MIN_LEN } from '../constants';

/** Words that look plural but are not, or whose singular would collide with a different word. */
const EXCEPTIONS: ReadonlySet<string> = new Set([
  'news', 'jeans', 'glasses', 'series', 'species', 'chess', 'tennis', 'physics', 'mathematics',
  'economics', 'politics', 'athletics', 'lens', 'thesis', 'analysis', 'crisis', 'bonus', 'campus',
  'canvas', 'christmas', 'texas', 'paris', 'mars', 'always', 'perhaps', 'sometimes', 'whereas',
]);

const KEEP_ENDINGS = ['ss', 'us', 'is'] as const;
const SIBILANT_ES = ['shes', 'ches', 'xes', 'zes', 'sses'] as const;

/**
 * Light, rule-based singularization used only for grouping keys (never shown to users).
 * Both "cookie" and "cookies" map to the same stem so they group together.
 */
export function singularize(word: string): string {
  if (word.length < SINGULARIZE_MIN_LEN || EXCEPTIONS.has(word)) return word;
  if (word.endsWith('ies')) return `${word.slice(0, -3)}y`;
  if (word.endsWith('ie')) return `${word.slice(0, -2)}y`;
  if (SIBILANT_ES.some((ending) => word.endsWith(ending))) return word.slice(0, -2);
  if (KEEP_ENDINGS.some((ending) => word.endsWith(ending))) return word;
  if (word.endsWith('s')) return word.slice(0, -1);
  return word;
}
