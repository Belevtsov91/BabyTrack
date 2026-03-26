import { SK, isValidAuthToken } from "./storageKeys";

export type BabyGender = "girl" | "boy" | "neutral";
export type SolidMode = "auto" | "on" | "off";

export interface MeasurementUnitsState {
  volume: "мл" | "унц";
  length: "см" | "дюйм";
  weight: "кг" | "фунт";
  temp: "°C" | "°F";
}

export interface BabyProfileState {
  name: string;
  birthDate: string;
  gender: BabyGender;
  avatar: string;
  userName: string;
  userEmail: string;
  userRole: string;
  trackedFeatures: string[];
}

export interface DisplaySettingsState {
  solidMode: SolidMode;
  showWalk: boolean;
  showMood: boolean;
  syncEnabled: boolean;
}

const LEGACY_GROUPS: Record<string, readonly string[]> = {
  [SK.AUTH_TOKEN]: [SK.AUTH_TOKEN],
  [SK.ONBOARDED]: [SK.ONBOARDED],
  [SK.BABY_NAME]: [SK.BABY_NAME],
  [SK.BIRTH_DATE]: [SK.BIRTH_DATE, "babyBirthDate"],
  [SK.BABY_GENDER]: [SK.BABY_GENDER, "babyGender"],
  [SK.USER_NAME]: [SK.USER_NAME],
  [SK.USER_EMAIL]: [SK.USER_EMAIL],
  [SK.USER_AVATAR]: [SK.USER_AVATAR],
  [SK.USER_ROLE]: [SK.USER_ROLE],
  [SK.AUTH_PROVIDER]: [SK.AUTH_PROVIDER],
  [SK.TRACKED_FEATURES]: [SK.TRACKED_FEATURES],
  [SK.LAST_APP_VISIT_AT]: [SK.LAST_APP_VISIT_AT],
  [SK.SESSION_RECAP_DISMISSED_CONTEXT]: [SK.SESSION_RECAP_DISMISSED_CONTEXT],
  [SK.UNIT_VOLUME]: [SK.UNIT_VOLUME],
  [SK.UNIT_LENGTH]: [SK.UNIT_LENGTH],
  [SK.UNIT_WEIGHT]: [SK.UNIT_WEIGHT],
  [SK.UNIT_TEMPERATURE]: [SK.UNIT_TEMPERATURE],
  [SK.SHOW_SOLID]: [SK.SHOW_SOLID, "setting_showSolidFood"],
  [SK.SHOW_WALK]: [SK.SHOW_WALK, "setting_showWalk"],
  [SK.SHOW_MOOD]: [SK.SHOW_MOOD, "setting_showMood"],
  [SK.SYNC_ENABLED]: [SK.SYNC_ENABLED],
  [SK.EVENTS]: [SK.EVENTS, SK.LEGACY_EVENTS],
  [SK.MILESTONES]: [SK.MILESTONES],
  [SK.VACCINATIONS]: [SK.VACCINATIONS],
  [SK.TEMPERATURE]: [SK.TEMPERATURE],
  [SK.ALLERGENS]: [SK.ALLERGENS],
  [SK.PHOTOS]: [SK.PHOTOS],
  [SK.PROFILES]: [SK.PROFILES],
  [SK.MED_HISTORY]: [SK.MED_HISTORY],
};

function readFirst(keys: readonly string[]): string | null {
  for (const key of keys) {
    const value = localStorage.getItem(key);
    if (value !== null) return value;
  }
  return null;
}

function writeCanonical(key: string, value: string): void {
  localStorage.setItem(key, value);
}

function normalizeSolidMode(raw: string | null): SolidMode {
  if (raw === "on" || raw === "off") return raw;
  return "auto";
}

function normalizeBooleanFlag(raw: string | null, fallback = false): boolean {
  if (raw === null) return fallback;
  if (raw === "1" || raw === "true") return true;
  if (raw === "0" || raw === "false") return false;
  return fallback;
}

function normalizeGender(raw: string | null): BabyGender {
  if (raw === "boy" || raw === "girl" || raw === "neutral") return raw;
  return "neutral";
}

function normalizeTrackedFeatures(raw: string | null): string[] {
  if (!raw) return ["sleep", "feeding", "diaper"];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.filter((item): item is string => typeof item === "string");
    }
  } catch {
    // Ignore invalid JSON and fall back to defaults.
  }
  return ["sleep", "feeding", "diaper"];
}

function normalizeUnit<T extends string>(
  raw: string | null,
  allowed: readonly T[],
  fallback: T,
): T {
  return raw && (allowed as readonly string[]).includes(raw) ? (raw as T) : fallback;
}

