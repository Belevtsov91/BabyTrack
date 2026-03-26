import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  TrendingUp, TrendingDown, Minus,
  Plus, Check, Scale, Ruler, Circle,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { AppLayout } from "@/components/layout/AppLayout";
import { eventsDB } from "@/lib/crud";
import {
  ComposedChart, Area, Line, XAxis, YAxis,
  ResponsiveContainer, CartesianGrid, Tooltip,
} from "recharts";

const hc  = (v: string) => `hsl(var(${v}))`;
const hca = (v: string, a: number) => `hsl(var(${v}) / ${a})`;

type Metric = "weight" | "height" | "head";
type Sex    = "boy" | "girl";

interface Measurement {
  month: number;
  value: number;
  date: string;
  timestamp: string;
  notes?: string;
}

const GROWTH_METRICS: Metric[] = ["weight", "height", "head"];

const WHO: Record<Metric, Record<Sex, { month: number; p3: number; p15: number; p50: number; p85: number; p97: number }[]>> = {
  weight: {
    boy: [
      { month: 0,  p3: 2.5,  p15: 2.9,  p50: 3.3,  p85: 3.9,  p97: 4.4  },
      { month: 2,  p3: 4.3,  p15: 5.0,  p50: 5.6,  p85: 6.4,  p97: 7.1  },
      { month: 4,  p3: 5.6,  p15: 6.4,  p50: 7.0,  p85: 7.9,  p97: 8.7  },
      { month: 6,  p3: 6.4,  p15: 7.1,  p50: 7.9,  p85: 8.8,  p97: 9.7  },
      { month: 9,  p3: 7.1,  p15: 8.0,  p50: 8.9,  p85: 9.9,  p97: 10.8 },
      { month: 12, p3: 7.7,  p15: 8.6,  p50: 9.6,  p85: 10.8, p97: 11.8 },
      { month: 18, p3: 8.8,  p15: 9.8,  p50: 10.9, p85: 12.2, p97: 13.4 },
      { month: 24, p3: 9.7,  p15: 10.8, p50: 12.2, p85: 13.6, p97: 14.9 },
    ],
    girl: [
      { month: 0,  p3: 2.4,  p15: 2.8,  p50: 3.2,  p85: 3.7,  p97: 4.2  },
      { month: 2,  p3: 3.9,  p15: 4.5,  p50: 5.1,  p85: 5.8,  p97: 6.5  },
      { month: 4,  p3: 5.0,  p15: 5.7,  p50: 6.4,  p85: 7.3,  p97: 8.1  },
      { month: 6,  p3: 5.7,  p15: 6.5,  p50: 7.3,  p85: 8.2,  p97: 9.1  },
      { month: 9,  p3: 6.4,  p15: 7.3,  p50: 8.2,  p85: 9.2,  p97: 10.2 },
      { month: 12, p3: 6.9,  p15: 7.8,  p50: 8.9,  p85: 10.1, p97: 11.1 },
      { month: 18, p3: 7.8,  p15: 8.8,  p50: 10.2, p85: 11.5, p97: 12.7 },
      { month: 24, p3: 8.7,  p15: 9.8,  p50: 11.5, p85: 13.0, p97: 14.3 },
    ],
  },
  height: {
    boy: [
      { month: 0,  p3: 46.1, p15: 47.9, p50: 49.9, p85: 51.8, p97: 53.4 },
      { month: 2,  p3: 54.4, p15: 56.4, p50: 58.4, p85: 60.4, p97: 62.2 },
      { month: 4,  p3: 59.7, p15: 61.8, p50: 63.9, p85: 66.0, p97: 67.8 },
      { month: 6,  p3: 63.3, p15: 65.5, p50: 67.6, p85: 69.8, p97: 71.6 },
      { month: 9,  p3: 67.7, p15: 69.9, p50: 72.0, p85: 74.2, p97: 76.2 },
      { month: 12, p3: 71.0, p15: 73.4, p50: 75.7, p85: 78.0, p97: 80.2 },
      { month: 18, p3: 76.0, p15: 78.6, p50: 82.3, p85: 84.8, p97: 87.1 },
      { month: 24, p3: 81.0, p15: 83.5, p50: 87.1, p85: 90.5, p97: 93.0 },
    ],
    girl: [
      { month: 0,  p3: 45.4, p15: 47.3, p50: 49.1, p85: 51.0, p97: 52.9 },
      { month: 2,  p3: 52.7, p15: 54.7, p50: 57.1, p85: 59.1, p97: 61.1 },
      { month: 4,  p3: 57.8, p15: 60.0, p50: 62.1, p85: 64.3, p97: 66.2 },
      { month: 6,  p3: 61.2, p15: 63.5, p50: 65.7, p85: 68.0, p97: 70.0 },
      { month: 9,  p3: 65.3, p15: 67.7, p50: 70.1, p85: 72.6, p97: 74.7 },
      { month: 12, p3: 68.9, p15: 71.4, p50: 74.0, p85: 76.7, p97: 79.2 },
      { month: 18, p3: 74.0, p15: 76.6, p50: 80.7, p85: 83.4, p97: 85.9 },
      { month: 24, p3: 79.3, p15: 82.5, p50: 85.7, p85: 88.7, p97: 91.7 },
    ],
  },
  head: {
    boy: [
      { month: 0,  p3: 32.1, p15: 33.1, p50: 34.5, p85: 35.8, p97: 37.0 },
      { month: 2,  p3: 36.4, p15: 37.5, p50: 39.1, p85: 40.4, p97: 41.5 },
      { month: 4,  p3: 38.9, p15: 40.0, p50: 41.3, p85: 42.6, p97: 43.6 },
      { month: 6,  p3: 40.5, p15: 41.6, p50: 43.3, p85: 44.3, p97: 45.2 },
      { month: 9,  p3: 42.3, p15: 43.3, p50: 45.0, p85: 45.9, p97: 46.9 },
      { month: 12, p3: 43.5, p15: 44.6, p50: 46.5, p85: 47.4, p97: 48.3 },
      { month: 18, p3: 44.9, p15: 46.1, p50: 47.6, p85: 48.8, p97: 49.8 },
      { month: 24, p3: 45.9, p15: 47.2, p50: 48.6, p85: 50.0, p97: 51.0 },
    ],
    girl: [
      { month: 0,  p3: 31.7, p15: 32.7, p50: 33.9, p85: 35.1, p97: 36.2 },
      { month: 2,  p3: 35.6, p15: 36.8, p50: 38.3, p85: 39.6, p97: 40.7 },
      { month: 4,  p3: 38.0, p15: 39.1, p50: 40.6, p85: 41.8, p97: 43.0 },
      { month: 6,  p3: 39.4, p15: 40.6, p50: 42.2, p85: 43.4, p97: 44.5 },
      { month: 9,  p3: 41.0, p15: 42.2, p50: 43.8, p85: 45.0, p97: 46.1 },
      { month: 12, p3: 42.2, p15: 43.5, p50: 45.0, p85: 46.2, p97: 47.3 },
      { month: 18, p3: 43.6, p15: 44.9, p50: 46.5, p85: 47.7, p97: 48.8 },
      { month: 24, p3: 44.7, p15: 46.0, p50: 47.6, p85: 48.9, p97: 50.0 },
    ],
  },
};

