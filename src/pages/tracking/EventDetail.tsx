import { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Camera, Play, Pause, RotateCcw, Check, Clock,
  Calendar, ChevronRight, Plus, Minus,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { eventsDB } from "@/lib/crud";
import { SK } from "@/lib/storageKeys";
import {
  BarChart, Bar, XAxis, ResponsiveContainer, Tooltip,
} from "recharts";
import { toast } from "@/hooks/use-toast";
import { SidebarLayout } from "@/components/layout/SidebarLayout";

// ─── CSS variable color helpers ───────────────────────────────────────────────
// Usage: hc("--sleep") → "hsl(var(--sleep))"
//        hca("--sleep", 0.15) → "hsl(var(--sleep) / 0.15)"
const hc  = (v: string) => `hsl(var(${v}))`;
const hca = (v: string, a: number) => `hsl(var(${v}) / ${a})`;

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────
interface EventConfig {
  title: string;
  emoji: string;
  color: string;
  darkBg: string;
  category: string;
  type: string;
  hasTimer?: boolean;
  hasAmount?: boolean;
  hasDiaper?: boolean;
  hasBreast?: boolean;
  hasDuration?: boolean;
  hasTemp?: boolean;
  hasVaccineName?: boolean;
  hasMedForm?: boolean;
  hasDoctorFields?: boolean;
}

const EVENT_CONFIG: Record<string, EventConfig> = {
  sleep:       { title: "Сон",              emoji: "🌙", color: "--sleep",    darkBg: "--sleep-soft",    category: "sleep",    type: "sleep",    hasTimer: true,  hasDuration: true  },
  breast:      { title: "Кормление грудью", emoji: "🤱", color: "--feeding",  darkBg: "--feeding-soft",  category: "feeding",  type: "feeding",  hasTimer: true,  hasBreast: true    },
  bottle:      { title: "Бутылочка",        emoji: "🍼", color: "--feeding",  darkBg: "--feeding-soft",  category: "feeding",  type: "feeding",  hasAmount: true                     },
  solid:       { title: "Прикорм",          emoji: "🥣", color: "--feeding",  darkBg: "--feeding-soft",  category: "feeding",  type: "feeding",  hasAmount: true                     },
  pump:        { title: "Сцеживание",       emoji: "🥛", color: "--feeding",  darkBg: "--feeding-soft",  category: "feeding",  type: "feeding",  hasTimer: true,  hasAmount: true    },
  diaper:      { title: "Подгузник",        emoji: "👶", color: "--diaper",   darkBg: "--diaper-soft",   category: "diaper",   type: "diaper",   hasDiaper: true                     },
  walk:        { title: "Прогулка",         emoji: "🚶", color: "--activity", darkBg: "--activity-soft", category: "activity", type: "activity", hasTimer: true,  hasDuration: true  },
  bath:        { title: "Купание",          emoji: "🛁", color: "--activity", darkBg: "--activity-soft", category: "activity", type: "activity", hasDuration: true                   },
  weight:      { title: "Вес",              emoji: "⚖️",  color: "--growth",   darkBg: "--growth-soft",   category: "growth",   type: "activity", hasAmount: true                     },
  height:      { title: "Рост",             emoji: "📏", color: "--growth",   darkBg: "--growth-soft",   category: "growth",   type: "activity", hasAmount: true                     },
  head:        { title: "Обхват головы",    emoji: "🔵", color: "--growth",   darkBg: "--growth-soft",   category: "growth",   type: "activity", hasAmount: true                     },
  temperature: { title: "Температура",      emoji: "🌡️", color: "--health",   darkBg: "--health-soft",   category: "health",   type: "temperature", hasTemp: true                  },
  doctor:      { title: "Визит к врачу",    emoji: "👨‍⚕️", color: "--health",   darkBg: "--health-soft",   category: "health",   type: "activity", hasDoctorFields: true              },
  vaccine:     { title: "Прививка",         emoji: "💉", color: "--health",   darkBg: "--health-soft",   category: "health",   type: "activity", hasVaccineName: true               },
  medication:  { title: "Лекарство",        emoji: "💊", color: "--health",   darkBg: "--health-soft",   category: "health",   type: "activity", hasMedForm: true                   },
  mood:        { title: "Настроение",       emoji: "😊", color: "--mood",     darkBg: "--mood-soft",     category: "mood",     type: "mood"                                         },
};

// ─────────────────────────────────────────────────────────────────────────────
// UTILITIES
// ─────────────────────────────────────────────────────────────────────────────
function formatTime(sec: number) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// CIRCULAR TIMER
// ─────────────────────────────────────────────────────────────────────────────
function CircularTimer({
  elapsed, running, onToggle, onReset, color,
}: {
  elapsed: number; running: boolean;
  onToggle: () => void; onReset: () => void; color: string;
}) {
  const maxSec = 60 * 60;
  const pct    = Math.min(elapsed / maxSec, 1);
  const R = 70;
  const C = 2 * Math.PI * R;

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative w-44 h-44 flex items-center justify-center">
        <svg className="absolute inset-0 -rotate-90" width="176" height="176">
          <circle cx="88" cy="88" r={R} fill="none" stroke="hsl(var(--border))" strokeWidth="8" />
          <motion.circle
            cx="88" cy="88" r={R} fill="none" stroke={hc(color)} strokeWidth="8"
            strokeLinecap="round" strokeDasharray={C}
            animate={{ strokeDashoffset: C - pct * C }}
            transition={{ duration: 0.5 }}
            style={{ filter: `drop-shadow(0 0 8px ${hca(color, 0.50)})` }}
          />
        </svg>
        <div className="flex flex-col items-center">
          <motion.span
            className="text-4xl font-bold tabular-nums" style={{ color: hc(color) }}
            animate={{ scale: running ? [1, 1.04, 1] : 1 }}
            transition={{ duration: 1, repeat: running ? Infinity : 0 }}
          >
            {formatTime(elapsed)}
          </motion.span>
          {running && (
            <motion.div className="flex gap-1 mt-1" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              {[0, 1, 2].map((i) => (
                <motion.div key={i} className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: hc(color) }}
                  animate={{ scaleY: [1, 2, 1] }}
                  transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
                />
              ))}
            </motion.div>
          )}
        </div>
      </div>
      <div className="flex gap-3">
        <motion.button whileTap={{ scale: 0.88 }} onClick={onReset}
          className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center">
          <RotateCcw className="w-5 h-5 text-white/60" />
        </motion.button>
        <motion.button whileTap={{ scale: 0.88 }} onClick={onToggle}
          className="w-20 h-20 rounded-full flex items-center justify-center"
          style={{ backgroundColor: hc(color), boxShadow: `0 0 24px ${hca(color, 0.38)}` }}>
          {running ? <Pause className="w-8 h-8 text-white" /> : <Play className="w-8 h-8 text-white ml-1" />}
        </motion.button>
        <div className="w-12 h-12" />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// BREAST SELECTOR
