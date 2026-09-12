import type { QUESTION_STATUSES } from '../constants';

export type QuestionStatus = (typeof QUESTION_STATUSES)[number];

export type SurveyResponse = Readonly<{
  id: string;
  questionId: string;
  rawText: string;
  normalizedText: string;
  submitterToken: string;
  createdAt: number;
}>;

/** A host's grouping choice for one normalized key; persisted so late responses auto-join. */
export type TallyDecision = Readonly<{
  key: string;
  displayText: string | null;
  mergedIntoKey: string | null;
  dropped: boolean;
  pointsOverride: number | null;
}>;

export type TallyVariant = Readonly<{ text: string; count: number }>;

export type TallyGroup = Readonly<{
  key: string;
  displayText: string;
  count: number;
  responseIds: readonly string[];
  variants: readonly TallyVariant[];
  /** Child keys folded into this root. */
  mergedKeys: readonly string[];
  /** Non-null only for hidden children. */
  mergedInto: string | null;
  dropped: boolean;
  pointsOverride: number | null;
  points: number;
}>;

export type TallyView = Readonly<{
  questionId: string;
  status: QuestionStatus;
  totalResponses: number;
  keptResponses: number;
  groups: readonly TallyGroup[];
  hidden: readonly TallyGroup[];
}>;