export function migrateLegacyStorageKeys(): void {
  for (const [canonical, aliases] of Object.entries(LEGACY_GROUPS)) {
    const current = localStorage.getItem(canonical);
    const legacy = readFirst(aliases);
    if (current !== null || legacy === null) continue;

    if (canonical === SK.SHOW_SOLID) {
      writeCanonical(canonical, normalizeSolidMode(legacy));
      continue;
    }

    if (canonical === SK.SHOW_WALK || canonical === SK.SHOW_MOOD || canonical === SK.SYNC_ENABLED) {
      writeCanonical(canonical, normalizeBooleanFlag(legacy) ? "1" : "0");
      continue;
    }

    writeCanonical(canonical, legacy);
  }
}

export function getAuthToken(): string | null {
  migrateLegacyStorageKeys();
  const token = localStorage.getItem(SK.AUTH_TOKEN);
  return isValidAuthToken(token) ? token : null;
}

export function setAuthToken(token: string): void {
  localStorage.setItem(SK.AUTH_TOKEN, token);
}

export function clearAuthToken(): void {
  localStorage.removeItem(SK.AUTH_TOKEN);
}

export function getLastAppVisitAt(): string | null {
  migrateLegacyStorageKeys();
  return localStorage.getItem(SK.LAST_APP_VISIT_AT);
}

export function setLastAppVisitAt(value: string): void {
  localStorage.setItem(SK.LAST_APP_VISIT_AT, value);
}

export function getSessionRecapDismissedContext(): string | null {
  migrateLegacyStorageKeys();
  return localStorage.getItem(SK.SESSION_RECAP_DISMISSED_CONTEXT);
}

export function setSessionRecapDismissedContext(contextKey: string): void {
  localStorage.setItem(SK.SESSION_RECAP_DISMISSED_CONTEXT, contextKey);
}

export function isOnboarded(): boolean {
  migrateLegacyStorageKeys();
  return localStorage.getItem(SK.ONBOARDED) === "true";
}

export function setOnboarded(value: boolean): void {
  localStorage.setItem(SK.ONBOARDED, value ? "true" : "false");
}

export function getBabyProfileState(): BabyProfileState {
  migrateLegacyStorageKeys();

  return {
    name: localStorage.getItem(SK.BABY_NAME) || "Малыш",
    birthDate: localStorage.getItem(SK.BIRTH_DATE) || "2024-09-15",
    gender: normalizeGender(localStorage.getItem(SK.BABY_GENDER)),
    avatar: localStorage.getItem(SK.USER_AVATAR) || "👶",
    userName: localStorage.getItem(SK.USER_NAME) || "Родитель",
    userEmail: localStorage.getItem(SK.USER_EMAIL) || "",
    userRole: localStorage.getItem(SK.USER_ROLE) || "mom",
    trackedFeatures: normalizeTrackedFeatures(localStorage.getItem(SK.TRACKED_FEATURES)),
  };
}

export function saveBabyProfileState(profile: Partial<BabyProfileState>): void {
  if (profile.name !== undefined) localStorage.setItem(SK.BABY_NAME, profile.name);
  if (profile.birthDate !== undefined) localStorage.setItem(SK.BIRTH_DATE, profile.birthDate);
  if (profile.gender !== undefined) localStorage.setItem(SK.BABY_GENDER, profile.gender);
  if (profile.avatar !== undefined) localStorage.setItem(SK.USER_AVATAR, profile.avatar);
  if (profile.userName !== undefined) localStorage.setItem(SK.USER_NAME, profile.userName);
  if (profile.userEmail !== undefined) localStorage.setItem(SK.USER_EMAIL, profile.userEmail);
  if (profile.userRole !== undefined) localStorage.setItem(SK.USER_ROLE, profile.userRole);
  if (profile.trackedFeatures !== undefined) {
    localStorage.setItem(SK.TRACKED_FEATURES, JSON.stringify(profile.trackedFeatures));
  }
}

export function getDisplaySettings(): DisplaySettingsState {
  migrateLegacyStorageKeys();

  return {
    solidMode: normalizeSolidMode(localStorage.getItem(SK.SHOW_SOLID)),
    showWalk: normalizeBooleanFlag(localStorage.getItem(SK.SHOW_WALK), true),
    showMood: normalizeBooleanFlag(localStorage.getItem(SK.SHOW_MOOD), true),
    syncEnabled: normalizeBooleanFlag(localStorage.getItem(SK.SYNC_ENABLED), false),
  };
}

