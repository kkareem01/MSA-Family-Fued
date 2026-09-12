export const STORAGE_KEYS = {
  hostPin: 'feud.hostPin',
  surveyToken: 'feud.surveyToken',
  surveyAnswered: 'feud.surveyAnswered',
  buzzerJoin: 'feud.buzzerJoin',
} as const;

export const SURVEY_POLL_INTERVAL_MS = 10_000;
export const STRIKE_FLASH_MS = 1400;
export const BUZZ_FLASH_MS = 2500;
export const ROUND_RESULT_MS = 4000;
export const TOAST_MS = 3000;
export const ACTION_ACK_TIMEOUT_MS = 5000;
export const STAGE_WIDTH = 1920;
export const STAGE_HEIGHT = 1080;
