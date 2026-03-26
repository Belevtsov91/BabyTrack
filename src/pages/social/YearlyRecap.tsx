/**
 * ФАЙЛ: src/pages/social/YearlyRecap.tsx
 */

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Camera,
  ChevronLeft,
  ChevronRight,
  Footprints,
  Heart,
  MessageCircle,
  Moon,
  Share2,
  Shield,
  Sparkles,
  Star,
  Thermometer,
  UtensilsCrossed,
} from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import SpotlightCard from "@/components/ui/spotlight-card";
import StickyScrollCardsSection, { type StickyScrollCardItem } from "@/components/ui/sticky-scroll-cards-section";
import { allergensDB, eventsDB, getEventSubType, milestonesDB, photosDB, temperatureDB, vaccinationsDB } from "@/lib/crud";
import type { AllergenRecord, BabyEvent, Milestone, PhotoRecord, VaccinationRecord, TemperatureRecord } from "@/lib/crud";
import RadialOrbitalTimeline, { type RadialTimelineItem } from "@/components/ui/radial-orbital-timeline";

const hca = (c: string, a: number) => c.replace(/\)$/, ` / ${a})`);
const YEAR = new Date().getFullYear();

interface StatCard {
  emoji: string;
  label: string;
  value: number;
  suffix: string;
  color: string;
}

interface MonthPoint {
  m: string;
  v: number;
}

interface MomentCard {
  emoji: string;
  title: string;
  date: string;
  color: string;
  desc: string;
  eyebrow?: string;
  imageUrl?: string;
}

type OrbitSeed = Omit<RadialTimelineItem, "id" | "relatedIds"> & {
  sortTime: number;
};

const MONTH_LABELS = ["Янв", "Фев", "Мар", "Апр", "Май", "Июн", "Июл", "Авг", "Сен", "Окт", "Ноя", "Дек"];

const DEFAULT_STATS: StatCard[] = [
  { emoji: "🍼", label: "Кормлений", value: 1247, suffix: "", color: "hsl(var(--feeding))" },
  { emoji: "🌙", label: "Часов сна", value: 2920, suffix: "ч", color: "hsl(var(--sleep))" },
  { emoji: "👶", label: "Подгузников", value: 876, suffix: "", color: "hsl(var(--diaper))" },
  { emoji: "📏", label: "Выросли на", value: 21, suffix: "см", color: "hsl(var(--activity))" },
  { emoji: "⚖️", label: "Набрали", value: 5.8, suffix: "кг", color: "hsl(var(--health))" },
  { emoji: "🏆", label: "Достижений", value: 12, suffix: "", color: "hsl(var(--milestone))" },
  { emoji: "💊", label: "Лекарств", value: 43, suffix: "", color: "hsl(var(--diaper))" },
  { emoji: "💉", label: "Прививок", value: 9, suffix: "", color: "hsl(var(--feeding))" },
];

const DEFAULT_MONTHS: MonthPoint[] = [
  { m:"Сен", v:45 }, { m:"Окт", v:78 }, { m:"Ноя", v:92 },
  { m:"Дек", v:88 }, { m:"Янв", v:95 }, { m:"Фев", v:102},
  { m:"Мар", v:87 }, { m:"Апр", v:110}, { m:"Май", v:98 },
  { m:"Июн", v:115}, { m:"Июл", v:88 }, { m:"Авг", v:73 },
];

const DEFAULT_MOMENTS: MomentCard[] = [
  { emoji:"😊", title:"Первая улыбка",    date:"15 ноября", color:"hsl(var(--mood))", desc:"Осознанная социальная улыбка в 2 месяца" },
  { emoji:"🔄", title:"Перевернулся!",    date:"8 января",  color:"hsl(var(--activity))", desc:"Самостоятельно перевернулся со спины на живот" },
  { emoji:"🥣", title:"Первый прикорм",   date:"15 марта",  color:"hsl(var(--feeding))", desc:"Яблочное пюре — съел с аппетитом!" },
  { emoji:"🪑", title:"Сидит сам",        date:"20 апреля", color:"hsl(var(--diaper))",  desc:"Сидит без поддержки уже 10 минут" },
  { emoji:"🐛", title:"Начал ползать",    date:"15 июня",   color:"hsl(var(--milestone))", desc:"Активное ползание, очень быстрый!" },
];