const BABY_DATA: Record<Metric, Measurement[]> = {
  weight: [
    { month: 0, value: 3.4,  date: "2024-09-15", timestamp: "2024-09-15T08:00:00.000Z" },
    { month: 2, value: 5.8,  date: "2024-11-15", timestamp: "2024-11-15T08:00:00.000Z" },
    { month: 4, value: 7.2,  date: "2025-01-15", timestamp: "2025-01-15T08:00:00.000Z" },
    { month: 6, value: 8.1,  date: "2025-03-15", timestamp: "2025-03-15T08:00:00.000Z" },
    { month: 9, value: 9.3,  date: "2025-06-15", timestamp: "2025-06-15T08:00:00.000Z" },
  ],
  height: [
    { month: 0, value: 50.0, date: "2024-09-15", timestamp: "2024-09-15T08:00:00.000Z" },
    { month: 2, value: 58.5, date: "2024-11-15", timestamp: "2024-11-15T08:00:00.000Z" },
    { month: 4, value: 64.0, date: "2025-01-15", timestamp: "2025-01-15T08:00:00.000Z" },
    { month: 6, value: 67.8, date: "2025-03-15", timestamp: "2025-03-15T08:00:00.000Z" },
    { month: 9, value: 71.5, date: "2025-06-15", timestamp: "2025-06-15T08:00:00.000Z" },
  ],
  head: [
    { month: 0, value: 34.5, date: "2024-09-15", timestamp: "2024-09-15T08:00:00.000Z" },
    { month: 2, value: 39.0, date: "2024-11-15", timestamp: "2024-11-15T08:00:00.000Z" },
    { month: 4, value: 41.5, date: "2025-01-15", timestamp: "2025-01-15T08:00:00.000Z" },
    { month: 6, value: 43.2, date: "2025-03-15", timestamp: "2025-03-15T08:00:00.000Z" },
    { month: 9, value: 45.1, date: "2025-06-15", timestamp: "2025-06-15T08:00:00.000Z" },
  ],
};

