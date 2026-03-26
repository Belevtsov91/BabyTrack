import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TrendingUp, TrendingDown, Minus, ChevronRight, Calendar } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { cn } from "@/lib/utils";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  ResponsiveContainer,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { eventsDB, milestonesDB, temperatureDB, vaccinationsDB } from "@/lib/crud";

const hca = (c: string, a: number) => c.replace(/\)$/, ` / ${a})`);

type HeatCat = "sleep" | "feeding" | "diaper";
type DateRange = "7d" | "30d" | "90d" | "year" | "custom";

type StreamPoint = {
  day: string;
  sleep: number;
  feeding: number;
  diaper: number;
};

type HeatmapPoint = {
  day: number;
  sleep: number;
  feeding: number;
  diaper: number;
};

type RhythmPoint = {
  hour: number;
  sleep: number;
  feeding: number;
  diaper: number;
};

type TrendPill = {
  emoji: string;
  label: string;
  value: string;
  dir: "up" | "down" | "flat";
  color: string;
};

const CAT = {
  sleep: { color: "hsl(var(--sleep))", label: "Сон", emoji: "🌙" },
  feeding: { color: "hsl(var(--feeding))", label: "Кормление", emoji: "🍼" },
  diaper: { color: "hsl(var(--diaper))", label: "Подгузник", emoji: "👶" },
};

const RANGE_OPTS: { id: DateRange; label: string }[] = [
  { id: "7d", label: "7 дней" },
  { id: "30d", label: "30 дней" },
  { id: "90d", label: "3 мес" },
  { id: "year", label: "Год" },
  { id: "custom", label: "Свой" },
];

const RANGE_COMPARE: Record<DateRange, string> = {
  "7d": "vs прошлые 7 дней",
  "30d": "vs прошлый месяц",
  "90d": "vs предыдущие 3 мес",
  "year": "vs прошлый год",
  "custom": "Произвольный диапазон",
};

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function isoDay(date: Date): string {
  return startOfDay(date).toISOString().slice(0, 10);
}

function sleepDurationHours(event: ReturnType<typeof eventsDB.getAll>[number]): number {
  return (event.duration ?? 90) / 60;
}

function getRangeBounds(range: DateRange, customFrom: string, customTo: string) {
  const end = new Date();
  end.setHours(23, 59, 59, 999);

  if (range === "custom") {
    const start = new Date(customFrom);
    const customEnd = new Date(customTo);
    start.setHours(0, 0, 0, 0);
    customEnd.setHours(23, 59, 59, 999);
    return { start, end: customEnd };
  }

  const start = new Date(end);
  if (range === "7d") start.setDate(end.getDate() - 6);
  if (range === "30d") start.setDate(end.getDate() - 29);
  if (range === "90d") start.setDate(end.getDate() - 89);
  if (range === "year") start.setMonth(end.getMonth() - 11, 1);
  start.setHours(0, 0, 0, 0);
  return { start, end };
}

function filterEventsByRange(events: ReturnType<typeof eventsDB.getAll>, start: Date, end: Date) {
  return events.filter((event) => {
    const timestamp = new Date(event.timestamp);
    return !Number.isNaN(timestamp.getTime()) && timestamp >= start && timestamp <= end;
  });
}

function buildStreamData(events: ReturnType<typeof eventsDB.getAll>, endDate: Date): StreamPoint[] {
  return Array.from({ length: 7 }, (_, index) => {
    const day = new Date(endDate);
    day.setDate(endDate.getDate() - (6 - index));
    const key = isoDay(day);
    const dayEvents = events.filter((event) => event.timestamp.slice(0, 10) === key);

    return {
      day: day.toLocaleDateString("ru-RU", { weekday: "short" }).replace(".", ""),
      sleep: Number(dayEvents.filter((event) => event.type === "sleep").reduce((sum, event) => sum + sleepDurationHours(event), 0).toFixed(1)),
      feeding: dayEvents.filter((event) => event.type === "feeding").length,
      diaper: dayEvents.filter((event) => event.type === "diaper").length,
    };
  });
}

