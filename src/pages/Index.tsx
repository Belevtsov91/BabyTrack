import { useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Moon, Sun, Plus, Search, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { cn } from "@/lib/utils";
import { BabyEvent, eventsDB } from "@/lib/crud";
import { LiquidSurface } from "@/components/ui/liquid-radio";

const P = {
  sleep: { color: "#a78bfa", bgColor: "rgba(167,139,250,0.14)", borderColor: "rgba(167,139,250,0.28)" },
  feeding: { color: "#34d399", bgColor: "rgba(52,211,153,0.12)", borderColor: "rgba(52,211,153,0.26)" },
  diaper: { color: "#fbbf24", bgColor: "rgba(251,191,36,0.13)", borderColor: "rgba(251,191,36,0.27)" },
  activity: { color: "#38bdf8", bgColor: "rgba(56,189,248,0.12)", borderColor: "rgba(56,189,248,0.26)" },
  health: { color: "#fb7185", bgColor: "rgba(251,113,133,0.14)", borderColor: "rgba(251,113,133,0.28)" },
  mood: { color: "#facc15", bgColor: "rgba(250,204,21,0.12)", borderColor: "rgba(250,204,21,0.26)" },
};

type PaletteKey = keyof typeof P;

interface RadialItem {
  id: string;
  emoji: string;
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
  lastTime: string;
  angle: number;
  route: string;
}

interface TimelineItem {
  id: string;
  emoji: string;
  label: string;
  time: string;
  color: string;
  durationMin?: number;
  route: string;
  timestamp: string;
}

interface StatItem {
  emoji: string;
  label: string;
  value: string;
  sub: string;
  color: string;
  bg: string;
  border: string;
}

interface PredictionItem {
  emoji: string;
  label: string;
  minutesLeft: number;
  interval: number;
  color: string;
  bg: string;
  border: string;
}

const RADIAL_BASE: Array<Omit<RadialItem, "lastTime">> = [
  { id: "sleep", emoji: "🌙", label: "Сон", color: P.sleep.color, bgColor: P.sleep.bgColor, borderColor: P.sleep.borderColor, angle: 0, route: "/event/sleep" },
  { id: "breast", emoji: "🤱", label: "Грудь", color: P.feeding.color, bgColor: P.feeding.bgColor, borderColor: P.feeding.borderColor, angle: 60, route: "/event/breast" },
  { id: "bottle", emoji: "🍼", label: "Бутылочка", color: P.feeding.color, bgColor: P.feeding.bgColor, borderColor: P.feeding.borderColor, angle: 120, route: "/event/bottle" },
  { id: "diaper", emoji: "👶", label: "Подгузник", color: P.diaper.color, bgColor: P.diaper.bgColor, borderColor: P.diaper.borderColor, angle: 180, route: "/event/diaper" },
  { id: "activity", emoji: "🚶", label: "Прогулка", color: P.activity.color, bgColor: P.activity.bgColor, borderColor: P.activity.borderColor, angle: 240, route: "/event/walk" },
  { id: "health", emoji: "🌡️", label: "Здоровье", color: P.health.color, bgColor: P.health.bgColor, borderColor: P.health.borderColor, angle: 300, route: "/event/temperature" },
];

const DAY_START = 6;
const DAY_END = 24;
const ORBIT_RADIUS = 115;
const FAVORITES_STORAGE_KEY = "babytrack_favorites";

function calcAge(birthDateStr: string): string {
  const birth = new Date(birthDateStr);
  const now = new Date();
  const months = (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth());
  const days = now.getDate() - birth.getDate();
  if (months < 1) return `${Math.max(0, days)} дн`;
  return `${months} мес${days > 0 ? ` ${days} дн` : ""}`;
}

function toIsoDate(timestamp: string): string {
  return timestamp.slice(0, 10);
}

function isSameDay(timestamp: string, date = new Date()): boolean {
  return toIsoDate(timestamp) === date.toISOString().slice(0, 10);
}

function formatClock(timestamp: string): string {
  const date = new Date(timestamp);
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

function formatRelativeTime(timestamp: string): string {
  const diffMinutes = Math.max(0, Math.floor((Date.now() - new Date(timestamp).getTime()) / 60000));
  if (diffMinutes < 1) return "только что";
  if (diffMinutes < 60) return `${diffMinutes}м назад`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}ч назад`;
  return `${Math.floor(diffHours / 24)}д назад`;
}

function formatDuration(minutes: number): string {
  if (!Number.isFinite(minutes) || minutes <= 0) return "0м";
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours <= 0) return `${mins}м`;
  return `${hours}ч ${String(mins).padStart(2, "0")}м`;
}

function getSubType(event: BabyEvent): string {
  return String(event.data?.eventSubType ?? event.data?.subType ?? "").toLowerCase();
}

function getEventCategory(event: BabyEvent): PaletteKey {
  const subType = getSubType(event);
  if (event.type === "sleep") return "sleep";
  if (event.type === "feeding") return "feeding";
  if (event.type === "diaper") return "diaper";
  if (event.type === "mood") return "mood";
  if (event.type === "temperature") return "health";
  if (event.type === "activity" && ["doctor", "vaccine", "medication", "weight", "height", "head"].includes(subType)) return "health";
  if (event.type === "activity" && ["walk", "bath"].includes(subType)) return "activity";
  return "activity";
}

function getEventEmoji(event: BabyEvent): string {
  const subType = getSubType(event);
  if (event.type === "sleep") return "🌙";
  if (event.type === "feeding") {
    if (subType === "breast") return "🤱";
    if (subType === "pump") return "🥛";
    if (subType === "solid") return "🥣";
    return "🍼";
  }
  if (event.type === "diaper") return "👶";
  if (event.type === "temperature") return "🌡️";
  if (event.type === "mood") return "😊";
  if (subType === "doctor") return "🩺";
  if (subType === "vaccine") return "💉";
  if (subType === "medication") return "💊";
  if (subType === "weight") return "⚖️";
  if (subType === "height") return "📏";
  if (subType === "head") return "🔵";
  if (subType === "bath") return "🛁";
  if (subType === "walk") return "🚶";
  return "✨";
}

function getEventRoute(event: BabyEvent): string {
  const subType = getSubType(event);
  if (subType) return `/event/${subType}`;
  if (event.type === "temperature") return "/event/temperature";
  if (event.type === "sleep") return "/event/sleep";
  if (event.type === "feeding") return "/event/bottle";
  if (event.type === "diaper") return "/event/diaper";
  if (event.type === "activity") return "/event/walk";
  return "/add";
}

function getDurationMinutes(event: BabyEvent): number {
  if (typeof event.duration === "number" && event.duration > 0) return event.duration;
  const subType = getSubType(event);
  if (event.type === "sleep") return 90;
  if (event.type === "feeding") return subType === "breast" ? 20 : 15;
  if (event.type === "diaper") return 5;
  if (event.type === "temperature") return 4;
  if (event.type === "activity") {
    if (["doctor", "vaccine", "medication"].includes(subType)) return 15;
    if (["weight", "height", "head"].includes(subType)) return 8;
    if (subType === "bath") return 20;
    return 45;
  }
  return 15;
}

function latestEvent(events: BabyEvent[], predicate: (event: BabyEvent) => boolean): BabyEvent | undefined {
  return [...events]
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .find(predicate);
}

function getEnabledOrbitIds(): string[] {
  try {
    const raw = localStorage.getItem(FAVORITES_STORAGE_KEY);
    if (!raw) return RADIAL_BASE.map((item) => item.id);

    const favorites = JSON.parse(raw);
    if (!Array.isArray(favorites)) return RADIAL_BASE.map((item) => item.id);

    const orbitIds = new Set<string>(["health"]);
    if (favorites.includes("sleep")) orbitIds.add("sleep");
    if (favorites.includes("breast")) orbitIds.add("breast");
    if (favorites.includes("bottle") || favorites.includes("pump")) orbitIds.add("bottle");
    if (favorites.includes("diaper")) orbitIds.add("diaper");
    if (favorites.includes("walk") || favorites.includes("bath")) orbitIds.add("activity");

    const filtered = RADIAL_BASE.filter((item) => orbitIds.has(item.id)).map((item) => item.id);
    return filtered.length >= 4 ? filtered : RADIAL_BASE.map((item) => item.id);
  } catch {
    return RADIAL_BASE.map((item) => item.id);
  }
}

function buildRadialItems(events: BabyEvent[]): RadialItem[] {
  const enabledIds = new Set(getEnabledOrbitIds());
  const source = RADIAL_BASE.filter((item) => enabledIds.has(item.id));

  return source.map((base, index) => {
    let match: BabyEvent | undefined;
    if (base.id === "sleep") {
      match = latestEvent(events, (event) => event.type === "sleep");
    } else if (base.id === "breast") {
      match = latestEvent(events, (event) => event.type === "feeding" && getSubType(event) === "breast");
    } else if (base.id === "bottle") {
      match = latestEvent(events, (event) => event.type === "feeding" && ["bottle", "pump", "solid"].includes(getSubType(event)));
    } else if (base.id === "diaper") {
      match = latestEvent(events, (event) => event.type === "diaper");
    } else if (base.id === "activity") {
      match = latestEvent(events, (event) => event.type === "activity" && ["walk", "bath"].includes(getSubType(event)));
    } else if (base.id === "health") {
      match = latestEvent(events, (event) => event.type === "temperature" || (event.type === "activity" && ["doctor", "vaccine", "medication", "weight", "height", "head"].includes(getSubType(event))));
    }

    const palette = match ? P[getEventCategory(match)] : { color: base.color, bgColor: base.bgColor, borderColor: base.borderColor };
    return {
      ...base,
      angle: (360 / source.length) * index,
      lastTime: match ? formatRelativeTime(match.timestamp) : "—",
      route: match ? getEventRoute(match) : base.route,
      color: palette.color,
      bgColor: palette.bgColor,
      borderColor: palette.borderColor,
    };
  });
}

function buildPredictionItems(events: BabyEvent[]): PredictionItem[] {
  const now = Date.now();
  const list = [
    {
      emoji: "🍼",
      label: "Кормление",
      interval: 180,
      color: P.feeding.color,
      bg: P.feeding.bgColor,
      border: P.feeding.borderColor,
      last: latestEvent(events, (event) => event.type === "feeding"),
    },
    {
      emoji: "👶",
      label: "Подгузник",
      interval: 180,
      color: P.diaper.color,
      bg: P.diaper.bgColor,
      border: P.diaper.borderColor,
      last: latestEvent(events, (event) => event.type === "diaper"),
    },
    {
      emoji: "🌙",
      label: "Сон",
      interval: 240,
      color: P.sleep.color,
      bg: P.sleep.bgColor,
      border: P.sleep.borderColor,
      last: latestEvent(events, (event) => event.type === "sleep"),
    },
  ];

  return list.map((item) => {
    const elapsed = item.last ? Math.max(0, Math.floor((now - new Date(item.last.timestamp).getTime()) / 60000)) : item.interval * 0.55;
    return {
      emoji: item.emoji,
      label: item.label,
      interval: item.interval,
      minutesLeft: Math.max(0, Math.round(item.interval - elapsed)),
      color: item.color,
      bg: item.bg,
      border: item.border,
    };
  });
}

function buildQuickStats(events: BabyEvent[]): StatItem[] {
  const todayEvents = events.filter((event) => isSameDay(event.timestamp));
  const feedingCount = todayEvents.filter((event) => event.type === "feeding").length;
  const diaperCount = todayEvents.filter((event) => event.type === "diaper").length;
  const sleepMinutes = todayEvents.filter((event) => event.type === "sleep").reduce((sum, event) => sum + getDurationMinutes(event), 0);

  const latestTemp = latestEvent(events, (event) => event.type === "temperature" || getSubType(event) === "temperature");
  const tempValue = latestTemp ? Number(latestTemp.data?.temperature ?? latestTemp.data?.value ?? latestTemp.data?.amount) : Number.NaN;

  return [
    { emoji: "🍼", label: "Кормлений", value: String(feedingCount), sub: "сегодня", color: P.feeding.color, bg: P.feeding.bgColor, border: P.feeding.borderColor },
    { emoji: "🌙", label: "Сон", value: formatDuration(sleepMinutes), sub: "итого", color: P.sleep.color, bg: P.sleep.bgColor, border: P.sleep.borderColor },
    { emoji: "👶", label: "Подгузников", value: String(diaperCount), sub: "сегодня", color: P.diaper.color, bg: P.diaper.bgColor, border: P.diaper.borderColor },
    { emoji: "🌡️", label: "Температура", value: Number.isFinite(tempValue) ? `${tempValue.toFixed(1)}°` : "—", sub: latestTemp ? "последний" : "нет данных", color: P.health.color, bg: P.health.bgColor, border: P.health.borderColor },
  ];
}

function buildTimelineItems(events: BabyEvent[]): TimelineItem[] {
  const todayItems = events.filter((event) => isSameDay(event.timestamp));
  const source = todayItems.length > 0 ? todayItems : events.slice(0, 5);

  return source
    .slice()
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
    .map((event) => ({
      id: event.id,
      emoji: getEventEmoji(event),
      label: event.title,
      time: formatClock(event.timestamp),
      color: P[getEventCategory(event)].color,
      durationMin: getDurationMinutes(event),
      route: getEventRoute(event),
      timestamp: event.timestamp,
    }));
}

function buildEveningSummary(events: BabyEvent[]) {
  const todayEvents = events.filter((event) => isSameDay(event.timestamp));
  const sleepMinutes = todayEvents.filter((event) => event.type === "sleep").reduce((sum, event) => sum + getDurationMinutes(event), 0);
  const feedingCount = todayEvents.filter((event) => event.type === "feeding").length;
  const diaperCount = todayEvents.filter((event) => event.type === "diaper").length;

  return {
    title: "Итог дня",
    text: todayEvents.length ? `Сон ${formatDuration(sleepMinutes)} · Кормлений ${feedingCount} · Подгузников ${diaperCount}` : "Пока нет событий за сегодня",
  };
}

function polarToXY(angleDeg: number, radius: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: radius * Math.cos(rad), y: radius * Math.sin(rad) };
}

const ICON_HALF = 28;

function OrbitBubble({
  item,
  rotation,
  onClick,
}: {
  item: RadialItem;
  rotation: number;
  onClick: () => void;
}) {
  const pos = polarToXY(item.angle + rotation, ORBIT_RADIUS);
  const glowDelay = item.angle / 360;

  return (
    <motion.button
      onClick={onClick}
      className="absolute flex flex-col items-center gap-1"
      style={{
        left: `calc(50% + ${pos.x}px - ${ICON_HALF}px)`,
        top: `calc(50% + ${pos.y}px - ${ICON_HALF}px)`,
        width: ICON_HALF * 2,
      }}
      whileTap={{ scale: 0.82 }}
      initial={{ opacity: 0, scale: 0 }}
      animate={{ opacity: 1, scale: 1, y: [0, -5, 0] }}
      transition={{
        opacity: { delay: item.angle / 600 + 0.3, duration: 0.4 },
        scale: { delay: item.angle / 600 + 0.3, type: "spring", stiffness: 220, damping: 18 },
        y: { delay: glowDelay, duration: 3 + glowDelay * 0.6, repeat: Infinity, ease: "easeInOut" },
      }}
    >
      <motion.div
        className="w-14 h-14 rounded-2xl flex items-center justify-center"
        style={{ backgroundColor: item.bgColor, border: `1.5px solid ${item.borderColor}` }}
        animate={{ boxShadow: [`0 0 0px ${item.color}00`, `0 0 18px ${item.color}60`, `0 0 0px ${item.color}00`] }}
        transition={{ duration: 3.5, repeat: Infinity, delay: glowDelay, ease: "easeInOut" }}
      >
        <span className="text-2xl">{item.emoji}</span>
      </motion.div>
      <span className="text-[9px] font-medium text-white/50 whitespace-nowrap">{item.lastTime}</span>
    </motion.button>
  );
}

function CenterAvatar({ name, age }: { name: string; age: string }) {
  return (
    <motion.div
      className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 200, damping: 18 }}
    >
      <motion.div
        className="w-24 h-24 rounded-full flex flex-col items-center justify-center gap-1"
        style={{ background: "radial-gradient(circle at 38% 32%, #7c3aed, #4338ca 55%, #1e1b4b)" }}
        animate={{
          boxShadow: [
            "0 0 0 3px rgba(139,92,246,0.4), 0 8px 32px rgba(99,102,241,0.25)",
            "0 0 0 4px rgba(236,72,153,0.45), 0 8px 48px rgba(167,139,250,0.40)",
            "0 0 0 3px rgba(56,189,248,0.35), 0 8px 32px rgba(99,102,241,0.25)",
            "0 0 0 3px rgba(139,92,246,0.4), 0 8px 32px rgba(99,102,241,0.25)",
          ],
        }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
      >
        <span className="text-3xl">👶</span>
        <span className="text-[10px] font-semibold text-white/70">{age}</span>
      </motion.div>
      <p className="text-center text-sm font-bold text-white mt-2">{name}</p>
    </motion.div>
  );
}

function RadialWidget({ items, onItemPress }: { items: RadialItem[]; onItemPress: (route: string) => void }) {
  const widgetSize = 300;
  const center = widgetSize / 2;

  const containerRef = useRef<HTMLDivElement>(null);
  const [rotation, setRotation] = useState(0);
  const drag = useRef({ active: false, startAngle: 0, startRot: 0, moved: false });

  useEffect(() => {
    let rafId: number;
    let last: number | null = null;
    const speed = 5;

    const tick = (now: number) => {
      if (!drag.current.active) {
        if (last !== null) setRotation((value) => value + speed * ((now - last) / 1000));
        last = now;
      } else {
        last = null;
      }
      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, []);

  const getAngle = (clientX: number, clientY: number) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return 0;
    return Math.atan2(clientY - rect.top - center, clientX - rect.left - center) * (180 / Math.PI);
  };

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (e.button !== 0 && e.pointerType === "mouse") return;
    const node = containerRef.current;
    if (!node) return;
    node.setPointerCapture(e.pointerId);
    drag.current = { active: true, startAngle: getAngle(e.clientX, e.clientY), startRot: rotation, moved: false };
  };

  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!drag.current.active) return;
    const delta = getAngle(e.clientX, e.clientY) - drag.current.startAngle;
    if (Math.abs(delta) > 3) drag.current.moved = true;
    setRotation(drag.current.startRot + delta);
  };

  const onPointerUp = () => {
    drag.current.active = false;
  };

  return (
    <div className="relative flex items-center justify-center">
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse 72% 60% at 50% 50%, rgba(139,92,246,0.18) 0%, rgba(99,102,241,0.08) 45%, transparent 70%)",
          filter: "blur(2px)",
        }}
      />

      <div
        ref={containerRef}
        className="relative select-none"
        style={{ width: widgetSize, height: widgetSize, cursor: "grab", touchAction: "none" }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
      >
        <svg
          className="absolute inset-0"
          width={widgetSize}
          height={widgetSize}
          style={{ opacity: 0.18, transform: `rotate(${rotation}deg)`, transformOrigin: "center" }}
        >
          <circle cx={center} cy={center} r={ORBIT_RADIUS} fill="none" stroke="white" strokeWidth="1" strokeDasharray="4 12" />
        </svg>
        <svg className="absolute inset-0" width={widgetSize} height={widgetSize} style={{ opacity: 0.08 }}>
          <circle cx={center} cy={center} r={48} fill="none" stroke="white" strokeWidth="1" />
        </svg>

        {items.map((item) => (
          <OrbitBubble
            key={item.id}
            item={item}
            rotation={rotation}
            onClick={() => {
              if (!drag.current.moved) onItemPress(item.route);
            }}
          />
        ))}

        <CenterAvatar
          name={localStorage.getItem("babyName") || "Малыш"}
          age={calcAge(localStorage.getItem("birthDate") || "2024-09-15")}
        />
      </div>
    </div>
  );
}

function PredictionBar({ items }: { items: PredictionItem[] }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6 }}
      className="mx-4 md:mx-0 rounded-2xl overflow-hidden"
      style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.09)" }}
    >
      <div className="px-4 pt-3 pb-1">
        <p className="text-[11px] uppercase tracking-widest font-semibold" style={{ color: "rgba(255,255,255,0.4)" }}>
          ⏱ Скоро
        </p>
      </div>
      <div className="flex">
        {items.map((item, index) => {
          const progress = Math.max(0, Math.min(1, 1 - item.minutesLeft / item.interval));
          return (
            <div key={item.label} className="flex-1 px-3 pb-3">
              <div className="flex items-center gap-1.5 mb-1.5">
                <span className="text-base">{item.emoji}</span>
                <span className="text-xs font-semibold text-white/80">{item.label}</span>
              </div>
              <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: `linear-gradient(90deg, ${item.color}90, ${item.color})` }}
                  initial={{ width: 0 }}
                  animate={{ width: `${progress * 100}%` }}
                  transition={{ duration: 1.2, delay: 0.8 + index * 0.12, ease: "easeOut" }}
                />
              </div>
              <p className="text-[10px] mt-1" style={{ color: item.color }}>
                {item.minutesLeft <= 0 ? "сейчас" : `через ${item.minutesLeft} мин`}
              </p>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}

function NowLine({ dayStart, hourWidth }: { dayStart: number; hourWidth: number }) {
  const now = new Date();
  const leftPx = (now.getHours() + now.getMinutes() / 60 - dayStart) * hourWidth;
  if (leftPx < 0 || leftPx > (DAY_END - dayStart) * hourWidth) return null;

  return (
    <motion.div
      className="absolute top-0 bottom-0 w-px"
      style={{ left: leftPx, background: "#f87171" }}
      initial={{ opacity: 0 }}
      animate={{ opacity: [0.5, 1, 0.5] }}
      transition={{ duration: 2, repeat: Infinity }}
    >
      <div className="w-2 h-2 rounded-full bg-rose-400 -translate-x-1/2 -translate-y-0.5" />
    </motion.div>
  );
}

function HorizontalTimeline({
  items,
  onAddPress,
  onOpenItem,
}: {
  items: TimelineItem[];
  onAddPress: () => void;
  onOpenItem: (route: string) => void;
}) {
  const hourWidth = 56;
  const dayStart = DAY_START;
  const hours = Array.from({ length: DAY_END - DAY_START }, (_, index) => dayStart + index);

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.85 }} className="mx-4 md:mx-0">
        <div className="flex items-center justify-between mb-2 px-1">
          <p className="text-xs font-bold uppercase tracking-widest text-white/60">Сегодня</p>
          <motion.button
            onClick={onAddPress}
            whileTap={{ scale: 0.85 }}
            animate={{ opacity: [0.7, 1, 0.7] }}
            transition={{ duration: 2.5, repeat: Infinity }}
            className="rounded-xl"
          >
            <LiquidSurface
              tone="sleep"
              ambientDelay={0.6}
              className="rounded-xl"
              contentClassName="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold"
              style={{ color: P.sleep.color }}
            >
              <motion.span animate={{ rotate: [0, 90, 0] }} transition={{ duration: 3, repeat: Infinity }}>
                <Plus className="w-3.5 h-3.5" />
              </motion.span>
              Добавить
            </LiquidSurface>
          </motion.button>
        </div>

      <div className="rounded-2xl overflow-hidden" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.09)" }}>
        <div className="overflow-x-auto scrollbar-hide">
          <div style={{ width: hours.length * hourWidth, minWidth: "100%" }} className="relative">
            <div className="flex border-b border-white/5">
              {hours.map((hour) => (
                <div key={hour} className="shrink-0 text-center text-[9px] text-white/25 py-1" style={{ width: hourWidth }}>
                  {hour}:00
                </div>
              ))}
            </div>

            <div className="relative h-16 px-1">
              {items.map((item) => {
                const [hoursText, minutesText] = item.time.split(":");
                const eventHour = Number(hoursText) + Number(minutesText) / 60;
                const leftPx = (eventHour - dayStart) * hourWidth;
                const widthPx = item.durationMin ? (item.durationMin / 60) * hourWidth : hourWidth * 0.35;
                const color = item.color;

                return (
                  <motion.button
                    key={item.id}
                    className="absolute top-2 h-10 rounded-xl flex items-center justify-center overflow-hidden cursor-pointer"
                    style={{
                      left: leftPx,
                      width: Math.max(widthPx, 36),
                      backgroundColor: `${color}22`,
                      border: `1px solid ${color}55`,
                    }}
                    initial={{ opacity: 0, scaleY: 0 }}
                    animate={{ opacity: 1, scaleY: 1 }}
                    whileTap={{ scale: 0.92 }}
                    transition={{ delay: 1 }}
                    onClick={() => onOpenItem(item.route)}
                  >
                    <span className="text-base">{item.emoji}</span>
                  </motion.button>
                );
              })}
              <NowLine dayStart={dayStart} hourWidth={hourWidth} />
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function QuickStats({ items }: { items: StatItem[] }) {
  return (
    <div className="grid grid-cols-4 gap-2 mx-4 md:mx-0">
      {items.map((item, index) => (
        <motion.div
          key={item.label}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 + index * 0.07 }}
          className="rounded-2xl p-3"
          style={{ background: item.bg, border: `1px solid ${item.border}` }}
        >
          <span className="text-lg">{item.emoji}</span>
          <p className="text-base font-bold mt-1 leading-none" style={{ color: item.color }}>
            {item.value}
          </p>
          <p className="text-[9px] text-white/45 mt-0.5 leading-tight">{item.label}</p>
          <p className="text-[9px] text-white/30 mt-0.5 leading-tight">{item.sub}</p>
        </motion.div>
      ))}
    </div>
  );
}

function NightModeOverlay({ active }: { active: boolean }) {
  return (
    <AnimatePresence>
      {active && (
        <motion.div
          className="fixed inset-0 z-40 pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{ background: "rgba(60,0,30,0.45)", mixBlendMode: "multiply" }}
        />
      )}
    </AnimatePresence>
  );
}

export default function Index() {
  const navigate = useNavigate();
  const [nightMode, setNightMode] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const hour = new Date().getHours();
  const isEvening = hour >= 21 || hour < 6;

  useEffect(() => {
    const sync = () => setRefreshKey((value) => value + 1);
    sync();

    const timer = window.setInterval(sync, 2500);
    window.addEventListener("focus", sync);
    window.addEventListener("storage", sync);
    document.addEventListener("visibilitychange", sync);

    return () => {
      window.clearInterval(timer);
      window.removeEventListener("focus", sync);
      window.removeEventListener("storage", sync);
      document.removeEventListener("visibilitychange", sync);
    };
  }, []);

  const events = useMemo(
    () => {
      void refreshKey;
      return eventsDB.getAll().slice().sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    },
    [refreshKey],
  );
  const radialItems = useMemo(() => buildRadialItems(events), [events]);
  const predictionItems = useMemo(() => buildPredictionItems(events), [events]);
  const quickStats = useMemo(() => buildQuickStats(events), [events]);
  const timelineItems = useMemo(() => buildTimelineItems(events), [events]);
  const eveningSummary = useMemo(() => buildEveningSummary(events), [events]);

  return (
    <AppLayout>
      <NightModeOverlay active={nightMode} />

      <div className="flex flex-col gap-4 pt-safe pb-6">
        <motion.header
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          className="px-4 pt-4 flex items-center justify-between"
        >
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.35)" }}>
              Дневник
            </p>
            <h1 className="text-xl font-bold text-white">
              {new Date().toLocaleDateString("ru-RU", { weekday: "long", day: "numeric", month: "long" })}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <motion.button
              whileTap={{ scale: 0.85 }}
              onClick={() => setNightMode((value) => !value)}
              className="rounded-full"
            >
              <LiquidSurface
                tone={nightMode ? "health" : "neutral"}
                active={nightMode}
                ambientDelay={0.2}
                className="w-10 h-10 rounded-full"
                contentClassName={cn("w-full h-full rounded-full flex items-center justify-center transition-all", nightMode ? "bg-rose-900/60" : "bg-white/6 border border-white/10")}
              >
                {nightMode ? <Sun className="w-4 h-4 text-rose-300" /> : <Moon className="w-5 h-5 text-white/60" />}
              </LiquidSurface>
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.85 }}
              onClick={() => navigate("/search")}
              className="rounded-full"
            >
              <LiquidSurface
                tone="activity"
                ambientDelay={1}
                className="w-10 h-10 rounded-full"
                contentClassName="w-full h-full rounded-full flex items-center justify-center"
                style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.10)" }}
              >
                <Search className="w-4 h-4 text-white/60" />
              </LiquidSurface>
            </motion.button>
          </div>
        </motion.header>

        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1, duration: 0.5 }}>
          <RadialWidget items={radialItems} onItemPress={(route) => navigate(route)} />
        </motion.div>

        <PredictionBar items={predictionItems} />
        <QuickStats items={quickStats} />
        <HorizontalTimeline items={timelineItems} onAddPress={() => navigate("/add")} onOpenItem={(route) => navigate(route)} />

        <AnimatePresence>
          {isEvening && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="mx-4 p-4 rounded-2xl"
              style={{ background: "linear-gradient(135deg, rgba(124,58,237,0.30), rgba(236,72,153,0.20))", border: "1px solid rgba(167,139,250,0.25)" }}
            >
              <div className="flex items-center gap-3">
                <span className="text-3xl">✨</span>
                <div className="flex-1">
                  <p className="text-sm font-bold text-white">{eveningSummary.title}</p>
                  <p className="text-xs text-white/55">{eveningSummary.text}</p>
                </div>
                <button onClick={() => navigate("/stats")} className="rounded-xl">
                  <LiquidSurface
                    tone="mood"
                    ambientDelay={1.4}
                    className="rounded-xl"
                    contentClassName="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold"
                    style={{ color: P.sleep.color }}
                  >
                    Подробнее <ChevronRight className="w-3.5 h-3.5" />
                  </LiquidSurface>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AppLayout>
  );
}
