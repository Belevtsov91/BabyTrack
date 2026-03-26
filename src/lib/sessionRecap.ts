import {
  getBabyProfileState,
  getLastAppVisitAt,
  getSessionRecapDismissedContext,
} from "./appStorage";
import {
  eventsDB,
  getEventSubType,
  milestonesDB,
  photosDB,
  temperatureDB,
  type BabyEvent,
  type Milestone,
  type PhotoRecord,
  type TemperatureRecord,
} from "./crud";

export type RecapTone =
  | "primary"
  | "sleep"
  | "feeding"
  | "diaper"
  | "activity"
  | "growth"
  | "health"
  | "mood"
  | "milestone";

export type RecapHighlightKind =
  | "sparkles"
  | "sleep"
  | "feeding"
  | "health"
  | "milestone"
  | "photo"
  | "activity";

export interface SessionRecapMetric {
  id: string;
  label: string;
  value: string;
  note: string;
  tone: RecapTone;
}

export interface SessionRecapHighlight {
  id: string;
  kind: RecapHighlightKind;
  title: string;
  description: string;
  tone: RecapTone;
}

export interface SessionRecapStory {
  id: string;
  eyebrow: string;
  title: string;
  description: string;
  tone: RecapTone;
  meta?: string;
  imageUrl?: string;
  emoji?: string;
}

export interface SessionRecapTimelineItem {
  id: string;
  kind: "event" | "milestone" | "photo" | "temperature";
  title: string;
  description: string;
  timeLabel: string;
  tone: RecapTone;
  timestamp: number;
}

export interface SessionRecapSummary {
  mode: "since-last-visit" | "yesterday";
  contextKey: string;
  badgeLabel: string;
  title: string;
  subtitle: string;
  windowLabel: string;
  babyName: string;
  totalItems: number;
  metrics: SessionRecapMetric[];
  highlights: SessionRecapHighlight[];
  stories: SessionRecapStory[];
  timeline: SessionRecapTimelineItem[];
}

interface WindowCandidate {
  mode: SessionRecapSummary["mode"];
  contextKey: string;
  start: Date;
  end: Date;
  events: BabyEvent[];
  milestones: Milestone[];
  photos: PhotoRecord[];
  temperatures: TemperatureRecord[];
  timeline: SessionRecapTimelineItem[];
  totalItems: number;
}

const SESSION_ENTRY_HANDLED_KEY = "babytrack_session_entry_handled";