const METRIC_CONFIG: Record<Metric, {
  label: string; unit: string; emoji: string; colorVar: string; icon: LucideIcon;
}> = {
  weight: { label: "Вес",           unit: "кг", emoji: "⚖️",  colorVar: "--health",   icon: Scale  },
  height: { label: "Рост",          unit: "см", emoji: "📏", colorVar: "--activity", icon: Ruler  },
  head:   { label: "Обхват головы", unit: "см", emoji: "🔵", colorVar: "--sleep",    icon: Circle },
};

function calcPercentile(value: number, month: number, metric: Metric, sex: Sex): number {
  const data = WHO[metric][sex];
  const row  = data.reduce((prev, cur) =>
    Math.abs(cur.month - month) < Math.abs(prev.month - month) ? cur : prev
  );
  if (value <= row.p3)  return 3;
  if (value <= row.p15) return 15;
  if (value <= row.p50) return 50;
  if (value <= row.p85) return 85;
  if (value <= row.p97) return 97;
  return 99;
}

function getBirthDate(): string | null {
  try {
    return localStorage.getItem("birthDate");
  } catch {
    return null;
  }
}

function monthsBetween(from: string, to: string) {
  const start = new Date(from);
  const end = new Date(to);
  const months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
  return Math.max(0, months);
}

function buildMeasurementsFromStore(): Record<Metric, Measurement[]> {
  const next: Record<Metric, Measurement[]> = { weight: [], height: [], head: [] };
  const birthDate = getBirthDate();

  eventsDB.getAll().forEach((event) => {
    const metric = event.data?.eventSubType as Metric | undefined;
    if (!metric || !GROWTH_METRICS.includes(metric)) return;

    const value = Number(event.data?.amount ?? event.data?.value);
    if (!Number.isFinite(value)) return;

    const timestamp = event.timestamp;
    next[metric].push({
      month: birthDate ? monthsBetween(birthDate, timestamp) : (event.data?.month ?? 0),
      value,
      date: timestamp.slice(0, 10),
      timestamp,
      notes: event.description,
    });
  });

  GROWTH_METRICS.forEach((metric) => {
    next[metric].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  });

  return next;
}

function buildMeasurementFromFallback(metric: Metric, record: Measurement): Measurement {
  return {
    ...record,
    timestamp: record.timestamp,
    month: record.month,
    notes: metric === "weight" ? "Демо-замер" : undefined,
  };
}