const ORBIT_FALLBACK_ICONS = [Heart, Sparkles, UtensilsCrossed, Footprints, Star] as const;

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function getMilestoneOrbitMeta(category: Milestone["category"]) {
  switch (category) {
    case "motor":
      return { icon: Footprints, accent: "hsl(var(--activity))", label: "Движение" };
    case "social":
      return { icon: Heart, accent: "hsl(var(--mood))", label: "Эмоции" };
    case "speech":
      return { icon: MessageCircle, accent: "hsl(var(--feeding))", label: "Общение" };
    case "feeding":
      return { icon: UtensilsCrossed, accent: "hsl(var(--diaper))", label: "Питание" };
    default:
      return { icon: Sparkles, accent: "hsl(var(--milestone))", label: "Этап" };
  }
}

function getEventOrbitMeta(event: BabyEvent) {
  const subType = getEventSubType(event);

  switch (subType) {
    case "feeding":
      return { icon: UtensilsCrossed, accent: "hsl(var(--feeding))", label: "Режим питания" };
    case "sleep":
      return { icon: Moon, accent: "hsl(var(--sleep))", label: "Сон" };
    case "temperature":
      return { icon: Thermometer, accent: "hsl(var(--health))", label: "Здоровье" };
    case "vaccine":
      return { icon: Shield, accent: "hsl(var(--milestone))", label: "Забота о здоровье" };
    default:
      return { icon: Sparkles, accent: "hsl(var(--activity))", label: "Живой ритм" };
  }
}

function formatDateLabel(date: string | undefined, fallback: string): string {
  if (!date) return fallback;
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return fallback;
  return parsed.toLocaleDateString("ru-RU", { day: "numeric", month: "long" });
}

function getTag(tags: string[] | undefined, key: string): string | undefined {
  return tags?.find((tag) => tag.startsWith(`${key}=`))?.slice(key.length + 1);
}

function toTime(value: string | undefined): number {
  if (!value) return 0;
  const time = new Date(value).getTime();
  return Number.isNaN(time) ? 0 : time;
}

function MonthBars({ months }: { months: MonthPoint[] }) {
  const max = Math.max(...months.map((m) => m.v), 1);

  return (
    <SpotlightCard
      tone="activity"
      intensity="soft"
      className="mx-4 rounded-3xl p-4 md:mx-6"
    >
      <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-4">
        📅 Активность по месяцам
      </p>
      <div className="flex h-28 items-end gap-1.5">
        {months.map((m, i) => {
          const pct = m.v / max;
          const isCurrent = i === months.length - 1;
          return (
            <div key={`${m.m}-${i}`} className="flex flex-1 flex-col items-center gap-1">
              <motion.div
                className="w-full rounded-t-lg"
                style={{
                  background: isCurrent
                    ? "linear-gradient(180deg, hsl(var(--sleep)), hsl(var(--milestone)))"
                    : `hsl(260,40%,${20 + Math.round(pct * 18)}%)`,
                  height: `${pct * 100}%`,
                  minHeight: 4,
                  boxShadow: isCurrent ? "0 0 10px hsl(var(--sleep))" : "none",
                }}
                initial={{ height: 0 }}
                animate={{ height: `${pct * 100}%` }}
                transition={{ duration: 0.8, delay: i * 0.05, ease: "easeOut" }}
              />
              <span className="text-[8px] text-muted-foreground">{m.m}</span>
            </div>
          );
        })}
      </div>
    </SpotlightCard>
  );
}