function parseIsoDateTime(value: string | null): Date | null {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function parseDateOnly(value: string | undefined): Date | null {
  if (!value) return null;
  const parsed = new Date(`${value}T12:00:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function getStartOfYesterday(now: Date): Date {
  return new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 0, 0, 0, 0);
}

function getEndOfYesterday(now: Date): Date {
  return new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 23, 59, 59, 999);
}

function isWithinWindow(date: Date | null, start: Date, end: Date): boolean {
  if (!date) return false;
  const time = date.getTime();
  return time >= start.getTime() && time <= end.getTime();
}

function formatShortDate(date: Date): string {
  return new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "long",
  }).format(date);
}

function formatDateTime(date: Date): string {
  return new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function formatTimelineTime(date: Date): string {
  const now = new Date();
  const sameDay =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate();

  if (sameDay) {
    return new Intl.DateTimeFormat("ru-RU", {
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  }

  return new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "short",
  }).format(date);
}

function formatHours(minutes: number): string {
  if (!Number.isFinite(minutes) || minutes <= 0) return "0 ч";
  const hours = minutes / 60;
  return `${hours >= 10 ? Math.round(hours) : Number(hours.toFixed(1))} ч`;
}

function getTag(tags: string[] | undefined, key: string): string | undefined {
  return tags?.find((tag) => tag.startsWith(`${key}=`))?.slice(key.length + 1);
}

function resolveRenderableImageUrl(url: string | undefined): string | undefined {
  if (!url) return undefined;
  return /^(https?:|data:|blob:)/i.test(url) ? url : undefined;
}

function getToneForEvent(event: BabyEvent): RecapTone {
  const subType = getEventSubType(event);

  if (event.type === "sleep") return "sleep";
  if (event.type === "feeding") return "feeding";
  if (event.type === "diaper") return "diaper";
  if (event.type === "mood") return "mood";
  if (subType === "weight" || subType === "height" || subType === "head") return "growth";
  if (["doctor", "vaccine", "medication", "temperature"].includes(subType ?? "")) return "health";
  if (["walk", "bath"].includes(subType ?? "")) return "activity";
  return "activity";
}

function getEventDetail(event: BabyEvent): string {
  const subType = getEventSubType(event);

  if (event.description) return event.description;
  if (subType === "breast") return "Кормление грудью";
  if (subType === "bottle") return "Бутылочка";
  if (subType === "pump") return "Сцеживание";
  if (subType === "solid") return "Прикорм";
  if (subType === "walk") return "Прогулка";
  if (subType === "bath") return "Купание";
  if (subType === "doctor") return "Визит к врачу";
  if (subType === "vaccine") return "Прививка";
  if (subType === "medication") return "Приём лекарства";
  if (subType === "weight") return "Контроль веса";
  if (subType === "height") return "Контроль роста";
  if (subType === "head") return "Измерение головы";
  if (event.type === "sleep") return "Сон и восстановление";
  if (event.type === "diaper") return "Уход и гигиена";
  if (event.type === "mood") return "Эмоциональный день";
  return "Новая запись в журнале";
}

function getEventEmoji(event: BabyEvent): string {
  const subType = getEventSubType(event);

  if (event.type === "sleep") return "🌙";
  if (event.type === "feeding") {
    if (subType === "breast") return "🤱";
    if (subType === "pump") return "🥛";
    if (subType === "solid") return "🥣";
    return "🍼";
  }
  if (event.type === "diaper") return "👶";
  if (event.type === "mood") return "😊";
  if (subType === "doctor") return "🩺";
  if (subType === "vaccine") return "💉";
  if (subType === "medication") return "💊";
  if (subType === "weight") return "⚖️";
  if (subType === "height") return "📏";
  if (subType === "head") return "🔵";
  if (subType === "walk") return "🚶";
  if (subType === "bath") return "🛁";
  return "✨";
}

function buildTimelineFromWindow(
  events: BabyEvent[],
  milestones: Milestone[],
  photos: PhotoRecord[],
  temperatures: TemperatureRecord[],
  start: Date,
  end: Date,
): SessionRecapTimelineItem[] {
  const eventTimestamps = new Set(events.map((event) => event.timestamp));

  const eventItems = events.map((event) => {
    const timestamp = new Date(event.timestamp);
    return {
      id: `event-${event.id}`,
      kind: "event" as const,
      title: event.title || "Событие",
      description: getEventDetail(event),
      timeLabel: formatTimelineTime(timestamp),
      tone: getToneForEvent(event),
      timestamp: timestamp.getTime(),
    };
  });

  const milestoneItems = milestones
    .map((milestone) => {
      const timestamp = parseDateOnly(milestone.date);
      if (!isWithinWindow(timestamp, start, end)) return null;
      return {
        id: `milestone-${milestone.id}`,
        kind: "milestone" as const,
        title: milestone.title,
        description: "Новая веха развития",
        timeLabel: formatTimelineTime(timestamp),
        tone: "milestone" as const,
        timestamp: timestamp.getTime(),
      };
    })
    .filter((item) => item !== null);

  const photoItems = photos.map((photo) => {
    const timestamp = new Date(photo.timestamp);
    return {
      id: `photo-${photo.id}`,
      kind: "photo" as const,
      title: photo.caption || "Новая фотография",
      description: "Момент сохранён в фотодневнике",
      timeLabel: formatTimelineTime(timestamp),
      tone: "milestone" as const,
      timestamp: timestamp.getTime(),
    };
  });

  const tempItems = temperatures
    .filter((record) => !eventTimestamps.has(record.timestamp))
    .map((record) => {
      const timestamp = new Date(record.timestamp);
      return {
        id: `temperature-${record.id}`,
        kind: "temperature" as const,
        title: `Температура ${record.value.toFixed(1)}°`,
        description: record.notes || "Проверка самочувствия",
        timeLabel: formatTimelineTime(timestamp),
        tone: "health" as const,
        timestamp: timestamp.getTime(),
      };
    });

  return [...eventItems, ...milestoneItems, ...photoItems, ...tempItems]
    .sort((left, right) => right.timestamp - left.timestamp)
    .slice(0, 5);
}

function buildWindowCandidate(
  mode: SessionRecapSummary["mode"],
  start: Date,
  end: Date,
): WindowCandidate | null {
  const events = eventsDB
    .getAll()
    .filter((event) => isWithinWindow(parseIsoDateTime(event.timestamp), start, end));
  const milestones = milestonesDB
    .getAll()
    .filter((milestone) => milestone.completed && isWithinWindow(parseDateOnly(milestone.date), start, end));
  const photos = photosDB
    .getAll()
    .filter((photo) => isWithinWindow(parseIsoDateTime(photo.timestamp), start, end));
  const temperatures = temperatureDB
    .getAll()
    .filter((record) => isWithinWindow(parseIsoDateTime(record.timestamp), start, end));
  const timeline = buildTimelineFromWindow(events, milestones, photos, temperatures, start, end);
  const totalItems = events.length + milestones.length + photos.length + temperatures.length;

  if (totalItems <= 0) return null;

  return {
    mode,
    contextKey:
      mode === "since-last-visit"
        ? `visit:${start.toISOString()}:${timeline[0]?.timestamp ?? end.getTime()}`
        : `yesterday:${start.toISOString().slice(0, 10)}`,
    start,
    end,
    events,
    milestones,
    photos,
    temperatures,
    timeline,
    totalItems,
  };
}

function buildMetrics(window: WindowCandidate): SessionRecapMetric[] {
  const sleepEvents = window.events.filter((event) => event.type === "sleep");
  const sleepMinutes = sleepEvents.reduce((total, event) => total + (event.duration ?? 0), 0);
  const feedingEvents = window.events.filter((event) => event.type === "feeding");
  const solidFeedings = feedingEvents.filter((event) => getEventSubType(event) === "solid").length;
  const diaperEvents = window.events.filter((event) => event.type === "diaper");
  const healthEvents = window.events.filter((event) =>
    ["doctor", "vaccine", "medication", "temperature"].includes(getEventSubType(event) ?? ""),
  );
  const specialMoments = window.milestones.length + window.photos.length;

  return [
    {
      id: "sleep",
      label: "Сон",
      value: formatHours(sleepMinutes),
      note: sleepEvents.length > 0 ? `${sleepEvents.length} отрезка сна` : "Без записей сна",
      tone: "sleep",
    },
    {
      id: "feeding",
      label: "Кормления",
      value: String(feedingEvents.length),
      note: solidFeedings > 0 ? `${solidFeedings} прикорма` : "Ритм питания",
      tone: "feeding",
    },
    {
      id: "diaper",
      label: "Подгузники",
      value: String(diaperEvents.length),
      note: diaperEvents.length > 0 ? "Уход и гигиена" : "Нет новых смен",
      tone: "diaper",
    },
    {
      id: "moments",
      label: specialMoments > 0 ? "Моменты" : "Забота",
      value: String(specialMoments > 0 ? specialMoments : healthEvents.length + window.temperatures.length),
      note:
        specialMoments > 0
          ? "Фото и достижения"
          : healthEvents.length + window.temperatures.length > 0
            ? "Контроль самочувствия"
            : "Спокойный период",
      tone: specialMoments > 0 ? "milestone" : "health",
    },
  ];
}

function buildHighlights(window: WindowCandidate): SessionRecapHighlight[] {
  const sleepEvents = window.events.filter((event) => event.type === "sleep");
  const sleepMinutes = sleepEvents.reduce((total, event) => total + (event.duration ?? 0), 0);
  const feedingEvents = window.events.filter((event) => event.type === "feeding");
  const walkEvents = window.events.filter((event) => ["walk", "bath"].includes(getEventSubType(event) ?? ""));
  const healthEvents = window.events.filter((event) =>
    ["doctor", "vaccine", "medication", "temperature"].includes(getEventSubType(event) ?? ""),
  );

  const items: SessionRecapHighlight[] = [
    {
      id: "window",
      kind: "sparkles",
      title: window.mode === "since-last-visit" ? "С прошлого визита" : "За вчерашний день",
      description:
        window.mode === "since-last-visit"
          ? `${window.totalItems} новых записей с ${formatDateTime(window.start)}`
          : `Собрали ключевые события за ${formatShortDate(window.start)}`,
      tone: "primary",
    },
  ];

  if (sleepMinutes > 0) {
    items.push({
      id: "sleep",
      kind: "sleep",
      title: "Сон",
      description: `${formatHours(sleepMinutes)} сна за ${sleepEvents.length} интервала`,
      tone: "sleep",
    });
  }

  if (feedingEvents.length > 0) {
    items.push({
      id: "feeding",
      kind: "feeding",
      title: "Питание",
      description: `${feedingEvents.length} кормлений и привычный ритм дня`,
      tone: "feeding",
    });
  }

  if (window.milestones.length > 0 || window.photos.length > 0) {
    items.push({
      id: "moments",
      kind: window.milestones.length > 0 ? "milestone" : "photo",
      title: window.milestones.length > 0 ? "Новые достижения" : "Сохранённые моменты",
      description:
        window.milestones.length > 0
          ? `${window.milestones.length} этапов развития отмечено`
          : `${window.photos.length} фото добавлено в дневник`,
      tone: "milestone",
    });
  }

  if (healthEvents.length + window.temperatures.length > 0) {
    items.push({
      id: "health",
      kind: "health",
      title: "Забота о здоровье",
      description: `${healthEvents.length + window.temperatures.length} медицинских заметок и проверок`,
      tone: "health",
    });
  }

  if (walkEvents.length > 0) {
    items.push({
      id: "activity",
      kind: "activity",
      title: "Движение и ритуалы",
      description: `${walkEvents.length} активных эпизода: прогулки, купание и привычные ритуалы`,
      tone: "activity",
    });
  }

  return items.slice(0, 4);
}

function buildStories(window: WindowCandidate): SessionRecapStory[] {
  const sortedEvents = window.events
    .slice()
    .sort((left, right) => {
      const leftTime = parseIsoDateTime(left.timestamp)?.getTime() ?? 0;
      const rightTime = parseIsoDateTime(right.timestamp)?.getTime() ?? 0;
      return rightTime - leftTime;
    });
  const sortedMilestones = window.milestones
    .slice()
    .sort((left, right) => {
      const leftTime = parseDateOnly(left.date)?.getTime() ?? 0;
      const rightTime = parseDateOnly(right.date)?.getTime() ?? 0;
      return rightTime - leftTime;
    });
  const sortedPhotos = window.photos
    .slice()
    .sort((left, right) => {
      const leftTime = parseIsoDateTime(left.timestamp)?.getTime() ?? 0;
      const rightTime = parseIsoDateTime(right.timestamp)?.getTime() ?? 0;
      return rightTime - leftTime;
    });

  const sleepEvents = window.events.filter((event) => event.type === "sleep");
  const sleepMinutes = sleepEvents.reduce((total, event) => total + (event.duration ?? 0), 0);
  const feedingEvents = window.events.filter((event) => event.type === "feeding");
  const diaperEvents = window.events.filter((event) => event.type === "diaper");
  const healthCount =
    window.events.filter((event) =>
      ["doctor", "vaccine", "medication", "temperature"].includes(getEventSubType(event) ?? ""),
    ).length + window.temperatures.length;

  const stories: SessionRecapStory[] = [
    {
      id: "overview",
      eyebrow: window.mode === "since-last-visit" ? "Пока вас не было" : "Вчерашний ритм",
      title:
        window.mode === "since-last-visit"
          ? `${window.totalItems} новых моментов`
          : `${window.totalItems} событий за день`,
      description: [
        sleepEvents.length > 0 ? `${formatHours(sleepMinutes)} сна` : "без записей сна",
        `${feedingEvents.length} кормлений`,
        `${diaperEvents.length} смен`,
      ].join(" · "),
      tone: "primary",
      emoji: "✨",
      meta:
        window.mode === "since-last-visit"
          ? `с ${formatDateTime(window.start)}`
          : formatShortDate(window.start),
    },
  ];

  const latestPhoto = sortedPhotos[0];
  if (latestPhoto) {
    const photoTime = parseIsoDateTime(latestPhoto.timestamp);
    stories.push({
      id: `photo-${latestPhoto.id}`,
      eyebrow: "Фотодневник",
      title: latestPhoto.caption || "Сохранён новый кадр",
      description: "Новый момент добавлен в дневник, чтобы потом вернуться к нему одним взглядом.",
      tone: "milestone",
      imageUrl: resolveRenderableImageUrl(latestPhoto.url),
      emoji: getTag(latestPhoto.tags, "emoji") ?? "📷",
      meta: photoTime ? formatDateTime(photoTime) : undefined,
    });
  }

  const latestMilestone = sortedMilestones[0];
  if (latestMilestone) {
    const milestoneTime = parseDateOnly(latestMilestone.date);
    stories.push({
      id: `milestone-${latestMilestone.id}`,
      eyebrow: "Достижение",
      title: latestMilestone.title,
      description: "Веха развития уже отмечена и теперь стала частью истории роста.",
      tone: "milestone",
      imageUrl: resolveRenderableImageUrl(latestMilestone.photoUrl),
      emoji: latestMilestone.emoji,
      meta: milestoneTime ? formatShortDate(milestoneTime) : undefined,
    });
  }

  const featuredEvent =
    sortedEvents.find((event) => getEventSubType(event) !== "diaper") ??
    sortedEvents[0];
  if (featuredEvent) {
    const eventTime = parseIsoDateTime(featuredEvent.timestamp);
    stories.push({
      id: `event-${featuredEvent.id}`,
      eyebrow: "Последний акцент",
      title: featuredEvent.title || "Новая запись",
      description: getEventDetail(featuredEvent),
      tone: getToneForEvent(featuredEvent),
      emoji: getEventEmoji(featuredEvent),
      meta: eventTime ? formatDateTime(eventTime) : undefined,
    });
  }

  if (healthCount > 0) {
    stories.push({
      id: "health",
      eyebrow: "Самочувствие",
      title: "Забота о здоровье",
      description: `${healthCount} заметок о самочувствии, лекарствах и контрольных замерах за это окно.`,
      tone: "health",
      emoji: "💙",
      meta: window.mode === "since-last-visit" ? "С прошлого входа" : "За вчера",
    });
  } else if (feedingEvents.length > 0 || sleepEvents.length > 0) {
    stories.push({
      id: "routine",
      eyebrow: "Ритм дня",
      title: "Спокойная рутина",
      description: "Сон, кормления и привычные ритуалы собрали ровный темп без резких скачков.",
      tone: sleepMinutes >= feedingEvents.length * 30 ? "sleep" : "feeding",
      emoji: sleepMinutes >= feedingEvents.length * 30 ? "🌙" : "🍼",
      meta: `${sleepEvents.length} сна · ${feedingEvents.length} кормлений`,
    });
  }

  return stories.slice(0, 4);
}

function toSummary(window: WindowCandidate): SessionRecapSummary {
  const babyName = getBabyProfileState().name;
  const badgeLabel = window.mode === "since-last-visit" ? "С прошлого входа" : "Вчера";
  const title = window.mode === "since-last-visit" ? "Пока вас не было" : "Вчерашний день";
  const subtitle =
    window.mode === "since-last-visit"
      ? `${babyName} успел накопить новые записи, пока приложение было закрыто.`
      : `${babyName} прожил насыщенный день. Вот короткая сводка перед началом новой сессии.`;
  const windowLabel =
    window.mode === "since-last-visit"
      ? `С ${formatDateTime(window.start)} до ${formatDateTime(window.end)}`
      : formatShortDate(window.start);

  return {
    mode: window.mode,
    contextKey: window.contextKey,
    badgeLabel,
    title,
    subtitle,
    windowLabel,
    babyName,
    totalItems: window.totalItems,
    metrics: buildMetrics(window),
    highlights: buildHighlights(window),
    stories: buildStories(window),
    timeline: window.timeline,
  };
}

export function buildSessionRecapSummary(): SessionRecapSummary | null {
  const now = new Date();
  const lastVisitAt = parseIsoDateTime(getLastAppVisitAt());
  const sinceLastVisit =
    lastVisitAt && lastVisitAt.getTime() < now.getTime()
      ? buildWindowCandidate("since-last-visit", lastVisitAt, now)
      : null;
  const yesterday = buildWindowCandidate("yesterday", getStartOfYesterday(now), getEndOfYesterday(now));

  if (sinceLastVisit) return toSummary(sinceLastVisit);
  if (yesterday) return toSummary(yesterday);
  return null;
}

export function shouldShowSessionRecap(): boolean {
  const summary = buildSessionRecapSummary();
  if (!summary) return false;
  return getSessionRecapDismissedContext() !== summary.contextKey;
}

export function hasHandledSessionEntry(): boolean {
  if (typeof window === "undefined") return true;
  return window.sessionStorage.getItem(SESSION_ENTRY_HANDLED_KEY) === "1";
}

export function markSessionEntryHandled(): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(SESSION_ENTRY_HANDLED_KEY, "1");
}
