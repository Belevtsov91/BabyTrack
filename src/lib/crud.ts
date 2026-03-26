// CRUD Data Layer with localStorage persistence
import { SK } from "./storageKeys";

export interface BabyEvent {
  id: string;
  type: 'sleep' | 'feeding' | 'diaper' | 'activity' | 'mood' | 'temperature' | 'milestone';
  title: string;
  description?: string;
  timestamp: string;
  duration?: number; // minutes
  data?: Record<string, any>;
  favorite?: boolean;
}

export interface Milestone {
  id: string;
  title: string;
  emoji: string;
  category: 'motor' | 'social' | 'speech' | 'feeding';
  date?: string;
  photoUrl?: string;
  completed: boolean;
}

export interface VaccinationRecord {
  id: string;
  name: string;
  scheduledDate: string;
  completedDate?: string;
  status: 'pending' | 'completed' | 'overdue';
  notes?: string;
}

export interface TemperatureRecord {
  id: string;
  value: number;
  timestamp: string;
  notes?: string;
}

export interface AllergenRecord {
  id: string;
  food: string;
  date: string;
  reaction: 'none' | 'mild' | 'watch' | 'allergic';
  notes?: string;
}

export interface PhotoRecord {
  id: string;
  url: string;
  caption?: string;
  eventId?: string;
  timestamp: string;
  tags?: string[];
}

type EventData = Record<string, unknown>;

function isObjectRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function sortByTimestampDesc<T extends { timestamp?: string }>(items: T[]): T[] {
  return [...items].sort((a, b) => {
    const left = a.timestamp ? new Date(a.timestamp).getTime() : 0;
    const right = b.timestamp ? new Date(b.timestamp).getTime() : 0;
    return right - left;
  });
}

function normalizeEventRecord(event: BabyEvent): BabyEvent {
  const data = isObjectRecord(event.data) ? ({ ...event.data } as EventData) : undefined;

  if (data && typeof data.subType === "string" && typeof data.eventSubType !== "string") {
    data.eventSubType = data.subType;
  }

  return data ? { ...event, data } : event;
}

function normalizeStoreData<T>(key: string, items: T[]): { changed: boolean; items: T[] } {
  if (key !== SK.EVENTS) return { changed: false, items };

  let changed = false;
  const normalized = items.map((item) => {
    const next = normalizeEventRecord(item as BabyEvent) as T;
    if (JSON.stringify(next) !== JSON.stringify(item)) changed = true;
    return next;
  });
  const sorted = sortByTimestampDesc(normalized as BabyEvent[]) as T[];

  if (JSON.stringify(sorted) !== JSON.stringify(items)) changed = true;

  return { changed, items: sorted };
}

// Generic CRUD helpers
function getStore<T>(key: string): T[] {
  try {
    const data = localStorage.getItem(key);
    const parsed = data ? JSON.parse(data) : [];
    if (!Array.isArray(parsed)) return [];

    const normalized = normalizeStoreData(key, parsed);
    if (normalized.changed) setStore(key, normalized.items);
    return normalized.items;
  } catch {
    return [];
  }
}

