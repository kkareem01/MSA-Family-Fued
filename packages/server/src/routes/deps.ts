import type { Auth } from '../services/auth';
import type { QuestionService } from '../services/questionService';
import type { SurveyService } from '../services/surveyService';
import type { TallyService } from '../services/tallyService';
import type { SettingsService } from '../services/settingsService';
import type { GameService } from '../services/gameService';
import type { RestoreService } from '../services/restoreService';
import type { RateLimits } from '../plugins/rateLimit';
import type { HostGuard } from '../plugins/hostAuth';
import type { BackupRepo } from '../repositories/backupRepo';
import type { SurveyRepo } from '../repositories/surveyRepo';
import type { StorageInfo } from '../db/storage';

export type RouteDeps = Readonly<{
  auth: Auth;
  requireHost: HostGuard;
  questionService: QuestionService;
  surveyService: SurveyService;
  tallyService: TallyService;
  settingsService: SettingsService;
  gameService: GameService;
  rateLimits: RateLimits;
  backup: BackupRepo;
  restoreService: RestoreService;
  responses: SurveyRepo;
  storage: StorageInfo;
}>;
