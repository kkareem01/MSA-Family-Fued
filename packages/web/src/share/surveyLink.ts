import { BUZZER_PATH, SURVEY_PATH, type TeamId } from '@feud/shared';

export type SurveyLink = Readonly<{ url: string; isPublic: boolean }>;

/** The link the QR code carries: the tunnel when there is one, otherwise the same-wifi address. */
export function surveyLinkFor(publicUrl: string | null, lanUrl: string): SurveyLink {
  return publicUrl ? { url: `${publicUrl}${SURVEY_PATH}`, isPublic: true } : { url: `${lanUrl}${SURVEY_PATH}`, isPublic: false };
}

export function buzzerLinkFor(publicUrl: string | null, lanUrl: string, team: TeamId, code: string): string {
  return `${publicUrl ?? lanUrl}${BUZZER_PATH}?team=${team}&code=${code}`;
}

/** Strips the scheme so a link reads cleanly on a screen. */
export function shortUrl(url: string): string {
  return url.replace(/^https?:\/\//u, '');
}
