import { MERGE_CHAIN_MAX_DEPTH } from '../constants';
import { computePoints } from './points';
import { capitalizeFirst, tidyRawText } from './format';
import type { QuestionStatus, SurveyResponse, TallyDecision, TallyGroup, TallyVariant, TallyView } from './types';

type RawGroup = Readonly<{ key: string; count: number; responseIds: readonly string[]; variants: readonly TallyVariant[] }>;
type DecisionMap = Readonly<Record<string, TallyDecision>>;

function addVariant(variants: readonly TallyVariant[], text: string, count = 1): readonly TallyVariant[] {
  const existing = variants.find((v) => v.text === text);
  return existing
    ? variants.map((v) => (v.text === text ? { ...v, count: v.count + count } : v))
    : [...variants, { text, count }];
}

/** Deterministic code-point order (locale sorting would vary by machine). */
function compareText(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

function sortVariants(variants: readonly TallyVariant[]): readonly TallyVariant[] {
  return [...variants].sort((a, b) => b.count - a.count || compareText(a.text, b.text));
}

function bucketResponses(responses: readonly SurveyResponse[]): readonly RawGroup[] {
  const byKey = responses.reduce<Readonly<Record<string, RawGroup>>>((acc, r) => {
    const current = acc[r.normalizedText] ?? { key: r.normalizedText, count: 0, responseIds: [], variants: [] };
    const updated: RawGroup = {
      ...current,
      count: current.count + 1,
      responseIds: [...current.responseIds, r.id],
      variants: addVariant(current.variants, tidyRawText(r.rawText)),
    };
    return { ...acc, [r.normalizedText]: updated };
  }, {});
  return Object.values(byKey);
}

/** Follows merge pointers to the root. A cycle or an over-long chain leaves the key as its own root. */
function resolveRoot(key: string, decisions: DecisionMap, knownKeys: ReadonlySet<string>): string {
  const walk = (current: string, visited: readonly string[]): string => {
    const target = decisions[current]?.mergedIntoKey;
    if (!target || !knownKeys.has(target)) return current;
    if (visited.includes(target) || visited.length >= MERGE_CHAIN_MAX_DEPTH) return key;
    return walk(target, [...visited, current]);
  };
  return walk(key, []);
}

function mergeInto(root: RawGroup | undefined, rootKey: string, child: RawGroup, mergedKeys: readonly string[]) {
  const base = root ?? { key: rootKey, count: 0, responseIds: [], variants: [] };
  const variants = child.variants.reduce((acc, v) => addVariant(acc, v.text, v.count), base.variants);
  return {
    group: { ...base, count: base.count + child.count, responseIds: [...base.responseIds, ...child.responseIds], variants },
    mergedKeys: child.key === rootKey ? mergedKeys : [...mergedKeys, child.key],
  };
}

function foldIntoRoots(raw: readonly RawGroup[], decisions: DecisionMap) {
  const knownKeys = new Set(raw.map((g) => g.key));
  const rootOf = Object.fromEntries(raw.map((g) => [g.key, resolveRoot(g.key, decisions, knownKeys)])) as Readonly<Record<string, string>>;
  const folded = raw.reduce<Readonly<Record<string, { group: RawGroup; mergedKeys: readonly string[] }>>>((acc, g) => {
    const rootKey = rootOf[g.key] ?? g.key;
    const current = acc[rootKey];
    return { ...acc, [rootKey]: mergeInto(current?.group, rootKey, g, current?.mergedKeys ?? []) };
  }, {});
  return { folded, rootOf };
}

function toGroup(
  group: RawGroup,
  mergedKeys: readonly string[],
  mergedInto: string | null,
  decision: TallyDecision | undefined,
  kept: number,
): TallyGroup {
  const variants = sortVariants(group.variants);
  const pointsOverride = decision?.pointsOverride ?? null;
  return {
    key: group.key,
    displayText: decision?.displayText ?? capitalizeFirst(variants[0]?.text ?? group.key),
    count: group.count,
    responseIds: group.responseIds,
    variants,
    mergedKeys,
    mergedInto,
    dropped: decision?.dropped ?? false,
    pointsOverride,
    points: pointsOverride ?? computePoints(group.count, kept),
  };
}

function sortGroups(groups: readonly TallyGroup[]): readonly TallyGroup[] {
  return [...groups].sort((a, b) => b.count - a.count || compareText(a.key, b.key));
}

/** Groups one question's responses by normalized key, applies the host's decisions, and assigns points. */
export function buildTally(
  questionId: string,
  status: QuestionStatus,
  responses: readonly SurveyResponse[],
  decisions: readonly TallyDecision[],
): TallyView {
  const own = responses.filter((r) => r.questionId === questionId);
  const decisionMap: DecisionMap = Object.fromEntries(decisions.map((d) => [d.key, d]));
  const raw = bucketResponses(own);
  const { folded, rootOf } = foldIntoRoots(raw, decisionMap);
  const roots = Object.values(folded);
  const isDropped = (key: string) => decisionMap[key]?.dropped ?? false;
  const keptResponses = roots.reduce((sum, r) => (isDropped(r.group.key) ? sum : sum + r.group.count), 0);
  const rootGroups = roots.map((r) => toGroup(r.group, r.mergedKeys, null, decisionMap[r.group.key], keptResponses));
  const children = raw
    .filter((g) => (rootOf[g.key] ?? g.key) !== g.key)
    .map((g) => toGroup(g, [], rootOf[g.key] ?? null, undefined, keptResponses));
  return {
    questionId,
    status,
    totalResponses: own.length,
    keptResponses,
    groups: sortGroups(rootGroups.filter((g) => !g.dropped)),
    hidden: sortGroups([...rootGroups.filter((g) => g.dropped), ...children]),
  };
}
