import {
  LocalUserRepository,
  LocalUnitRepository,
  LocalEventRepository,
  LocalQuestionRepository,
  LocalParticipationRepository,
  LocalDrawRepository,
  LocalAuditRepository,
  LocalSettingsRepository,
} from './local-adapter';

// Singletons
export const userRepository = new LocalUserRepository();
export const unitRepository = new LocalUnitRepository();
export const eventRepository = new LocalEventRepository();
export const questionRepository = new LocalQuestionRepository();
export const participationRepository = new LocalParticipationRepository();
export const drawRepository = new LocalDrawRepository();
export const auditRepository = new LocalAuditRepository();
export const settingsRepository = new LocalSettingsRepository();

export * from './interfaces';