// ─────────────────────────────────────────────────────────────────────────────
function BreastSelector({
  value, onChange, color,
}: { value: "left" | "right" | "both"; onChange: (v: "left" | "right" | "both") => void; color: string }) {
  const opts = [
    { id: "left",  label: "Левая",  emoji: "←" },
    { id: "right", label: "Правая", emoji: "→" },
    { id: "both",  label: "Обе",    emoji: "↔" },
  ] as const;

  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Грудь</p>
      <div className="flex gap-2">
        {opts.map((o) => (
          <motion.button key={o.id} onClick={() => onChange(o.id)} whileTap={{ scale: 0.9 }}
            className="flex-1 py-3 rounded-2xl flex flex-col items-center gap-1 transition-all"
            style={value === o.id
              ? { backgroundColor: hca(color, 0.15), border: `1.5px solid ${hc(color)}` }
              : { backgroundColor: "hsl(var(--card))", border: "1.5px solid transparent" }}>
            <span className="text-lg" style={{ color: value === o.id ? hc(color) : "hsl(var(--muted-foreground))" }}>{o.emoji}</span>
            <span className="text-xs font-semibold" style={{ color: value === o.id ? hc(color) : "hsl(var(--muted-foreground))" }}>{o.label}</span>
          </motion.button>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// DIAPER SELECTOR
// ─────────────────────────────────────────────────────────────────────────────
function DiaperSelector({ value, onChange, color }: { value: string; onChange: (v: string) => void; color: string }) {
  const opts = [
    { id: "wet",   label: "Мокрый",    emoji: "💧" },
    { id: "dirty", label: "Грязный",   emoji: "💩" },
    { id: "mixed", label: "Смешанный", emoji: "💧💩" },
    { id: "clean", label: "Чистый",    emoji: "✨" },
  ];
  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Тип</p>
      <div className="grid grid-cols-2 gap-2">
        {opts.map((o) => (
          <motion.button key={o.id} onClick={() => onChange(o.id)} whileTap={{ scale: 0.9 }}
            className="py-4 rounded-2xl flex flex-col items-center gap-1.5 transition-all"
            style={value === o.id
              ? { backgroundColor: hca(color, 0.15), border: `1.5px solid ${hc(color)}` }
              : { backgroundColor: "hsl(var(--card))", border: "1.5px solid transparent" }}>
            <span className="text-2xl">{o.emoji}</span>
            <span className="text-xs font-semibold" style={{ color: value === o.id ? hc(color) : "hsl(var(--muted-foreground))" }}>{o.label}</span>
          </motion.button>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// AMOUNT INPUT
// ─────────────────────────────────────────────────────────────────────────────
function AmountInput({
  value, onChange, color, unit = "мл",
}: { value: number; onChange: (v: number) => void; color: string; unit?: string }) {
  const steps = [5, 10, 20, 50];
  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Количество</p>
      <div className="rounded-2xl p-4 flex items-center gap-4"
        style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}>
        <motion.button whileTap={{ scale: 0.8 }} onClick={() => onChange(Math.max(0, value - 10))}
          className="w-10 h-10 rounded-full flex items-center justify-center text-xl font-bold"
          style={{ backgroundColor: hca(color, 0.12), color: hc(color) }}>−
        </motion.button>
        <div className="flex-1 text-center">
          <motion.span key={value} initial={{ y: -10, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
            className="text-4xl font-bold tabular-nums" style={{ color: hc(color) }}>
            {value}
          </motion.span>
          <span className="text-sm text-muted-foreground ml-1">{unit}</span>
        </div>
        <motion.button whileTap={{ scale: 0.8 }} onClick={() => onChange(value + 10)}
          className="w-10 h-10 rounded-full flex items-center justify-center text-xl font-bold"
          style={{ backgroundColor: hca(color, 0.12), color: hc(color) }}>+
        </motion.button>
      </div>
      <div className="flex gap-2">
        {steps.map((s) => (
          <button key={s} onClick={() => onChange(value + s)}
            className="flex-1 py-2 rounded-xl text-xs font-semibold transition-all"
            style={{ backgroundColor: hca(color, 0.08), color: hc(color), border: `1px solid ${hca(color, 0.19)}` }}>
            +{s}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TEMPERATURE INPUT (Issue 15) — digital thermometer
// ─────────────────────────────────────────────────────────────────────────────
function TemperatureInput({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const step = 0.1;
  const tempVar   = value < 37.5 ? "--feeding" : value < 38.5 ? "--diaper" : "--health";
  const tempColor = hc(tempVar);
  const tempLabel =
    value < 37.5 ? "Норма" :
    value < 38.5 ? "Субфебрильная" : "Высокая";

  const fillPct = Math.min(Math.max((value - 35) / 7, 0), 1);

  const PRESETS = [36.0, 36.6, 37.0, 37.5, 38.0, 38.5, 39.0];

  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Температура тела</p>

      {/* Main display */}
      <div className="rounded-2xl p-4 flex items-center gap-4"
        style={{ background: "hsl(var(--muted))", border: `1.5px solid ${tempColor}` }}>

        {/* Thermometer visual */}
        <div className="flex flex-col items-center gap-1 shrink-0">
          <div className="relative w-5 h-24 rounded-full overflow-hidden" style={{ background: "hsl(var(--accent))" }}>
            <motion.div
              className="absolute bottom-0 w-full rounded-full"
              style={{ backgroundColor: tempColor }}
              animate={{ height: `${fillPct * 100}%` }}
              transition={{ type: "spring", stiffness: 80, damping: 12 }}
            />
          </div>
          <motion.div
            className="w-7 h-7 rounded-full border-2"
            animate={{ backgroundColor: tempColor, borderColor: tempColor }}
            transition={{ duration: 0.4 }}
          />
        </div>

        {/* Digital value */}
        <div className="flex-1 flex flex-col items-center gap-1">
          <motion.p
            key={value.toFixed(1)}
            initial={{ y: -6, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="text-5xl font-bold tabular-nums leading-none"
            style={{ color: tempColor }}
          >
            {value.toFixed(1)}
          </motion.p>
          <p className="text-sm font-semibold" style={{ color: tempColor }}>°C · {tempLabel}</p>
        </div>

        {/* +/- */}
        <div className="flex flex-col gap-2 shrink-0">
          <motion.button
            whileTap={{ scale: 0.85 }}
            onClick={() => onChange(Math.min(42, +(value + step).toFixed(1)))}
            className="w-10 h-10 rounded-full flex items-center justify-center"
            style={{ backgroundColor: hca(tempVar, 0.12), color: tempColor, opacity: 0.85 }}>
            <Plus className="w-4 h-4" />
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.85 }}
            onClick={() => onChange(Math.max(35, +(value - step).toFixed(1)))}
            className="w-10 h-10 rounded-full flex items-center justify-center"
            style={{ backgroundColor: hca(tempVar, 0.12), color: tempColor, opacity: 0.85 }}>
            <Minus className="w-4 h-4" />
          </motion.button>
        </div>
      </div>

      {/* Preset chips */}
      <div className="flex gap-1.5 flex-wrap">
        {PRESETS.map((t) => {
          const active = Math.abs(value - t) < 0.05;
          const cv = t < 37.5 ? "--feeding" : t < 38.5 ? "--diaper" : "--health";
          const c  = hc(cv);
          return (
            <button key={t} onClick={() => onChange(t)}
              className="px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all"
              style={{
                backgroundColor: active ? hca(cv, 0.12) : "hsl(var(--card))",
                color: active ? c : "hsl(var(--muted-foreground))",
                border: `1px solid ${active ? c : "transparent"}`,
              }}>
              {t.toFixed(1)}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// VACCINE NAME INPUT (Issue 17)
// ─────────────────────────────────────────────────────────────────────────────
function VaccineNameInput({ value, onChange, color }: { value: string; onChange: (v: string) => void; color: string }) {
  const [focused, setFocused] = useState(false);
  const COMMON = [
    "АКДС", "ОПВ", "ИПВ", "КПК", "БЦЖ",
    "Пневмококковая (ПКВ13)", "Менингококковая",
    "Гепатит B", "Ветряная оспа", "Грипп",
  ];
  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Название вакцины</p>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder="Введите или выберите..."
        className="w-full h-12 px-4 rounded-2xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
        style={{
          background: "hsl(var(--muted))",
          border: `1.5px solid ${focused ? hc(color) : hca(color, 0.20)}`,
        }}
      />
      <div className="flex gap-1.5 flex-wrap">
        {COMMON.map((v) => (
          <button key={v} onClick={() => onChange(v)}
            className="px-2.5 py-1 rounded-xl text-[10px] font-semibold transition-all"
            style={{
              backgroundColor: value === v ? hca(color, 0.15) : "hsl(var(--card))",
              color: value === v ? hc(color) : "hsl(var(--muted-foreground))",
              border: `1px solid ${value === v ? hc(color) : "transparent"}`,
            }}>
            {v}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// DOCTOR FIELDS (Issue 7 / partial)
// ─────────────────────────────────────────────────────────────────────────────
function DoctorFields({
  name, specialty,
  onNameChange, onSpecialtyChange, color,
}: {
  name: string; specialty: string;
  onNameChange: (v: string) => void; onSpecialtyChange: (v: string) => void; color: string;
}) {
  const SPECIALTIES = ["Педиатр", "Невролог", "Хирург", "ЛОР", "Офтальмолог", "Ортопед", "Дерматолог", "Аллерголог"];
  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Врач</p>
      <input
        value={name}
        onChange={(e) => onNameChange(e.target.value)}
        placeholder="ФИО врача (необязательно)"
        className="w-full h-11 px-4 rounded-2xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
        style={{ background: "hsl(var(--muted))", border: `1.5px solid ${hca(color, 0.20)}` }}
      />
      <div className="flex gap-1.5 flex-wrap">
        {SPECIALTIES.map((s) => (
          <button key={s} onClick={() => onSpecialtyChange(s)}
            className="px-2.5 py-1 rounded-xl text-[10px] font-semibold transition-all"
            style={{
              backgroundColor: specialty === s ? hca(color, 0.15) : "hsl(var(--card))",
              color: specialty === s ? hc(color) : "hsl(var(--muted-foreground))",
              border: `1px solid ${specialty === s ? hc(color) : "transparent"}`,
            }}>
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MEDICATION FORM (Issue 18) — full form with autocomplete + schedule
// ─────────────────────────────────────────────────────────────────────────────
interface MedData {
  name: string; purpose: string; form: string;
  dose: string; unit: string; frequency: string; days: string;
}

const MED_FORMS = [
  { id: "таблетка",     emoji: "💊" },
  { id: "суспензия",    emoji: "🍶" },
  { id: "капли",        emoji: "💧" },
  { id: "спрей",        emoji: "🌬️" },
  { id: "свечи",        emoji: "🕯️" },
  { id: "мазь/крем",   emoji: "🧴" },
  { id: "порошок",      emoji: "🥛" },
];

const FREQ_OPTIONS = [
  "1 раз в день", "2 раза в день", "3 раза в день",
  "4 раза в день", "каждые 4 часа", "каждые 6 часов",
  "каждые 8 часов", "каждые 12 часов", "по необходимости",
];

function MedicationForm({ data, onChange, color }: { data: MedData; onChange: (d: MedData) => void; color: string }) {
  const [nameFocused, setNameFocused] = useState(false);
  const [suggestions, setSuggestions] = useState<{ name: string; purpose: string; form: string; unit: string }[]>([]);

  // Load autocomplete history
  useEffect(() => {
    try {
      const hist = localStorage.getItem("babytrack_med_history");
      if (hist) setSuggestions(JSON.parse(hist));
    } catch {}
  }, []);

  const filtered = data.name.length >= 2
    ? suggestions.filter((s) => s.name.toLowerCase().includes(data.name.toLowerCase()))
    : [];

  const applySuggestion = (s: typeof suggestions[0]) => {
    onChange({ ...data, name: s.name, purpose: s.purpose, form: s.form, unit: s.unit });
  };

  const set = (key: keyof MedData) => (v: string) => onChange({ ...data, [key]: v });

  // Generate schedule text
  const schedule = (() => {
    if (!data.name || !data.frequency) return "";
    const times: string[] = [];
    const count = parseInt(data.frequency) || 0;
    if (data.frequency.includes("раз")) {
      const base = [6, 12, 18, 22];
      for (let i = 0; i < count && i < base.length; i++) {
        times.push(`${base[i]}:00`);
      }
    } else if (data.frequency.includes("часа") || data.frequency.includes("часов")) {
      const match = data.frequency.match(/\d+/);
      const interval = match ? parseInt(match[0]) : 8;
      let h = 8;
      while (h < 24) { times.push(`${h}:00`); h += interval; }
    }
    if (times.length === 0) return "";
    return `Приём: ${times.join(", ")} — ${data.days || "?"} дн.`;
  })();

  return (
    <div className="flex flex-col gap-4">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Лекарство</p>

      {/* Name + autocomplete */}
      <div className="relative">
        <input
          value={data.name}
          onChange={(e) => set("name")(e.target.value)}
          onFocus={() => setNameFocused(true)}
          onBlur={() => setTimeout(() => setNameFocused(false), 150)}
          placeholder="Название препарата..."
          className="w-full h-11 px-4 rounded-2xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
          style={{ background: "hsl(var(--muted))", border: `1.5px solid ${nameFocused ? hc(color) : hca(color, 0.20)}` }}
        />
        <AnimatePresence>
          {nameFocused && filtered.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="absolute top-full left-0 right-0 mt-1 rounded-2xl overflow-hidden z-20"
              style={{ background: "hsl(var(--card))", border: `1px solid ${hca(color, 0.20)}` }}>
              {filtered.slice(0, 5).map((s) => (
                <button key={s.name} onMouseDown={() => applySuggestion(s)}
                  className="w-full text-left px-4 py-2.5 text-sm text-foreground hover:bg-white/5 transition-colors flex items-center gap-2">
                  <span className="font-semibold">{s.name}</span>
                  <span className="text-xs text-muted-foreground">· {s.purpose}</span>
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Purpose */}
      <input
        value={data.purpose}
        onChange={(e) => set("purpose")(e.target.value)}
        placeholder="От чего / зачем..."
        className="w-full h-11 px-4 rounded-2xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
        style={{ background: "hsl(var(--muted))", border: `1.5px solid ${hca(color, 0.20)}` }}
      />

      {/* Form type */}
      <div className="flex gap-2 flex-wrap">
        {MED_FORMS.map((f) => (
          <button key={f.id} onClick={() => set("form")(f.id)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all"
            style={{
              backgroundColor: data.form === f.id ? hca(color, 0.15) : "hsl(var(--card))",
              color: data.form === f.id ? hc(color) : "hsl(var(--muted-foreground))",
              border: `1px solid ${data.form === f.id ? hc(color) : "transparent"}`,
            }}>
            <span>{f.emoji}</span> {f.id}
          </button>
        ))}
      </div>

      {/* Dose row */}
      <div className="flex gap-2">
        <input
          value={data.dose}
          onChange={(e) => set("dose")(e.target.value)}
          placeholder="Доза"
          className="flex-1 h-11 px-4 rounded-2xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
          style={{ background: "hsl(var(--muted))", border: `1.5px solid ${hca(color, 0.20)}` }}
        />
        <input
          value={data.unit}
          onChange={(e) => set("unit")(e.target.value)}
          placeholder="мл / мг / шт"
          className="w-24 h-11 px-3 rounded-2xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
          style={{ background: "hsl(var(--muted))", border: `1.5px solid ${hca(color, 0.20)}` }}
        />
      </div>

      {/* Frequency */}
      <div className="flex flex-col gap-1.5">
        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Частота приёма</p>
        <div className="flex gap-1.5 flex-wrap">
          {FREQ_OPTIONS.map((f) => (
            <button key={f} onClick={() => set("frequency")(f)}
              className="px-2.5 py-1 rounded-xl text-[10px] font-semibold transition-all"
              style={{
                backgroundColor: data.frequency === f ? hca(color, 0.15) : "hsl(var(--card))",
                color: data.frequency === f ? hc(color) : "hsl(var(--muted-foreground))",
                border: `1px solid ${data.frequency === f ? hc(color) : "transparent"}`,
              }}>
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Duration */}
      <div className="flex items-center gap-3">
        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide shrink-0">Курс (дней):</p>
        {["1","3","5","7","10","14"].map((d) => (
          <button key={d} onClick={() => set("days")(d)}
            className="w-9 h-9 rounded-xl text-xs font-bold transition-all"
            style={{
              backgroundColor: data.days === d ? hca(color, 0.15) : "hsl(var(--card))",
              color: data.days === d ? hc(color) : "hsl(var(--muted-foreground))",
              border: `1px solid ${data.days === d ? hc(color) : "transparent"}`,
            }}>
            {d}
          </button>
        ))}
      </div>

      {/* Generated schedule */}
      <AnimatePresence>
        {schedule && (
          <motion.div
            initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="rounded-2xl px-4 py-3"
            style={{ background: hca(color, 0.07), border: `1px solid ${hca(color, 0.20)}` }}>
            <p className="text-xs font-semibold" style={{ color: hc(color) }}>📅 {schedule}</p>
            <p className="text-[10px] text-muted-foreground mt-1">
              Добавьте в Напоминания чтобы получать уведомления
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MINI STATS CHART
// ─────────────────────────────────────────────────────────────────────────────
type ChartRange = "7д" | "30д" | "3м";

function MiniStatsChart({ eventType, color }: { eventType: string; color: string }) {
  const [range, setRange] = useState<ChartRange>("7д");

  const chartData = useMemo(() => {
    const all = (eventsDB.getAll() as any[]).filter(
      (e) => e.data?.eventSubType === eventType || (e.type === eventType && !e.data?.eventSubType),
    );

    const days = range === "7д" ? 7 : range === "30д" ? 30 : 90;
    const now  = new Date();

    return Array.from({ length: days }, (_, i) => {
      const d = new Date(now);
      d.setDate(d.getDate() - (days - 1 - i));
      const dateStr = d.toISOString().slice(0, 10);

      const dayEvents = all.filter((e) => e.timestamp.slice(0, 10) === dateStr);

      let value = 0;
      if (dayEvents.length > 0) {
        const sample = dayEvents[0];
        if (sample.duration !== undefined) {
          // sum durations (minutes)
          value = dayEvents.reduce((s: number, e: any) => s + (e.duration ?? 0), 0);
        } else if (sample.data?.temperature !== undefined) {
          // last temperature of the day
          value = dayEvents[dayEvents.length - 1].data.temperature;
        } else if (sample.data?.amount !== undefined) {
          // sum amounts
          value = dayEvents.reduce((s: number, e: any) => s + (e.data?.amount ?? 0), 0);
        } else {
          // plain count
          value = dayEvents.length;
        }
      }

      // Short label
      const label =
        days <= 7
          ? d.toLocaleDateString("ru-RU", { weekday: "short" })
          : days <= 30
            ? `${d.getDate()}`
            : `${d.getDate()}/${d.getMonth() + 1}`;

      return { day: label, value };
    });
  }, [eventType, range]);

  // Determine display unit
  const unitLabel = useMemo(() => {
    const sample = (eventsDB.getAll() as any[]).find(
      (e) => e.data?.eventSubType === eventType || (e.type === eventType && !e.data?.eventSubType),
    );
    if (!sample) return "шт";
    if (sample.duration !== undefined) return "мин";
    if (sample.data?.temperature !== undefined) return "°C";
    if (sample.data?.amount !== undefined) return sample.data.unit ?? "мл";
    return "шт";
  }, [eventType]);

  const hasData = chartData.some((d) => d.value > 0);

  const tickInterval =
    range === "3м" ? 13 : range === "30д" ? 4 : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl p-4"
      style={{ background: "hsl(var(--muted))", border: `1px solid ${hca(color, 0.12)}` }}
    >
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
          📊 Статистика
        </p>
        <div
          className="flex gap-0.5 p-0.5 rounded-lg"
          style={{ background: "hsl(var(--accent))" }}
        >
          {(["7д", "30д", "3м"] as ChartRange[]).map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className="px-2.5 py-1 rounded-md text-[10px] font-semibold transition-all"
              style={
                range === r
                  ? { background: hc(color), color: "white" }
                  : { color: "hsl(var(--muted-foreground))" }
              }
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {hasData ? (
        <>
          <div className="w-full min-w-0 h-24">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 2, right: 2, left: -22, bottom: 0 }}
                barCategoryGap="35%"
              >
                <XAxis
                  dataKey="day"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 9 }}
                  interval={tickInterval}
                />
                <Tooltip
                  cursor={{ fill: hca(color, 0.08) }}
                  contentStyle={{
                    background: "hsl(var(--card))",
                    border: `1px solid ${hca(color, 0.20)}`,
                    borderRadius: 10,
                    fontSize: 11,
                    padding: "4px 10px",
                  }}
                  itemStyle={{ color: "hsl(var(--foreground))" }}
                  labelStyle={{ color: "hsl(var(--muted-foreground))" }}
                  formatter={(v: number) => [`${v} ${unitLabel}`, ""]}
                />
                <Bar
                  dataKey="value"
                  fill={hc(color)}
                  radius={[3, 3, 0, 0]}
                  opacity={0.8}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="text-[10px] text-muted-foreground mt-1 text-center">
            {unitLabel === "шт"
              ? "Кол-во событий по дням"
              : unitLabel === "мин"
                ? "Суммарно минут в день"
                : `Объём (${unitLabel}) в день`}
          </p>
        </>
      ) : (
        <div className="h-16 flex items-center justify-center">
          <p className="text-xs text-muted-foreground">Нет данных за период</p>
        </div>
      )}
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SAVE CONFETTI
// ─────────────────────────────────────────────────────────────────────────────
function SaveConfetti({ color }: { color: string }) {
  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {Array.from({ length: 16 }).map((_, i) => (
        <motion.div key={i} className="absolute w-2.5 h-2.5 rounded-full"
          style={{ left: `${30 + Math.random() * 40}%`, top: "70%", backgroundColor: i % 2 === 0 ? hc(color) : "white" }}
          animate={{ y: [0, -(180 + Math.random() * 120)], x: [(Math.random() - 0.5) * 160], opacity: [1, 1, 0], scale: [1, 0.5] }}
          transition={{ duration: 0.9 + Math.random() * 0.4, ease: "easeOut" }}
        />
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
export default function EventDetail() {
  const { eventType } = useParams();
  const navigate      = useNavigate();
  const config        = EVENT_CONFIG[eventType || "sleep"] ?? EVENT_CONFIG.sleep;

  const [mode, setMode] = useState<"manual" | "timer">("manual");

  const [time, setTime] = useState(
    new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false })
  );
  const [date, setDate]   = useState(new Date().toLocaleDateString("en-CA"));
  const [note, setNote]   = useState("");

  // Standard fields
  const [amount, setAmount]         = useState(0);
  const [diaperType, setDiaperType] = useState("wet");
  const [breast, setBreast]         = useState<"left"|"right"|"both">("left");
  // Prefill duration from last saved event of this type
  const [duration, setDuration] = useState(() => {
    const last = eventsDB.getAll().find((e) => e.data?.eventSubType === (eventType ?? ""));
    return last?.duration ?? 0;
  });

  // Timer — restore persisted state so navigating away doesn't lose progress
  const timerKey = SK.TIMER_PREFIX + (eventType ?? "unknown");
  const [elapsed, setElapsed] = useState(() => {
    try {
      const saved = localStorage.getItem(timerKey);
      if (!saved) return 0;
      const { elapsed: e, startedAt, running: wasRunning } = JSON.parse(saved);
      if (wasRunning && startedAt) {
        // Add seconds that passed while the page was closed
        return e + Math.floor((Date.now() - startedAt) / 1000);
      }
      return e ?? 0;
    } catch { return 0; }
  });
  const [running, setRunning] = useState(() => {
    try {
      const saved = localStorage.getItem(timerKey);
      return saved ? JSON.parse(saved).running ?? false : false;
    } catch { return false; }
  });
  const intervalRef = useRef<number | null>(null);

  // New specialist fields
  const [tempValue,    setTempValue]    = useState(36.6);
  const [vaccineName,  setVaccineName]  = useState("");
  const [doctorName,   setDoctorName]   = useState("");
  const [doctorSpec,   setDoctorSpec]   = useState("");
  const [medData,      setMedData]      = useState<MedData>({
    name: "", purpose: "", form: "суспензия", dose: "", unit: "мл",
    frequency: "3 раза в день", days: "5",
  });

  const [saved, setSaved]               = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (running) {
      const startedAt = Date.now();
      intervalRef.current = window.setInterval(() => {
        setElapsed((e) => {
          const next = e + 1;
          // Persist state every tick so navigating away preserves progress
          try { localStorage.setItem(timerKey, JSON.stringify({ elapsed: next, running: true, startedAt })); } catch {}
          return next;
        });
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
      // Persist paused state
      try { localStorage.setItem(timerKey, JSON.stringify({ elapsed, running: false, startedAt: null })); } catch {}
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [running]); // eslint-disable-line react-hooks/exhaustive-deps

  // Warn on unload if timer is running
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (running) { e.preventDefault(); e.returnValue = ""; }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [running]);

  const handleSave = () => {
    const timestamp = new Date(`${date}T${time}`).toISOString();
    const dur = mode === "timer" ? Math.floor(elapsed / 60) : duration;

    // Save medication to history for autocomplete
    if (config.hasMedForm && medData.name.trim()) {
      try {
        const hist = JSON.parse(localStorage.getItem("babytrack_med_history") || "[]");
        if (!hist.some((h: { name: string }) => h.name === medData.name)) {
          hist.unshift({ name: medData.name, purpose: medData.purpose, form: medData.form, unit: medData.unit });
          localStorage.setItem("babytrack_med_history", JSON.stringify(hist.slice(0, 30)));
        }
      } catch {}
    }

    eventsDB.create({
      type:      config.type as any,
      title:     config.title,
      description: note || undefined,
      timestamp,
      duration:  dur || undefined,
      data: {
        eventSubType: eventType,
        ...(amount     && { amount, unit: "ml" }),
        ...(diaperType && config.hasDiaper  && { diaperType }),
        ...(config.hasBreast               && { breast }),
        ...(config.hasTemp                 && { temperature: tempValue }),
        ...(config.hasVaccineName          && vaccineName && { vaccineName }),
        ...(config.hasDoctorFields         && { doctorName, specialty: doctorSpec }),
        ...(config.hasMedForm && medData.name && {
          medName: medData.name, medPurpose: medData.purpose, medForm: medData.form,
          medDose: `${medData.dose} ${medData.unit}`, medFrequency: medData.frequency,
        }),
      },
      favorite: false,
    });

    // Clear persisted timer now that the event is saved
    try { localStorage.removeItem(timerKey); } catch {}
    setSaved(true);
    setShowConfetti(true);
    toast({ title: "Сохранено ✓", description: config.title });
    setTimeout(() => { setShowConfetti(false); navigate(-1); }, 1200);
  };

  return (
    <SidebarLayout>
      <div
        className="min-h-screen flex flex-col"
        style={{ background: hc(config.darkBg) }}
      >
        {showConfetti && <SaveConfetti color={config.color} />}

        {/* Header */}
        <motion.header
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="sticky top-0 z-10 backdrop-blur-xl px-4 md:px-6 py-4"
          style={{ background: hca(config.darkBg, 0.88), borderBottom: `1px solid ${hca(config.color, 0.15)}` }}
        >
          <div className="max-w-4xl mx-auto flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{ backgroundColor: hca(config.color, 0.12) }}
            >
              <ArrowLeft className="w-5 h-5" style={{ color: hc(config.color) }} />
            </button>
            <span className="text-2xl">{config.emoji}</span>
            <h1 className="text-lg font-bold flex-1" style={{ color: hc(config.color) }}>
              {config.title}
            </h1>
          </div>
        </motion.header>

        {/* 2-col on md+ */}
        <div className="px-4 md:px-6 py-4 max-w-4xl mx-auto w-full md:grid md:grid-cols-[1fr_360px] md:gap-6 md:items-start">

          {/* Left column — form */}
          <div className="flex flex-col gap-5">
            {/* Timer mode toggle */}
            {config.hasTimer && (
              <div className="flex p-1 rounded-2xl"
                style={{ background: "hsl(var(--card))", border: `1px solid ${hca(config.color, 0.12)}` }}>
                {(["manual", "timer"] as const).map((m) => (
                  <button key={m} onClick={() => setMode(m)}
                    className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all"
                    style={mode === m
                      ? { backgroundColor: hc(config.color), color: "white" }
                      : { color: "hsl(var(--muted-foreground))" }}>
                    {m === "manual" ? "Вручную" : "Таймер"}
                  </button>
                ))}
              </div>
            )}

            <AnimatePresence mode="wait">
              {mode === "timer" && config.hasTimer ? (
                <motion.div key="timer" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }} className="flex flex-col items-center py-4">
                  <CircularTimer elapsed={elapsed} running={running}
                    onToggle={() => setRunning((r) => !r)}
                    onReset={() => { setRunning(false); setElapsed(0); }}
                    color={config.color}
                  />
                </motion.div>
              ) : (
                <motion.div key="manual" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }} className="flex flex-col gap-4">
                  <div className="rounded-2xl p-4 flex gap-4"
                    style={{ background: "hsl(var(--muted))", border: `1px solid ${hca(config.color, 0.12)}` }}>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Calendar className="w-3.5 h-3.5" style={{ color: hc(config.color) }} />
                        <span className="text-xs text-muted-foreground">Дата</span>
                      </div>
                      <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
                        className="bg-transparent text-foreground text-base font-semibold focus:outline-none w-full" />
                    </div>
                    <div className="w-px bg-white/10" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Clock className="w-3.5 h-3.5" style={{ color: hc(config.color) }} />
                        <span className="text-xs text-muted-foreground">Время</span>
                      </div>
                      <input type="time" value={time} onChange={(e) => setTime(e.target.value)}
                        className="bg-transparent text-foreground text-base font-semibold focus:outline-none w-full" />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Event-specific inputs */}
            {config.hasBreast      && <BreastSelector value={breast} onChange={setBreast} color={config.color} />}
            {config.hasDiaper      && <DiaperSelector value={diaperType} onChange={setDiaperType} color={config.color} />}
            {config.hasTemp        && <TemperatureInput value={tempValue} onChange={setTempValue} />}
            {config.hasVaccineName && <VaccineNameInput value={vaccineName} onChange={setVaccineName} color={config.color} />}
            {config.hasDoctorFields && (
              <DoctorFields name={doctorName} specialty={doctorSpec}
                onNameChange={setDoctorName} onSpecialtyChange={setDoctorSpec}
                color={config.color} />
            )}
            {config.hasMedForm && <MedicationForm data={medData} onChange={setMedData} color={config.color} />}

            {config.hasAmount && (
              <AmountInput value={amount} onChange={setAmount} color={config.color}
                unit={eventType === "weight" ? "кг" : eventType === "height" || eventType === "head" ? "см" : "мл"}
              />
            )}

            {config.hasDuration && mode === "manual" && (
              <AmountInput value={duration} onChange={setDuration} color={config.color} unit="мин" />
            )}

            {/* Note */}
            <div className="flex flex-col gap-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Заметка</p>
              <textarea value={note} onChange={(e) => setNote(e.target.value)}
                placeholder="Добавьте заметку..."
                rows={3}
                className="w-full rounded-2xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none resize-none"
                style={{ background: "hsl(var(--muted))", border: `1px solid ${hca(config.color, 0.12)}` }}
              />
            </div>

            {/* Save button — visible in left col on md+ */}
            <div className="hidden md:block pb-8">
              <motion.button onClick={handleSave} disabled={saved} whileTap={{ scale: 0.96 }}
                animate={saved ? { scale: [1, 1.06, 1] } : {}}
                className="w-full h-14 rounded-2xl text-lg font-bold text-white flex items-center justify-center gap-2"
                style={{
                  background: saved
                    ? hc("--feeding")
                    : `linear-gradient(135deg, ${hc(config.color)}, ${hca(config.color, 0.75)})`,
                  boxShadow: saved ? "none" : `0 8px 24px ${hca(config.color, 0.32)}`,
                }}>
                {saved ? <><Check className="w-6 h-6" /> Сохранено</> : "Сохранить"}
              </motion.button>
            </div>
          </div>

          {/* Right column — chart + links */}
          <div className="flex flex-col gap-5 mt-5 md:mt-0">
            <MiniStatsChart eventType={eventType ?? "sleep"} color={config.color} />

            <div className="flex gap-2">
              <motion.button whileTap={{ scale: 0.96 }}
                onClick={() => navigate("/photos")}
                className="flex-1 flex items-center gap-2 px-4 py-3 rounded-2xl"
                style={{ background: "hsl(var(--muted))", border: `1px solid ${hca(config.color, 0.12)}` }}>
                <Camera className="w-4 h-4" style={{ color: hc(config.color) }} />
                <span className="text-sm font-medium text-muted-foreground">Фото</span>
              </motion.button>
              <motion.button whileTap={{ scale: 0.96 }}
                onClick={() => navigate("/calendar")}
                className="flex-1 flex items-center gap-2 px-4 py-3 rounded-2xl"
                style={{ background: "hsl(var(--muted))", border: `1px solid ${hca(config.color, 0.12)}` }}>
                <Calendar className="w-4 h-4" style={{ color: hc(config.color) }} />
                <span className="text-sm font-medium text-muted-foreground">Календарь</span>
                <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/40 ml-auto" />
              </motion.button>
            </div>
          </div>
        </div>

        {/* Save button — mobile only */}
        <div className="md:hidden px-4 pb-8 pt-2">
          <motion.button onClick={handleSave} disabled={saved} whileTap={{ scale: 0.96 }}
            animate={saved ? { scale: [1, 1.06, 1] } : {}}
            className="w-full h-14 rounded-2xl text-lg font-bold text-white flex items-center justify-center gap-2"
            style={{
              background: saved
                ? hc("--feeding")
                : `linear-gradient(135deg, ${hc(config.color)}, ${hca(config.color, 0.75)})`,
              boxShadow: saved ? "none" : `0 8px 24px ${hca(config.color, 0.32)}`,
            }}>
            {saved ? <><Check className="w-6 h-6" /> Сохранено</> : "Сохранить"}
          </motion.button>
        </div>
      </div>
    </SidebarLayout>
  );
}