function GrowthRing({ percentile, colorVar }: { percentile: number; colorVar: string }) {
  const color  = hc(colorVar);
  const size   = 120;
  const r      = 48;
  const C      = 2 * Math.PI * r;
  const ARC    = (240 / 360) * C;
  const offset = C - (percentile / 100) * ARC;

  const label =
    percentile <= 3  ? "Ниже нормы" :
    percentile <= 15 ? "Ниже среднего" :
    percentile <= 85 ? "Норма" :
    percentile <= 97 ? "Выше среднего" : "Выше нормы";

  const labelColor =
    percentile <= 3  ? hc("--health") :
    percentile <= 15 ? hc("--diaper") :
    percentile <= 85 ? hc("--feeding") :
    percentile <= 97 ? hc("--diaper") : hc("--health");

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: "rotate(150deg)" }}>
          <circle
            cx={size / 2} cy={size / 2} r={r}
            fill="none"
            stroke="hsl(var(--border))"
            strokeWidth="10"
            strokeDasharray={`${ARC} ${C - ARC}`}
            strokeLinecap="round"
          />
          <motion.circle
            cx={size / 2} cy={size / 2} r={r}
            fill="none"
            stroke={color}
            strokeWidth="10"
            strokeDasharray={`${ARC} ${C - ARC}`}
            strokeDashoffset={offset}
            strokeLinecap="round"
            initial={{ strokeDashoffset: ARC }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.2, ease: "easeOut", delay: 0.3 }}
            style={{ filter: `drop-shadow(0 0 6px ${hca(colorVar, 0.50)})` }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center mt-2">
          <motion.span
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.6 }}
            className="text-2xl font-bold"
            style={{ color }}
          >
            P{percentile}
          </motion.span>
        </div>
      </div>
      <span className="text-xs font-semibold mt-1" style={{ color: labelColor }}>
        {label}
      </span>
    </div>
  );
}

function ZScoreBar({ value, colorVar }: { value: number; colorVar: string }) {
  const color = hc(colorVar);
  const pct   = ((value + 3) / 6) * 100;

  return (
    <div>
      <div className="flex justify-between text-[9px] text-muted-foreground mb-1">
        <span>-3</span><span>-2</span><span>-1</span>
        <span className="font-bold text-foreground">0</span>
        <span>+1</span><span>+2</span><span>+3</span>
      </div>
      <div className="relative h-3 rounded-full overflow-hidden" style={{ background: "hsl(var(--muted))" }}>
        <div
          className="absolute top-0 bottom-0 rounded-full opacity-20"
          style={{
            left:  `${(1 / 6) * 100}%`,
            width: `${(4 / 6) * 100}%`,
            background: hc("--feeding"),
          }}
        />
        <motion.div
          className="absolute top-0.5 bottom-0.5 w-2 rounded-full"
          style={{ backgroundColor: color, left: `calc(${pct}% - 4px)` }}
          initial={{ left: "50%" }}
          animate={{ left: `calc(${pct}% - 4px)` }}
          transition={{ duration: 1, ease: "easeOut", delay: 0.4 }}
        />
      </div>
      <p className="text-[10px] text-center text-muted-foreground mt-1">
        Z-score: <span style={{ color }} className="font-bold">{value.toFixed(2)}</span>
      </p>
    </div>
  );
}

function MeasurementCards({ data, metric, colorVar }: {
  data: Measurement[]; metric: Metric; colorVar: string;
}) {
  const color = hc(colorVar);
  const last3 = [...data].slice(-3).reverse();
  const unit  = METRIC_CONFIG[metric].unit;

  if (last3.length === 0) {
    return (
      <div
        className="rounded-2xl p-3 text-xs text-muted-foreground"
        style={{ background: "hsl(var(--muted))", border: "1px solid hsl(var(--border))" }}
      >
        Пока нет сохранённых замеров.
      </div>
    );
  }

  return (
    <div className="flex gap-2">
      {last3.map((m, i) => {
        const prev  = data[data.length - 1 - i - 1];
        const trend = prev ? (m.value > prev.value ? "up" : m.value < prev.value ? "down" : "flat") : "flat";
        const diff  = prev ? Math.abs(m.value - prev.value).toFixed(1) : null;

        return (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07 }}
            className="flex-1 rounded-2xl p-3"
            style={{
              background: i === 0 ? hca(colorVar, 0.10) : "hsl(var(--muted))",
              border: `1px solid ${i === 0 ? hca(colorVar, 0.20) : "transparent"}`,
            }}
          >
            <p className="text-lg font-bold" style={{ color: i === 0 ? color : "hsl(var(--foreground))" }}>
              {m.value} <span className="text-xs font-normal text-muted-foreground">{unit}</span>
            </p>
            <p className="text-[10px] text-muted-foreground mt-0.5">{m.month}м</p>
            {diff && (
              <div className="flex items-center gap-0.5 mt-1">
                {trend === "up"   && <TrendingUp   className="w-3 h-3 text-green-400" />}
                {trend === "down" && <TrendingDown  className="w-3 h-3 text-orange-400" />}
                {trend === "flat" && <Minus         className="w-3 h-3 text-muted-foreground" />}
                <span className="text-[9px] text-muted-foreground">+{diff}</span>
              </div>
            )}
          </motion.div>
        );
      })}
    </div>
  );
}