function TopMoments({ moments }: { moments: MomentCard[] }) {
  const [idx, setIdx] = useState(0);
  const [dir, setDir] = useState(1);
  const safeMoments = moments.length > 0 ? moments : DEFAULT_MOMENTS;
  const moment = safeMoments[idx % safeMoments.length];

  const go = (delta: number) => {
    setDir(delta);
    setIdx((current) => (current + delta + safeMoments.length) % safeMoments.length);
  };

  return (
    <div className="mx-4 md:mx-6">
      <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">
        ⭐ Топ моменты года
      </p>
      <div className="relative overflow-hidden rounded-3xl" style={{ minHeight: 180 }}>
        <AnimatePresence mode="wait" custom={dir}>
          <motion.div
            key={idx}
            custom={dir}
            initial={{ x: dir > 0 ? 200 : -200, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: dir > 0 ? -200 : 200, opacity: 0 }}
            transition={{ duration: 0.32 }}
          >
            <SpotlightCard
              accent={moment.color}
              intensity="strong"
              className="rounded-3xl p-6 text-center"
            >
              <motion.span
                className="mb-3 block text-6xl"
                animate={{ scale: [1, 1.15, 1] }}
                transition={{ duration: 0.6 }}
              >
                {moment.emoji}
              </motion.span>
              <p className="text-lg font-bold text-foreground">{moment.title}</p>
              <p className="mt-1 text-xs" style={{ color: moment.color }}>{moment.date}</p>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{moment.desc}</p>
            </SpotlightCard>
          </motion.div>
        </AnimatePresence>

        <button
          onClick={() => go(-1)}
          className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/30 flex items-center justify-center"
        >
          <ChevronLeft className="w-4 h-4 text-white" />
        </button>
        <button
          onClick={() => go(1)}
          className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/30 flex items-center justify-center"
        >
          <ChevronRight className="w-4 h-4 text-white" />
        </button>
      </div>

      <div className="flex justify-center gap-1.5 mt-3">
        {safeMoments.map((_, i) => (
          <motion.div
            key={i}
            className="h-1.5 rounded-full cursor-pointer"
            animate={{ width: i === idx % safeMoments.length ? 20 : 6, backgroundColor: i === idx % safeMoments.length ? "hsl(var(--sleep))" : "hsl(240,10%,25%)" }}
            onClick={() => {
              setDir(i > idx ? 1 : -1);
              setIdx(i);
            }}
          />
        ))}
      </div>
    </div>
  );
}

function buildMonthPoints(events: BabyEvent[], photos: PhotoRecord[]): MonthPoint[] {
  const counts = Array.from({ length: 12 }, (_, index) => {
    const monthIndex = index;
    const fromEvents = events.filter((event) => {
      const date = new Date(event.timestamp);
      return !Number.isNaN(date.getTime()) && date.getFullYear() === YEAR && date.getMonth() === monthIndex;
    }).length;
    const fromPhotos = photos.filter((photo) => {
      const date = new Date(photo.timestamp);
      return !Number.isNaN(date.getTime()) && date.getFullYear() === YEAR && date.getMonth() === monthIndex;
    }).length;
    return fromEvents + fromPhotos;
  });

  const hasAny = counts.some((count) => count > 0);
  return hasAny
    ? MONTH_LABELS.map((label, index) => ({ m: label, v: counts[index] }))
    : DEFAULT_MONTHS;
}

function buildMoments(milestones: Milestone[], photos: PhotoRecord[]): MomentCard[] {
  if (milestones.length > 0) {
    return milestones
      .slice()
      .sort((a, b) => toTime(b.date) - toTime(a.date))
      .slice(0, 5)
      .map((milestone) => {
        const meta = getMilestoneOrbitMeta(milestone.category);
        return {
          emoji: milestone.emoji,
          title: milestone.title,
          date: formatDateLabel(milestone.date, "Недавно"),
          color: meta.accent,
          desc: milestone.completed ? "Событие отмечено в локальном архиве" : "Ожидает подтверждения",
          eyebrow: meta.label,
          imageUrl: milestone.photoUrl,
        };
      });
  }

  if (photos.length > 0) {
    return photos
      .slice()
      .sort((a, b) => toTime(b.timestamp) - toTime(a.timestamp))
      .slice(0, 5)
      .map((photo) => ({
        emoji: getTag(photo.tags, "emoji") ?? "📷",
        title: photo.caption ?? "Воспоминание",
        date: formatDateLabel(photo.timestamp, "Недавно"),
        color: "hsl(var(--sleep))",
        desc: "Снимок из фотодневника",
        eyebrow: "Фотодневник",
        imageUrl: photo.url,
      }));
  }

  return DEFAULT_MOMENTS;
}

function buildYearStories(moments: MomentCard[]): StickyScrollCardItem[] {
  const source = moments.length > 0 ? moments : DEFAULT_MOMENTS;

  return source.slice(0, 4).map((moment, index) => ({
    id: `year-story-${index}`,
    eyebrow: moment.eyebrow ?? "Памятный момент",
    title: moment.title,
    description: moment.desc,
    meta: moment.date,
    imageUrl: moment.imageUrl,
    emoji: moment.emoji,
    tone: "milestone",
    accent: moment.color,
    actionLabel: index === 0 ? "Листать историю года" : undefined,
  }));
}

