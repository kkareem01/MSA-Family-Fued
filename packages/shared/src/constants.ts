export const APP_NAME = 'MSA Family Feud';

export const TEAM_IDS = ['A', 'B'] as const;

export const PHASES = [
  'idle',
  'round_intro',
  'faceoff',
  'faceoff_answering',
  'play_or_pass',
  'in_play',
  'steal',
  'round_over',
  'game_over',
] as const;

export const CUE_NAMES = ['reveal', 'strike', 'buzz', 'round_start', 'round_win', 'win', 'theme'] as const;

export const MIN_BOARD_ANSWERS = 1;
export const MAX_BOARD_ANSWERS = 8;
export const ANSWER_TEXT_MAX_LEN = 60;
export const MIN_ANSWER_POINTS = 0;
export const MAX_ANSWER_POINTS = 100;

export const DEFAULT_MAX_STRIKES = 3;
export const MIN_MAX_STRIKES = 1;
export const MAX_MAX_STRIKES = 5;

export const DEFAULT_MULTIPLIERS = [1, 1, 2, 3] as const;
export const MIN_MULTIPLIER = 1;
export const MAX_MULTIPLIER = 5;

export const MAX_HISTORY = 50;
export const MAX_SCORE_DELTA = 1000;
export const MIN_SCORE = 0;

export const TEAM_NAME_MAX_LEN = 24;
export const DEFAULT_TEAM_NAMES = { A: 'Team A', B: 'Team B' } as const;

export const QUESTION_PROMPT_MAX_LEN = 200;
export const SURVEY_ANSWER_MAX_LEN = 80;
export const SURVEY_MAX_ANSWERS_PER_SUBMIT = 20;
export const POINTS_SCALE = 100;
