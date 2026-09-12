import { singularize } from './singularize';

const ARTICLES: ReadonlySet<string> = new Set(['the', 'a', 'an']);
const APOSTROPHES = /[‘’ʼ']/gu;
const NON_ALNUM = /[^\p{L}\p{N}]+/gu;

function stripLeadingArticle(tokens: readonly string[]): readonly string[] {
  const first = tokens[0];
  return tokens.length > 1 && first !== undefined && ARTICLES.has(first) ? tokens.slice(1) : tokens;
}

/**
 * Canonical grouping key for a free-text survey answer.
 * Steps: NFKC, trim, lowercase, drop apostrophes, punctuation to spaces,
 * collapse whitespace, strip one leading article, singularize each token.
 */
export function normalizeAnswer(raw: string): string {
  const cleaned = raw
    .normalize('NFKC')
    .trim()
    .toLowerCase()
    .replace(APOSTROPHES, '')
    .replace(NON_ALNUM, ' ')
    .trim();
  if (cleaned === '') return '';
  const tokens = stripLeadingArticle(cleaned.split(' '));
  return tokens.map(singularize).join(' ');
}
