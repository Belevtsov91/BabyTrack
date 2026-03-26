/**
 * Centralized localStorage key constants.
 * Import this everywhere instead of using raw string literals.
 */
export const SK = {
  // Auth / profile
  AUTH_TOKEN:    "authToken",
  ONBOARDED:     "onboarded",
  BABY_NAME:     "babyName",
  BIRTH_DATE:    "birthDate",
  BABY_GENDER:   "gender",
  USER_EMAIL:    "userEmail",
  AUTH_PROVIDER: "authProvider",
  USER_NAME:     "userName",
  USER_AVATAR:   "userAvatar",
  USER_ROLE:     "userRole",
  TRACKED_FEATURES: "trackedFeatures",
  LAST_APP_VISIT_AT: "babytrack_last_app_visit_at",
  SESSION_RECAP_DISMISSED_CONTEXT: "babytrack_session_recap_dismissed_context",

  // Display settings
  THEME:         "babytrack_theme",
  LANGUAGE:      "babytrack_lang",
  UNIT_VOLUME:   "babytrack_unit_volume",
  UNIT_LENGTH:   "babytrack_unit_length",
  UNIT_WEIGHT:   "babytrack_unit_weight",
  UNIT_TEMPERATURE: "babytrack_unit_temperature",
  SHOW_SOLID:    "babytrack_show_solid",
  SHOW_WALK:     "babytrack_show_walk",
  SHOW_MOOD:     "babytrack_show_mood",
  SYNC_ENABLED:  "babytrack_sync",

  // Feature data
  MED_HISTORY:   "babytrack_med_history",
  PROFILES:      "babytrack_profiles",

  // Domain stores
  EVENTS:        "babytrack_events",
  MILESTONES:    "babytrack_milestones",
  VACCINATIONS:  "babytrack_vaccinations",
  TEMPERATURE:   "babytrack_temperature",
  ALLERGENS:     "babytrack_allergens",
  PHOTOS:        "babytrack_photos",

  // Timer persistence: append eventType, e.g. SK.TIMER_PREFIX + "breast"
  TIMER_PREFIX:  "babytrack_timer_",

  // User accounts
  USERS:         "babytrack_users",

  // Seed / legacy
  SEED_MARK:     "babytrack_seeded_v2",
  LEGACY_EVENTS: "bt_events",
} as const;

/** Validate that authToken looks like a real session token (non-empty, min length). */
export function isValidAuthToken(token: string | null): boolean {
  return typeof token === "string" && token.trim().length >= 6;
}