function buildOrbitalTimeline(
  milestones: Milestone[],
  photos: PhotoRecord[],
  events: BabyEvent[],
): RadialTimelineItem[] {
  const milestoneSeeds: OrbitSeed[] = milestones
    .filter((milestone) => milestone.completed)
    .sort((a, b) => toTime(a.date) - toTime(b.date))
    .slice(-4)
    .map((milestone, index) => {
      const meta = getMilestoneOrbitMeta(milestone.category);
      return {
        title: milestone.title,
        date: formatDateLabel(milestone.date, "Недавно"),
        content: milestone.completed
          ? `Навык уже отмечен в локальном архиве и стал частью истории роста.`
          : `Эта веха еще только приближается.`,
        category: meta.label,
        icon: meta.icon,
        status: "completed" as const,
        energy: clamp(66 + index * 7, 56, 96),
        accent: meta.accent,
        sortTime: toTime(milestone.date) || Date.UTC(YEAR, index, 1),
      };
    });

  const photoSeeds: OrbitSeed[] = photos
    .slice()
    .sort((a, b) => toTime(b.timestamp) - toTime(a.timestamp))
    .slice(0, 2)
    .map((photo, index) => ({
      title: photo.caption ?? "Фото-момент",
      date: formatDateLabel(photo.timestamp, "Недавно"),
      content: photo.caption
        ? `Снимок сохранил момент "${photo.caption}" в фотодневнике.`
        : "Свежий кадр из фотодневника, который дополняет историю года.",
      category: "Фото-момент",
      icon: Camera,
      status: "completed" as const,
      energy: clamp(72 - index * 6, 58, 90),
      accent: "hsl(var(--sleep))",
      sortTime: toTime(photo.timestamp),
    }));

  const seenSubtypes = new Set<string>();
  const eventSeeds: OrbitSeed[] = events
    .slice()
    .sort((a, b) => toTime(b.timestamp) - toTime(a.timestamp))
    .filter((event) => {
      const subType = getEventSubType(event);
      if (subType === "diaper") return false;
      if (seenSubtypes.has(subType)) return false;
      seenSubtypes.add(subType);
      return true;
    })
    .slice(0, 2)
    .map((event, index) => {
      const meta = getEventOrbitMeta(event);
      return {
        title: event.title || meta.label,
        date: formatDateLabel(event.timestamp, "Сегодня"),
        content: event.description || `Это событие поддерживает ежедневный ритм и показывает живую динамику последних дней.`,
        category: meta.label,
        icon: meta.icon,
        status: "in-progress" as const,
        energy: clamp(74 - index * 8, 52, 88),
        accent: meta.accent,
        sortTime: toTime(event.timestamp),
      };
    });

  const merged = [...milestoneSeeds, ...photoSeeds, ...eventSeeds]
    .filter((item) => item.sortTime > 0)
    .sort((a, b) => a.sortTime - b.sortTime);

  const deduped: OrbitSeed[] = [];
  const fingerprints = new Set<string>();

  merged.forEach((item) => {
    const key = `${item.title}::${item.date}::${item.category}`;
    if (fingerprints.has(key)) return;
    fingerprints.add(key);
    deduped.push(item);
  });

  const limitedSeeds = deduped.slice(-7);

  if (limitedSeeds.length === 0) {
    const fallback = DEFAULT_MOMENTS.map((moment, index) => ({
      id: index + 1,
      title: moment.title,
      date: moment.date,
      content: moment.desc,
      category: "Памятный момент",
      icon: ORBIT_FALLBACK_ICONS[index % ORBIT_FALLBACK_ICONS.length],
      status: "completed" as const,
      energy: 84 - index * 8,
      accent: moment.color,
      relatedIds: [] as number[],
    }));

    return fallback.map((item, index, array) => ({
      ...item,
      relatedIds: [array[index - 1]?.id, array[index + 1]?.id].filter(
        (value): value is number => typeof value === "number",
      ),
    }));
  }

  const nodes = limitedSeeds.map((item, index) => ({
    id: index + 1,
    title: item.title,
    date: item.date,
    content: item.content,
    category: item.category,
    icon: item.icon,
    status: item.status,
    energy: item.energy,
    accent: item.accent,
    relatedIds: [] as number[],
  }));

  return nodes.map((node, index, array) => ({
    ...node,
    relatedIds: [array[index - 1]?.id, array[index + 1]?.id].filter(
      (value): value is number => typeof value === "number",
    ),
  }));
}