function buildHeatmapDays(events: ReturnType<typeof eventsDB.getAll>, endDate: Date): HeatmapPoint[] {
  return Array.from({ length: 28 }, (_, index) => {
    const day = new Date(endDate);
    day.setDate(endDate.getDate() - (27 - index));
    const key = isoDay(day);
    const dayEvents = events.filter((event) => event.timestamp.slice(0, 10) === key);

    return {
      day: index,
      sleep: Math.min(4, dayEvents.filter((event) => event.type === "sleep").length),
      feeding: Math.min(4, dayEvents.filter((event) => event.type === "feeding").length),
      diaper: Math.min(4, dayEvents.filter((event) => event.type === "diaper").length),
    };
  });
}

function buildRhythmData(events: ReturnType<typeof eventsDB.getAll>): RhythmPoint[] {
  return Array.from({ length: 24 }, (_, hour) => {
    const hourEvents = events.filter((event) => new Date(event.timestamp).getHours() === hour);
    return {
      hour,
      sleep: hourEvents.filter((event) => event.type === "sleep").length,
      feeding: hourEvents.filter((event) => event.type === "feeding").length,
      diaper: hourEvents.filter((event) => event.type === "diaper").length,
    };
  });
}

function compareValue(current: number, previous: number) {
  if (current === previous) return { dir: "flat" as const, value: "=" };
  if (previous === 0) return { dir: "up" as const, value: "+100%" };

  const diff = Math.round(((current - previous) / previous) * 100);
  return {
    dir: diff > 0 ? "up" as const : diff < 0 ? "down" as const : "flat" as const,
    value: `${diff > 0 ? "+" : ""}${diff}%`,
  };
}

