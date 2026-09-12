import type { Auth } from '../services/auth';
import type { QuestionService } from '../services/questionService';
import type { SurveyService } from '../services/surveyService';
import type { TallyService } from '../services/tallyService';
import type { SettingsService } from '../services/settingsService';
import type { GameService } from '../services/gameService';
import type { RateLimits } from '../plugins/rateLimit';
import type { HostGuard } from '../plugins/hostAuth';

export type RouteDeps = Readonly<{
  auth: Auth;
  requireHost: HostGuard;
  questionService: QuestionService;
  surveyService: SurveyService;
  tallyService: TallyService;
  settingsService: SettingsService;
  gameService: GameService;
  rateLimits: RateLimits;
}>;