function buildStats(
  events: BabyEvent[],
  milestones: Milestone[],
  vaccinations: VaccinationRecord[],
  temperatures: TemperatureRecord[],
  allergensCount: AllergenRecord[],
): StatCard[] {
  const feedingCount = events.filter((event) => event.type === "feeding").length;
  const sleepEvents = events.filter((event) => event.type === "sleep");
  const sleepHours = sleepEvents.reduce((total, event) => total + ((event.duration ?? 90) / 60), 0);
  const diaperCount = events.filter((event) => event.type === "diaper").length;
  const weightEvents = events
    .filter((event) => getEventSubType(event) === "weight")
    .sort((a, b) => toTime(a.timestamp) - toTime(b.timestamp));
  const heightEvents = events
    .filter((event) => getEventSubType(event) === "height")
    .sort((a, b) => toTime(a.timestamp) - toTime(b.timestamp));
  const heightDelta = heightEvents.length >= 2
    ? Number((Number(heightEvents[heightEvents.length - 1].data?.amount ?? 0) - Number(heightEvents[0].data?.amount ?? 0)).toFixed(1))
    : DEFAULT_STATS[3].value;
  const weightDelta = weightEvents.length >= 2
    ? Number((Number(weightEvents[weightEvents.length - 1].data?.amount ?? 0) - Number(weightEvents[0].data?.amount ?? 0)).toFixed(1))
    : DEFAULT_STATS[4].value;
  const achievementCount = milestones.filter((milestone) => milestone.completed).length;
  const medicineCount = events.filter((event) => getEventSubType(event) === "medication").length || DEFAULT_STATS[6].value;
  const vaccineCount = vaccinations.length;

  return [
    { ...DEFAULT_STATS[0], value: feedingCount || DEFAULT_STATS[0].value },
    { ...DEFAULT_STATS[1], value: Number(sleepHours.toFixed(1)) || DEFAULT_STATS[1].value },
    { ...DEFAULT_STATS[2], value: diaperCount || DEFAULT_STATS[2].value },
    { ...DEFAULT_STATS[3], value: heightDelta || DEFAULT_STATS[3].value },
    { ...DEFAULT_STATS[4], value: weightDelta || DEFAULT_STATS[4].value },
    { ...DEFAULT_STATS[5], value: achievementCount || DEFAULT_STATS[5].value },
    { ...DEFAULT_STATS[6], value: (medicineCount + allergensCount.length) || DEFAULT_STATS[6].value },
    { ...DEFAULT_STATS[7], value: vaccineCount || DEFAULT_STATS[7].value },
  ];
}

function ShareButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <motion.button
      whileTap={{ scale: 0.96 }}
      onClick={async () => {
        try {
          if (navigator.share) {
            await navigator.share({ title: "Итоги года", text });
          } else {
            await navigator.clipboard.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 1800);
          }
        } catch {
          try {
            await navigator.clipboard.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 1800);
          } catch {
            setCopied(false);
          }
        }
      }}
      className="w-full h-14 rounded-2xl font-bold text-base text-white flex items-center justify-center gap-3"
      style={{
        background: "linear-gradient(135deg, hsl(var(--sleep)), hsl(var(--milestone) / 0.50))",
        boxShadow: "0 8px 24px hsl(var(--sleep) / 0.25)",
      }}
    >
      <Share2 className="w-5 h-5" />
      {copied ? "Скопировано" : "Поделиться итогами года"}
    </motion.button>
  );
}