export function saveDisplaySettings(settings: Partial<DisplaySettingsState>): void {
  if (settings.solidMode !== undefined) {
    localStorage.setItem(SK.SHOW_SOLID, settings.solidMode);
  }
  if (settings.showWalk !== undefined) {
    localStorage.setItem(SK.SHOW_WALK, settings.showWalk ? "1" : "0");
  }
  if (settings.showMood !== undefined) {
    localStorage.setItem(SK.SHOW_MOOD, settings.showMood ? "1" : "0");
  }
  if (settings.syncEnabled !== undefined) {
    localStorage.setItem(SK.SYNC_ENABLED, settings.syncEnabled ? "1" : "0");
  }
}

export function getMeasurementUnits(): MeasurementUnitsState {
  migrateLegacyStorageKeys();

  return {
    volume: normalizeUnit(localStorage.getItem(SK.UNIT_VOLUME), ["мл", "унц"] as const, "мл"),
    length: normalizeUnit(localStorage.getItem(SK.UNIT_LENGTH), ["см", "дюйм"] as const, "см"),
    weight: normalizeUnit(localStorage.getItem(SK.UNIT_WEIGHT), ["кг", "фунт"] as const, "кг"),
    temp: normalizeUnit(localStorage.getItem(SK.UNIT_TEMPERATURE), ["°C", "°F"] as const, "°C"),
  };
}

export function saveMeasurementUnits(units: Partial<MeasurementUnitsState>): void {
  if (units.volume !== undefined) localStorage.setItem(SK.UNIT_VOLUME, units.volume);
  if (units.length !== undefined) localStorage.setItem(SK.UNIT_LENGTH, units.length);
  if (units.weight !== undefined) localStorage.setItem(SK.UNIT_WEIGHT, units.weight);
  if (units.temp !== undefined) localStorage.setItem(SK.UNIT_TEMPERATURE, units.temp);
}

// ─── User accounts ────────────────────────────────────────────────────────────

export interface UserAccount {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: string;
  avatar: string;
  createdAt: string;
}

function hashPassword(password: string): string {
  return btoa(unescape(encodeURIComponent(password + ":bt_2024_salt")));
}

function verifyPassword(plain: string, hash: string): boolean {
  return hashPassword(plain) === hash;
}

function getUsers(): UserAccount[] {
  try {
    return JSON.parse(localStorage.getItem(SK.USERS) ?? "[]");
  } catch {
    return [];
  }
}

function saveUsers(users: UserAccount[]): void {
  localStorage.setItem(SK.USERS, JSON.stringify(users));
}

export function findUserByEmail(email: string): UserAccount | undefined {
  return getUsers().find((u) => u.email.toLowerCase() === email.toLowerCase());
}

export function generateToken(userId: string): string {
  return btoa(`${userId}:${Date.now()}`);
}

export function registerUser(data: {
  name: string;
  email: string;
  password: string;
  role: string;
  avatar: string;
}): { success: true; user: UserAccount } | { success: false; error: string } {
  if (findUserByEmail(data.email)) {
    return { success: false, error: "Пользователь с таким email уже существует" };
  }
  const user: UserAccount = {
    id: crypto.randomUUID(),
    name: data.name,
    email: data.email,
    passwordHash: hashPassword(data.password),
    role: data.role,
    avatar: data.avatar,
    createdAt: new Date().toISOString(),
  };
  const users = getUsers();
  users.push(user);
  saveUsers(users);
  return { success: true, user };
}

export function loginUser(
  email: string,
  password: string,
): { success: true; user: UserAccount } | { success: false; error: string } {
  const user = findUserByEmail(email);
  if (!user) return { success: false, error: "Пользователь не найден" };
  if (!verifyPassword(password, user.passwordHash)) {
    return { success: false, error: "Неверный пароль" };
  }
  return { success: true, user };
}

export function resetUserPassword(email: string, newPassword: string): boolean {
  const users = getUsers();
  const idx = users.findIndex((u) => u.email.toLowerCase() === email.toLowerCase());
  if (idx === -1) return false;
  users[idx].passwordHash = hashPassword(newPassword);
  saveUsers(users);
  return true;
}

// ─── Session storage clear ────────────────────────────────────────────────────

export function clearSessionStorage(): void {
  [
    SK.AUTH_TOKEN,
    SK.ONBOARDED,
    SK.BABY_NAME,
    SK.BIRTH_DATE,
    SK.BABY_GENDER,
    SK.USER_EMAIL,
    SK.AUTH_PROVIDER,
    SK.USER_NAME,
    SK.USER_AVATAR,
    SK.USER_ROLE,
    SK.TRACKED_FEATURES,
    SK.LAST_APP_VISIT_AT,
    SK.SESSION_RECAP_DISMISSED_CONTEXT,
    "babyGender",
    "babyBirthDate",
  ].forEach((key) => localStorage.removeItem(key));
}