function SleepMoon({ sleepHours, streamData }: { sleepHours: number; streamData: StreamPoint[] }) {
  const norm = 11;
  const pct = Math.min(sleepHours / norm, 1);
  const size = 120;
  const r = size / 2;
  const fillY = size - pct * size;
  const peakSleep = Math.max(...streamData.map((item) => item.sleep), 0);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.2, type: "spring" }}
      className="rounded-3xl p-5 flex flex-col items-center gap-3"
      style={{
        background: "linear-gradient(160deg, hsl(var(--sleep-soft)), hsl(var(--card)))",
        border: "1px solid hsl(var(--sleep) / 0.25)",
      }}
    >
      <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest self-start">
        🌙 Лунный трекер сна
      </p>

      <div className="flex items-center gap-6">
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <defs>
            <clipPath id="moon-fill">
              <rect x="0" y={fillY} width={size} height={size - fillY} />
            </clipPath>
            <radialGradient id="moon-glow" cx="40%" cy="35%">
              <stop offset="0%" stopColor="hsl(var(--sleep-soft))" />
              <stop offset="100%" stopColor="hsl(var(--sleep))" />
            </radialGradient>
          </defs>
          <circle cx={r} cy={r} r={r - 4} fill="hsl(var(--sleep-soft))" stroke="hsl(var(--sleep) / 0.4)" strokeWidth="1.5" />
          <motion.circle
            cx={r}
            cy={r}
            r={r - 4}
            fill="url(#moon-glow)"
            clipPath="url(#moon-fill)"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 1 }}
          />
          <text x={r} y={r + 5} textAnchor="middle" fill="white" fontSize="18" fontWeight="bold">
            {Math.round(pct * 100)}%
          </text>
        </svg>

        <div className="flex flex-col gap-3">
          <div>
            <p className="text-2xl font-bold text-white">{sleepHours.toFixed(1)}ч</p>
            <p className="text-xs text-muted-foreground">среднее за период</p>
          </div>
          <div className="flex flex-col gap-1">
            {[
              { label: "Среднее", value: `${sleepHours.toFixed(1)}ч`, color: "hsl(var(--activity))" },
              { label: "Пик", value: `${peakSleep.toFixed(1)}ч`, color: "hsl(var(--sleep))" },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-xs text-muted-foreground">{item.label}</span>
                <span className="text-xs font-semibold text-white ml-auto">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="w-full flex gap-1">
        {streamData.map((item, index) => {
          const height = Math.min(item.sleep / norm, 1);
          return (
            <div key={`${item.day}-${index}`} className="flex-1 flex flex-col items-center gap-1">
              <div className="w-full h-10 rounded-lg overflow-hidden bg-white/5 relative">
                <motion.div
                  className="absolute bottom-0 w-full rounded-lg"
                  style={{ backgroundColor: "hsl(var(--sleep))", opacity: 0.7 }}
                  initial={{ height: 0 }}
                  animate={{ height: `${height * 100}%` }}
                  transition={{ delay: 0.4 + index * 0.06, duration: 0.6 }}
                />
              </div>
              <span className="text-[9px] text-muted-foreground">{item.day[0]}</span>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}

function HeatMap({ heatmapDays }: { heatmapDays: HeatmapPoint[] }) {
  const [activeCat, setActiveCat] = useState<HeatCat>("sleep");
  const color = CAT[activeCat].color;
  const weeks = [0, 1, 2, 3];
  const days = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

  const intensityColor = (value: number) => {
    if (value === 0) return "hsl(var(--muted))";
    const opacity = [0.15, 0.35, 0.6, 0.85, 1][value] ?? 1;
    return hca(color, opacity);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="rounded-3xl p-4"
      style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}
    >
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">📆 Активность за 4 недели</p>
        <div className="flex gap-1">
          {(Object.keys(CAT) as HeatCat[]).map((key) => (
            <button
              key={key}
              onClick={() => setActiveCat(key)}
              className={cn(
                "px-2 py-1 rounded-lg text-[10px] font-semibold transition-all",
                activeCat === key ? "text-white" : "text-muted-foreground bg-muted/50",
              )}
              style={activeCat === key ? { backgroundColor: hca(CAT[key].color, 0.19), color: CAT[key].color } : {}}
            >
              {CAT[key].emoji}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-1 mb-1 ml-6">
        {days.map((day) => (
          <div key={day} className="flex-1 text-center text-[9px] text-muted-foreground">
            {day}
          </div>
        ))}
      </div>

      <div className="flex gap-1.5">
        <div className="flex flex-col gap-1 justify-around">
          {weeks.map((week) => (
            <span key={week} className="text-[9px] text-muted-foreground/50 h-6 flex items-center">
              {week + 1}н
            </span>
          ))}
        </div>
        <div className="flex-1 flex flex-col gap-1">
          {weeks.map((week) => (
            <div key={week} className="flex gap-1">
              {days.map((_, dayIndex) => {
                const item = heatmapDays[week * 7 + dayIndex];
                const value = item?.[activeCat] ?? 0;
                return (
                  <motion.div
                    key={`${week}-${dayIndex}`}
                    className="flex-1 h-6 rounded-md"
                    style={{ backgroundColor: intensityColor(value) }}
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: (week * 7 + dayIndex) * 0.008 }}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-1.5 mt-3 justify-end">
        <span className="text-[9px] text-muted-foreground">Меньше</span>
        {[0, 1, 2, 3, 4].map((value) => (
          <div key={value} className="w-4 h-4 rounded-sm" style={{ backgroundColor: intensityColor(value) }} />
        ))}
        <span className="text-[9px] text-muted-foreground">Больше</span>
      </div>
    </motion.div>
  );
}

function RhythmChart({ rhythmData }: { rhythmData: RhythmPoint[] }) {
  const [activeCat, setActiveCat] = useState<HeatCat>("feeding");

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className="rounded-3xl p-4"
      style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}
    >
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">⏰ Ритм дня</p>
        <div className="flex gap-1">
          {(Object.keys(CAT) as HeatCat[]).map((key) => (
            <button
              key={key}
              onClick={() => setActiveCat(key)}
              className={cn(
                "px-2 py-1 rounded-lg text-[10px] font-semibold transition-all",
                activeCat === key ? "text-white" : "text-muted-foreground bg-muted/50",
              )}
              style={activeCat === key ? { backgroundColor: hca(CAT[key].color, 0.19), color: CAT[key].color } : {}}
            >
              {CAT[key].emoji}
            </button>
          ))}
        </div>
      </div>

      <div className="w-full min-w-0 h-28">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={rhythmData} margin={{ top: 4, right: 4, left: -28, bottom: 0 }}>
            <defs>
              <linearGradient id="rhythm-grad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={CAT[activeCat].color} stopOpacity={0.5} />
                <stop offset="100%" stopColor={CAT[activeCat].color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 6" stroke="hsl(var(--border))" vertical={false} />
            <XAxis
              dataKey="hour"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 9 }}
              tickFormatter={(value) => value % 4 === 0 ? `${value}:00` : ""}
            />
            <YAxis hide />
            <Area
              type="monotone"
              dataKey={activeCat}
              stroke={CAT[activeCat].color}
              strokeWidth={2}
              fill="url(#rhythm-grad)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <p className="text-[10px] text-muted-foreground mt-1 text-center">
        Частота событий по часам за выбранный период
      </p>
    </motion.div>
  );
}

function TrendPills({ trends }: { trends: TrendPill[] }) {
  return (
    <div className="flex gap-2 flex-wrap">
      {trends.map((trend, index) => (
        <motion.div
          key={trend.label}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 + index * 0.07 }}
          className="flex items-center gap-2 px-3 py-2 rounded-2xl"
          style={{ backgroundColor: hca(trend.color, 0.08), border: `1px solid ${hca(trend.color, 0.19)}` }}
        >
          <span className="text-base">{trend.emoji}</span>
          <div>
            <p className="text-[10px] text-muted-foreground">{trend.label}</p>
            <div className="flex items-center gap-1">
              {trend.dir === "up" && <TrendingUp className="w-3 h-3" style={{ color: trend.color }} />}
              {trend.dir === "down" && <TrendingDown className="w-3 h-3" style={{ color: trend.color }} />}
              {trend.dir === "flat" && <Minus className="w-3 h-3" style={{ color: trend.color }} />}
              <span className="text-xs font-bold" style={{ color: trend.color }}>{trend.value}</span>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

function StreamGraph({ streamData }: { streamData: StreamPoint[] }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
      className="rounded-3xl p-4"
      style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}
    >
      <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">📊 Активность за неделю</p>

      <div className="w-full min-w-0 h-40">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={streamData} margin={{ top: 4, right: 4, left: -28, bottom: 0 }}>
            <defs>
              {(Object.entries(CAT) as [HeatCat, typeof CAT[HeatCat]][]).map(([key, value]) => (
                <linearGradient key={key} id={`sg-${key}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={value.color} stopOpacity={0.6} />
                  <stop offset="100%" stopColor={value.color} stopOpacity={0.1} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid strokeDasharray="3 6" stroke="hsl(var(--border))" vertical={false} />
            <XAxis
              dataKey="day"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
            />
            <YAxis hide />
            <Tooltip
              contentStyle={{
                background: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: 12,
                fontSize: 11,
              }}
              itemStyle={{ color: "hsl(var(--foreground))" }}
              labelStyle={{ color: "hsl(var(--muted-foreground))" }}
            />
            {(Object.keys(CAT) as HeatCat[]).map((key) => (
              <Area
                key={key}
                type="monotone"
                dataKey={key}
                stackId="1"
                stroke={CAT[key].color}
                strokeWidth={1.5}
                fill={`url(#sg-${key})`}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="flex gap-4 mt-2 justify-center">
        {(Object.entries(CAT) as [HeatCat, typeof CAT[HeatCat]][]).map(([key, value]) => (
          <div key={key} className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: value.color }} />
            <span className="text-[10px] text-muted-foreground">{value.label}</span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

export default function Stats() {
  const navigate = useNavigate();
  const [range, setRange] = useState<DateRange>("7d");
  const [refreshKey, setRefreshKey] = useState(0);
  const [customFrom, setCustomFrom] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 7);
    return date.toISOString().slice(0, 10);
  });
  const [customTo, setCustomTo] = useState(() => new Date().toISOString().slice(0, 10));

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

  const {
    totalEvents,
    totalTemps,
    completedVax,
    completedMilestones,
    averageSleepHours,
    streamData,
    heatmapDays,
    rhythmData,
    trends,
  } = useMemo(() => {
    void refreshKey;
    const bounds = getRangeBounds(range, customFrom, customTo);
    const allEvents = eventsDB.getAll();
    const filteredEvents = filterEventsByRange(allEvents, bounds.start, bounds.end);
    const previousDuration = bounds.end.getTime() - bounds.start.getTime();
    const previousEnd = new Date(bounds.start.getTime() - 1);
    const previousStart = new Date(previousEnd.getTime() - previousDuration);
    const previousEvents = filterEventsByRange(allEvents, previousStart, previousEnd);

    const filteredTemps = temperatureDB.getAll().filter((item) => {
      const timestamp = new Date(item.timestamp);
      return !Number.isNaN(timestamp.getTime()) && timestamp >= bounds.start && timestamp <= bounds.end;
    });
    const filteredVaccines = vaccinationsDB.getAll().filter((item) => {
      const timestamp = new Date(item.completedDate ?? item.scheduledDate);
      return !Number.isNaN(timestamp.getTime()) && timestamp >= bounds.start && timestamp <= bounds.end;
    });
    const filteredMilestones = milestonesDB.getAll().filter((item) => {
      if (!item.date) return false;
      const timestamp = new Date(item.date);
      return !Number.isNaN(timestamp.getTime()) && timestamp >= bounds.start && timestamp <= bounds.end;
    });

    const currentSleep = filteredEvents.filter((event) => event.type === "sleep").reduce((sum, event) => sum + sleepDurationHours(event), 0);
    const previousSleep = previousEvents.filter((event) => event.type === "sleep").reduce((sum, event) => sum + sleepDurationHours(event), 0);
    const currentFeeding = filteredEvents.filter((event) => event.type === "feeding").length;
    const previousFeeding = previousEvents.filter((event) => event.type === "feeding").length;
    const currentDiaper = filteredEvents.filter((event) => event.type === "diaper").length;
    const previousDiaper = previousEvents.filter((event) => event.type === "diaper").length;
    const latestTemp = filteredTemps[0] ?? temperatureDB.getAll()[0];

    const sleepTrend = compareValue(Number(currentSleep.toFixed(1)), Number(previousSleep.toFixed(1)));
    const feedingTrend = compareValue(currentFeeding, previousFeeding);
    const diaperTrend = compareValue(currentDiaper, previousDiaper);
    const weeklyEvents = filterEventsByRange(allEvents, new Date(bounds.end.getTime() - 6 * 86400000), bounds.end);
    const stream = buildStreamData(weeklyEvents, bounds.end);

    return {
      totalEvents: filteredEvents.length,
      totalTemps: filteredTemps.length,
      completedVax: filteredVaccines.filter((item) => item.status === "completed").length,
      completedMilestones: filteredMilestones.filter((item) => item.completed).length,
      averageSleepHours: Number((stream.reduce((sum, item) => sum + item.sleep, 0) / Math.max(stream.length, 1)).toFixed(1)),
      streamData: stream,
      heatmapDays: buildHeatmapDays(filteredEvents, bounds.end),
      rhythmData: buildRhythmData(filteredEvents),
      trends: [
        { emoji: "🌙", label: "Сон", value: sleepTrend.value, dir: sleepTrend.dir, color: CAT.sleep.color },
        { emoji: "🍼", label: "Кормление", value: feedingTrend.value, dir: feedingTrend.dir, color: CAT.feeding.color },
        { emoji: "👶", label: "Подгузник", value: diaperTrend.value, dir: diaperTrend.dir, color: CAT.diaper.color },
        {
          emoji: "🌡️",
          label: "Температура",
          value: latestTemp ? `${latestTemp.value.toFixed(1)}°` : "—",
          dir: "flat",
          color: "hsl(var(--health))",
        },
      ] as TrendPill[],
    };
  }, [customFrom, customTo, range, refreshKey]);

  return (
    <AppLayout>
      <div className="flex flex-col gap-5 pt-safe pb-8 xl:max-w-6xl xl:mx-auto">
        <motion.header initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="px-4 pt-4">
          <h1 className="text-2xl font-bold text-foreground">Статистика</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Аналитика и паттерны</p>
        </motion.header>

        <div className="px-4 flex flex-col gap-2">
          <div className="flex gap-1.5 overflow-x-auto scrollbar-hide" style={{ padding: "4px 0" }}>
            {RANGE_OPTS.map((opt) => (
              <motion.button
                key={opt.id}
                onClick={() => setRange(opt.id)}
                whileTap={{ scale: 0.92 }}
                className="shrink-0 px-4 py-2 rounded-xl text-xs font-semibold transition-all"
                style={range === opt.id
                  ? { background: "var(--primary-gradient, hsl(var(--primary)))", color: "white" }
                  : { background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", color: "hsl(var(--muted-foreground))" }
                }
              >
                {opt.id === "custom" ? (
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {opt.label}
                  </span>
                ) : opt.label}
              </motion.button>
            ))}
          </div>

          <AnimatePresence>
            {range === "custom" && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.22, ease: "easeInOut" }}
                style={{ overflow: "hidden" }}
              >
                <div className="flex gap-2 pt-1">
                  <div className="flex-1 flex flex-col gap-1">
                    <span className="text-[10px] text-muted-foreground px-1">С</span>
                    <input
                      type="date"
                      value={customFrom}
                      max={customTo}
                      onChange={(event) => setCustomFrom(event.target.value)}
                      className="w-full h-9 px-3 rounded-xl text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                      style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}
                    />
                  </div>
                  <div className="flex-1 flex flex-col gap-1">
                    <span className="text-[10px] text-muted-foreground px-1">По</span>
                    <input
                      type="date"
                      value={customTo}
                      min={customFrom}
                      max={new Date().toISOString().slice(0, 10)}
                      onChange={(event) => setCustomTo(event.target.value)}
                      className="w-full h-9 px-3 rounded-xl text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                      style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}
                    />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="px-4">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2">
            {RANGE_COMPARE[range]}
          </p>
          <TrendPills trends={trends} />
        </div>

        <div className="px-4 md:px-6 grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="md:col-span-2">
            <SleepMoon sleepHours={averageSleepHours} streamData={streamData} />
          </div>
          <HeatMap heatmapDays={heatmapDays} />
          <RhythmChart rhythmData={rhythmData} />
          <div className="md:col-span-2">
            <StreamGraph streamData={streamData} />
          </div>
        </div>

        <div className="px-4 md:px-6 grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Всего записей", value: totalEvents, color: "hsl(var(--sleep))", emoji: "📝" },
            { label: "Замеры темп.", value: totalTemps, color: "hsl(var(--health))", emoji: "🌡️" },
            { label: "Прививки ✓", value: completedVax, color: "hsl(var(--feeding))", emoji: "💉" },
            { label: "Достижения", value: completedMilestones, color: "hsl(var(--milestone))", emoji: "🏆" },
          ].map((card, index) => (
            <motion.div
              key={card.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + index * 0.06 }}
              className="rounded-2xl p-4"
              style={{ background: hca(card.color, 0.06), border: `1px solid ${hca(card.color, 0.15)}` }}
            >
              <span className="text-xl">{card.emoji}</span>
              <p className="text-2xl font-bold mt-1" style={{ color: card.color }}>{card.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{card.label}</p>
            </motion.div>
          ))}
        </div>

        <div className="px-4 md:px-6 grid grid-cols-1 md:grid-cols-3 gap-2">
          {[
            { label: "Кривые роста ВОЗ", emoji: "📏", path: "/growth", color: "hsl(var(--feeding))" },
            { label: "PDF отчёт", emoji: "📄", path: "/report", color: "hsl(var(--health))" },
            { label: "Итог года", emoji: "✨", path: "/recap", color: "hsl(var(--mood))" },
          ].map((link, index) => (
            <motion.button
              key={link.path}
              onClick={() => navigate(link.path)}
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 + index * 0.07 }}
              whileTap={{ scale: 0.97 }}
              className="flex items-center gap-3 p-4 rounded-2xl"
              style={{ background: hca(link.color, 0.06), border: `1px solid ${hca(link.color, 0.15)}` }}
            >
              <span className="text-xl">{link.emoji}</span>
              <span className="flex-1 text-sm font-semibold text-foreground">{link.label}</span>
              <ChevronRight className="w-4 h-4 text-muted-foreground/50" />
            </motion.button>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