function AddMeasurementForm({ metric, colorVar, onAdd }: {
  metric: Metric;
  colorVar: string;
  onAdd: (m: Omit<Measurement, "timestamp">) => void;
}) {
  const [open,  setOpen]  = useState(false);
  const [value, setValue] = useState("");
  const color = hc(colorVar);
  const cfg   = METRIC_CONFIG[metric];

  const handleAdd = () => {
    const v = parseFloat(value);
    if (isNaN(v)) return;
    onAdd({ month: monthsBetween(getBirthDate() ?? new Date().toISOString(), new Date().toISOString()), value: v, date: new Date().toISOString().split("T")[0] });
    setValue("");
    setOpen(false);
  };

  return (
    <div>
      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 px-4 py-3 rounded-2xl w-full transition-all"
        style={{
          background: open ? hca(colorVar, 0.12) : "hsl(var(--muted))",
          border: `1px solid ${open ? hca(colorVar, 0.25) : "transparent"}`,
        }}
      >
        <Plus className="w-4 h-4" style={{ color }} />
        <span className="text-sm font-semibold" style={{ color }}>
          Добавить замер
        </span>
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="pt-3 flex gap-2">
              <div
                className="flex-1 flex items-center gap-2 px-4 py-3 rounded-2xl"
                style={{ background: "hsl(var(--muted))", border: `1px solid ${hca(colorVar, 0.19)}` }}
              >
                <input
                  type="number"
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  placeholder={`Значение (${cfg.unit})`}
                  className="flex-1 bg-transparent text-foreground text-sm placeholder:text-muted-foreground focus:outline-none"
                />
                <span className="text-xs text-muted-foreground">{cfg.unit}</span>
              </div>
              <motion.button
                whileTap={{ scale: 0.88 }}
                onClick={handleAdd}
                className="w-12 h-12 rounded-2xl flex items-center justify-center"
                style={{ background: color }}
              >
                <Check className="w-5 h-5 text-white" />
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function GrowthChart({ metric, sex, babyData, colorVar }: {
  metric: Metric; sex: Sex; babyData: Measurement[]; colorVar: string;
}) {
  const color   = hc(colorVar);
  const whoData = WHO[metric][sex];

  const chartData = whoData.map((row) => {
    const baby = babyData.find((b) => b.month === row.month);
    return { ...row, baby: baby?.value };
  });

  return (
    <div className="w-full min-w-0 h-52">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={chartData} margin={{ top: 4, right: 8, left: -24, bottom: 0 }}>
          <defs>
            <linearGradient id="band97" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor={color} stopOpacity={0.12} />
              <stop offset="100%" stopColor={color} stopOpacity={0.02} />
            </linearGradient>
            <linearGradient id="band50" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor={color} stopOpacity={0.25} />
              <stop offset="100%" stopColor={color} stopOpacity={0.05} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 6" stroke="hsl(var(--border))" vertical={false} />
          <XAxis
            dataKey="month"
            axisLine={false}
            tickLine={false}
            tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
            tickFormatter={(v) => `${v}м`}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 9 }}
            domain={["auto", "auto"]}
          />
          <Tooltip
            contentStyle={{
              background: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              borderRadius: 12,
              fontSize: 11,
            }}
            itemStyle={{ color: "hsl(var(--foreground))" }}
            labelStyle={{ color: "hsl(var(--muted-foreground))" }}
            labelFormatter={(v) => `${v} мес`}
          />

          <Area type="monotone" dataKey="p97" fill="url(#band97)" stroke="transparent" />
          <Area type="monotone" dataKey="p3"  fill="hsl(var(--background))" stroke="transparent" />

          <Area type="monotone" dataKey="p85" fill="url(#band50)" stroke="transparent" />
          <Area type="monotone" dataKey="p15" fill="hsl(var(--background))" stroke="transparent" />

          <Line
            type="monotone" dataKey="p50"
            stroke={color} strokeWidth={1.5}
            strokeDasharray="4 4" dot={false}
            opacity={0.5}
          />

          <Line
            type="monotone" dataKey="baby"
            stroke={color} strokeWidth={2.5}
            dot={{ fill: color, r: 5, strokeWidth: 2, stroke: "hsl(var(--background))" }}
            activeDot={{ r: 7, stroke: color, strokeWidth: 2 }}
            connectNulls
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

export default function GrowthCharts() {
  const lockedSex  = (localStorage.getItem("gender") as Sex | null) ?? "boy";

  const [metric, setMetric] = useState<Metric>("weight");
  const [sex,    setSex]    = useState<Sex>(lockedSex);
  const [data,   setData]   = useState<Record<Metric, Measurement[]>>(() => {
    const stored = buildMeasurementsFromStore();
    return GROWTH_METRICS.some((m) => stored[m].length > 0)
      ? stored
      : {
          weight: BABY_DATA.weight.map((m) => buildMeasurementFromFallback("weight", m)),
          height: BABY_DATA.height.map((m) => buildMeasurementFromFallback("height", m)),
          head: BABY_DATA.head.map((m) => buildMeasurementFromFallback("head", m)),
        };
  });

  const cfg         = METRIC_CONFIG[metric];
  const colorVar    = cfg.colorVar;
  const color       = hc(colorVar);
  const babyData    = data[metric];
  const lastMeasure = babyData[babyData.length - 1];
  const percentile  = lastMeasure ? calcPercentile(lastMeasure.value, lastMeasure.month, metric, sex) : null;
  const zScore      = percentile !== null ? ((percentile - 50) / 25) : null;
  const isOwnGender = sex === lockedSex;

  const handleAdd = (m: Omit<Measurement, "timestamp">) => {
    eventsDB.create({
      type: "activity",
      title: cfg.label,
      description: `${cfg.label}: ${m.value} ${cfg.unit}`,
      timestamp: new Date().toISOString(),
      data: {
        eventSubType: metric,
        amount: m.value,
        unit: cfg.unit,
        month: m.month,
      },
      favorite: false,
    });
    setData(buildMeasurementsFromStore());
  };

  return (
    <AppLayout>
      <div className="flex flex-col gap-4 pt-safe pb-10 xl:max-w-6xl xl:mx-auto">

        <motion.header
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          className="px-4 md:px-6 pt-4"
        >
          <h1 className="text-2xl font-bold text-foreground">Кривые роста</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Нормы ВОЗ 0–24 месяца</p>
        </motion.header>

        <div className="px-4 md:px-6">
          <div
            className="flex p-1 rounded-2xl"
            style={{ background: "hsl(var(--muted))", border: "1px solid hsl(var(--border))" }}
          >
            {([["boy","👦 Мальчик"], ["girl","👧 Девочка"]] as [Sex, string][]).map(([s, label]) => (
              <button
                key={s}
                onClick={() => setSex(s)}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all"
                style={sex === s
                  ? { background: s === "boy" ? hca("--activity", 0.35) : hca("--mood", 0.35), color: "white" }
                  : { color: "hsl(var(--muted-foreground))" }
                }
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-3 px-4 md:px-6">
          {(Object.entries(METRIC_CONFIG) as [Metric, typeof METRIC_CONFIG[Metric]][]).map(([k, v]) => {
            const Icon = v.icon;
            const active = metric === k;
            return (
              <motion.button
                key={k}
                onClick={() => setMetric(k)}
                whileTap={{ scale: 0.9 }}
                className="flex-1 flex flex-col items-center gap-2 py-3 rounded-2xl transition-all"
                style={active
                  ? { background: hca(v.colorVar, 0.12), border: `1.5px solid ${hc(v.colorVar)}` }
                  : { background: "hsl(var(--muted))", border: "1.5px solid transparent" }
                }
              >
                <Icon className="w-5 h-5" style={{ color: active ? hc(v.colorVar) : "hsl(var(--muted-foreground))" }} />
                <span className="text-[10px] font-bold"
                  style={{ color: active ? hc(v.colorVar) : "hsl(var(--muted-foreground))" }}>
                  {v.label}
                </span>
              </motion.button>
            );
          })}
        </div>

        <div className="px-4 md:px-6 md:grid md:grid-cols-[320px_1fr] md:gap-5 md:items-start">
          <div className="flex flex-col gap-4">
            <div
              className="rounded-3xl p-5"
              style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}
            >
              <div className="flex items-start gap-4">
                  {percentile !== null ? (
                    <GrowthRing percentile={percentile} colorVar={colorVar} />
                  ) : (
                    <div className="flex flex-col items-center justify-center w-[120px] h-[120px] rounded-full border border-dashed border-border text-center">
                      <span className="text-[10px] text-muted-foreground px-3">Нет замеров</span>
                    </div>
                  )}
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground mb-1">Последний замер</p>
                    {lastMeasure ? (
                      <>
                        <p className="text-3xl font-bold" style={{ color }}>
                          {lastMeasure.value}
                          <span className="text-sm font-normal text-muted-foreground ml-1">{cfg.unit}</span>
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">{lastMeasure.month} месяцев</p>
                        <p className="text-xs mt-2 text-muted-foreground">
                          {new Date(lastMeasure.date).toLocaleDateString("ru-RU", {
                            day: "numeric", month: "long", year: "numeric"
                          })}
                        </p>
                      </>
                    ) : (
                      <p className="text-sm text-muted-foreground mt-1">
                        Добавьте первый замер, чтобы построить график.
                      </p>
                    )}
                  </div>
                </div>

              {zScore !== null ? (
                <div className="mt-4">
                  <ZScoreBar value={zScore} colorVar={colorVar} />
                </div>
              ) : null}
            </div>

            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2">
                📋 Последние замеры
              </p>
              <MeasurementCards data={babyData} metric={metric} colorVar={colorVar} />
            </div>

            <div>
              {isOwnGender ? (
                  <AddMeasurementForm metric={metric} colorVar={colorVar} onAdd={handleAdd} />
              ) : (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-3 p-4 rounded-2xl"
                  style={{ background: "hsl(var(--muted))", border: "1px solid hsl(var(--border))" }}
                >
                  <span className="text-xl shrink-0">
                    {lockedSex === "boy" ? "👦" : "👧"}
                  </span>
                  <p className="text-xs text-muted-foreground">
                    Добавление замеров доступно только для вашего малыша
                    ({lockedSex === "boy" ? "мальчик" : "девочка"}).
                    Здесь отображаются нормы ВОЗ для сравнения.
                  </p>
                </motion.div>
              )}
            </div>
          </div>

          <div
            className="mt-4 md:mt-0 rounded-3xl p-4"
            style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}
          >
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">
              📈 График ВОЗ
            </p>
            <GrowthChart metric={metric} sex={sex} babyData={babyData} colorVar={colorVar} />

            <div className="flex gap-4 mt-2 justify-center flex-wrap">
              {[
                { label: "P3–P97",     style: "opacity-30", dash: false },
                { label: "P15–P85",    style: "opacity-60", dash: false },
                { label: "P50 медиана",style: "opacity-50", dash: true  },
                { label: "Малыш",      style: "",           dash: false },
              ].map((l, i) => (
                <div key={i} className="flex items-center gap-1.5">
                  <div
                    className={cn("w-5 h-0.5 rounded", l.dash && "border-t border-dashed")}
                    style={{ backgroundColor: l.dash ? "transparent" : color,
                             borderColor: l.dash ? color : undefined,
                             opacity: l.style.includes("30") ? 0.3 : l.style.includes("60") ? 0.6 : 1 }}
                  />
                  <span className="text-[9px] text-muted-foreground">{l.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </AppLayout>
  );
}