export default function YearRecap() {
  const babyName = localStorage.getItem("babyName") || "Малыш";
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const sync = () => setRefreshKey((value) => value + 1);
    window.addEventListener("storage", sync);
    window.addEventListener("focus", sync);
    document.addEventListener("visibilitychange", sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener("focus", sync);
      document.removeEventListener("visibilitychange", sync);
    };
  }, []);

  const { stats, months, storyCards, orbitalTimeline, shareText } = useMemo(() => {
    void refreshKey;
    const events = eventsDB.getAll();
    const milestones = milestonesDB.getAll();
    const vaccinations = vaccinationsDB.getAll();
    const temperatures = temperatureDB.getAll();
    const photos = photosDB.getAll();

    const resolvedStats = buildStats(events, milestones, vaccinations, temperatures, allergensDB.getAll());
    const resolvedMonths = buildMonthPoints(events, photos);
    const resolvedMoments = buildMoments(milestones, photos);
    const summary = resolvedStats
      .slice(0, 4)
      .map((stat) => `${stat.label}: ${stat.value}${stat.suffix}`)
      .join(", ");

    return {
      stats: resolvedStats,
      months: resolvedMonths,
      storyCards: buildYearStories(resolvedMoments),
      orbitalTimeline: buildOrbitalTimeline(milestones, photos, events),
      shareText: `Итоги ${YEAR} для ${babyName}: ${summary}`,
    };
  }, [babyName, refreshKey]);

  return (
    <AppLayout>
      <div className="flex flex-col gap-5 pt-safe pb-10">

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mx-4 mt-4 md:mx-6"
        >
          <SpotlightCard
            tone="sleep"
            intensity="strong"
            className="relative flex min-h-[200px] flex-col items-center overflow-hidden rounded-3xl p-6 text-center"
          >
          {["hsl(var(--sleep))", "hsl(320,50%,50%)", "hsl(145,45%,45%)"].map((color, index) => (
            <motion.div
              key={index}
              className="absolute w-32 h-32 rounded-full blur-3xl opacity-20"
              style={{ background: color, left: `${index * 35}%`, top: index % 2 === 0 ? -20 : "auto", bottom: index % 2 !== 0 ? -20 : "auto" }}
              animate={{ scale: [1, 1.2, 1], opacity: [0.15, 0.25, 0.15] }}
              transition={{ duration: 4 + index, repeat: Infinity }}
            />
          ))}

          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", delay: 0.2 }}
            className="text-5xl mb-3"
          >
            ✨
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-2xl font-bold text-white"
          >
            Итоги {YEAR}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-sm text-white/60 mt-1"
          >
            Первый год {babyName} — незабываемый!
          </motion.p>

          <div className="flex gap-1 mt-3">
            {[0, 1, 2, 3, 4].map((index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.7 + index * 0.1 }}
              >
                <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
              </motion.div>
            ))}
          </div>
          </SpotlightCard>
        </motion.div>

        <div className="px-4 md:px-6">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">
            📊 Год в цифрах
          </p>
          <div className="grid grid-cols-2 gap-2">
            {stats.map((stat, index) => (
              <motion.div
                key={`${stat.label}-${index}`}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.06 }}
              >
                <SpotlightCard
                  accent={stat.color}
                  intensity="soft"
                  className="flex rounded-2xl p-4"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{stat.emoji}</span>
                    <div>
                      <motion.p
                        className="text-lg font-bold"
                        style={{ color: stat.color }}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3 + index * 0.06 }}
                      >
                        {stat.value}{stat.suffix}
                      </motion.p>
                      <p className="text-[10px] leading-tight text-muted-foreground">{stat.label}</p>
                    </div>
                  </div>
                </SpotlightCard>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="px-4 md:px-6">
          <StickyScrollCardsSection
            eyebrow="История года"
            title={`Как рос ${babyName} в ${YEAR}`}
            subtitle="Главные вехи, тёплые кадры и моменты, которые сложились в одну вертикальную историю года."
            items={storyCards}
            stickyFrom="base"
            stickyTop="clamp(0.75rem, 6svh, 6rem)"
          />
        </div>

        <div className="px-4 md:px-6">
          <RadialOrbitalTimeline
            timelineData={orbitalTimeline}
            title={`Созвездие ${babyName}`}
            subtitle="Карта года, собранная из локальных достижений, фото-моментов и последних рутин. Выбери узел, чтобы увидеть, как один этап перетекает в другой."
          />
        </div>

        <MonthBars months={months} />

        <div className="px-4 md:px-6">
          <ShareButton text={shareText} />
        </div>

      </div>
    </AppLayout>
  );
}