function setStore<T>(key: string, data: T[]): void {
  localStorage.setItem(key, JSON.stringify(data));
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function getEventSubType(event: Pick<BabyEvent, "type" | "data">): string | undefined {
  if (!isObjectRecord(event.data)) return event.type;

  const raw = event.data.eventSubType ?? event.data.subType;
  return typeof raw === "string" && raw.trim().length > 0 ? raw : event.type;
}

function syncTemperatureFromEvent(event: BabyEvent): void {
  const data = isObjectRecord(event.data) ? event.data : null;
  const value = data?.temperature;
  if (typeof value !== "number" || Number.isNaN(value)) return;

  const temperatureItems = sortByTimestampDesc(getStore<TemperatureRecord>(SK.TEMPERATURE));
  const exists = temperatureItems.some(
    (item) => item.timestamp === event.timestamp && item.value === value,
  );
  if (exists) return;

  const next: TemperatureRecord = {
    id: generateId(),
    value,
    timestamp: event.timestamp,
    notes: event.description,
  };

  setStore(SK.TEMPERATURE, sortByTimestampDesc([next, ...temperatureItems]));
}

function syncVaccinationFromEvent(event: BabyEvent): void {
  const data = isObjectRecord(event.data) ? event.data : null;
  const vaccineName = data?.vaccineName;
  if (typeof vaccineName !== "string" || vaccineName.trim().length === 0) return;

  const items = getStore<VaccinationRecord>(SK.VACCINATIONS);
  const completedDate = event.timestamp.slice(0, 10);
  const normalizedName = vaccineName.trim().toLowerCase();
  const existingIndex = items.findIndex((item) => item.name.trim().toLowerCase() === normalizedName);

  if (existingIndex >= 0) {
    const existing = items[existingIndex];
    items[existingIndex] = {
      ...existing,
      name: vaccineName.trim(),
      scheduledDate: existing.scheduledDate || completedDate,
      completedDate,
      status: "completed",
      notes: event.description || existing.notes,
    };
    setStore(SK.VACCINATIONS, items);
    return;
  }

  const next: VaccinationRecord = {
    id: generateId(),
    name: vaccineName.trim(),
    scheduledDate: completedDate,
    completedDate,
    status: "completed",
    notes: event.description,
  };

  setStore(SK.VACCINATIONS, [next, ...items]);
}

function syncDerivedStoresFromEvent(event: BabyEvent): void {
  const subtype = getEventSubType(event);

  if (subtype === "temperature" || event.type === "temperature") {
    syncTemperatureFromEvent(event);
  }

  if (subtype === "vaccine") {
    syncVaccinationFromEvent(event);
  }
}

// CRUD Factory
function createCRUD<T extends { id: string }>(storageKey: string) {
  return {
    getAll: (): T[] => getStore<T>(storageKey),

    getById: (id: string): T | undefined => {
      return getStore<T>(storageKey).find(item => item.id === id);
    },

    create: (item: Omit<T, 'id'>): T => {
      // Guard: timestamp must be a valid ISO string when present
      if ('timestamp' in item) {
        const ts = (item as any).timestamp;
        if (!ts || isNaN(new Date(ts).getTime())) {
          throw new Error(`[${storageKey}] invalid or missing timestamp: "${ts}"`);
        }
      }
      const items = getStore<T>(storageKey);
      const baseItem = { ...item, id: generateId() } as T;
      const newItem = storageKey === SK.EVENTS
        ? (normalizeEventRecord(baseItem as unknown as BabyEvent) as unknown as T)
        : baseItem;

      items.unshift(newItem);
      setStore(storageKey, items);

      if (storageKey === SK.EVENTS) {
        syncDerivedStoresFromEvent(newItem as unknown as BabyEvent);
      }

      return newItem;
    },

    update: (id: string, updates: Partial<T>): T | undefined => {
      const items = getStore<T>(storageKey);
      const index = items.findIndex(item => item.id === id);
      if (index === -1) return undefined;
      items[index] = { ...items[index], ...updates };
      setStore(storageKey, items);
      return items[index];
    },

    delete: (id: string): boolean => {
      const items = getStore<T>(storageKey);
      const filtered = items.filter(item => item.id !== id);
      if (filtered.length === items.length) return false;
      setStore(storageKey, filtered);
      return true;
    },

    deleteAll: (): void => {
      setStore(storageKey, []);
    },

    count: (): number => getStore<T>(storageKey).length,
  };
}

// Exported CRUD instances
export const eventsDB = createCRUD<BabyEvent>(SK.EVENTS);
export const milestonesDB = createCRUD<Milestone>(SK.MILESTONES);
export const vaccinationsDB = createCRUD<VaccinationRecord>(SK.VACCINATIONS);
export const temperatureDB = createCRUD<TemperatureRecord>(SK.TEMPERATURE);
export const allergensDB = createCRUD<AllergenRecord>(SK.ALLERGENS);
export const photosDB = createCRUD<PhotoRecord>(SK.PHOTOS);

export function getEventsBySubType(subType: string): BabyEvent[] {
  return eventsDB.getAll().filter((event) => getEventSubType(event) === subType);
}

export function getLatestEventBySubType(subType: string): BabyEvent | undefined {
  return getEventsBySubType(subType)[0];
}

export function countEventsBySubTypeToday(subType: string, referenceDate = new Date()): number {
  const dayKey = referenceDate.toISOString().slice(0, 10);
  return getEventsBySubType(subType).filter((event) => event.timestamp.slice(0, 10) === dayKey).length;
}

export function getEventsForDate(dateKey: string): BabyEvent[] {
  return eventsDB.getAll().filter((event) => event.timestamp.slice(0, 10) === dateKey);
}

export function getTemperatureHistory(): TemperatureRecord[] {
  return sortByTimestampDesc(temperatureDB.getAll());
}

const APP_STORAGE_KEYS = new Set<string>([
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
]);

function isAppStorageKey(key: string): boolean {
  return key.startsWith("babytrack_") || APP_STORAGE_KEYS.has(key);
}

function exportStorageSnapshot(): Record<string, string> {
  const snapshot: Record<string, string> = {};
  for (const key of Object.keys(localStorage)) {
    if (!isAppStorageKey(key)) continue;
    const value = localStorage.getItem(key);
    if (value !== null) snapshot[key] = value;
  }
  return snapshot;
}

// Export/Import all data
export function exportAllData(): string {
  const data = {
    version: 2,
    exportDate: new Date().toISOString(),
    storage: exportStorageSnapshot(),
    summary: {
      events: eventsDB.count(),
      milestones: milestonesDB.count(),
      vaccinations: vaccinationsDB.count(),
      temperature: temperatureDB.count(),
      allergens: allergensDB.count(),
      photos: photosDB.count(),
    },
  };
  return JSON.stringify(data, null, 2);
}

export function importAllData(json: string): boolean {
  try {
    const data = JSON.parse(json);
    if (data && typeof data === "object" && data.storage && typeof data.storage === "object") {
      for (const [key, value] of Object.entries(data.storage as Record<string, unknown>)) {
        if (!isAppStorageKey(key) || typeof value !== "string") continue;
        localStorage.setItem(key, value);
      }
      return true;
    }
    if (data.events) localStorage.setItem(SK.EVENTS, JSON.stringify(data.events));
    if (data.milestones) localStorage.setItem(SK.MILESTONES, JSON.stringify(data.milestones));
    if (data.vaccinations) localStorage.setItem(SK.VACCINATIONS, JSON.stringify(data.vaccinations));
    if (data.temperature) localStorage.setItem(SK.TEMPERATURE, JSON.stringify(data.temperature));
    if (data.allergens) localStorage.setItem(SK.ALLERGENS, JSON.stringify(data.allergens));
    if (data.photos) localStorage.setItem(SK.PHOTOS, JSON.stringify(data.photos));
    if (data.babyName) localStorage.setItem(SK.BABY_NAME, data.babyName);
    if (data.birthDate) localStorage.setItem(SK.BIRTH_DATE, data.birthDate);
    return true;
  } catch {
    return false;
  }
}
