import { useState, useEffect } from "react";
import { motion, AnimatePresence, useMotionValue, useTransform } from "framer-motion";
import {
  Plus, Bell, BellOff, Check, Clock, X,
  ChevronRight, Sparkles, Repeat, Trash2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { AppLayout } from "@/components/layout/AppLayout";
import { toast } from "@/hooks/use-toast";

const hca = (c: string, a: number) => c.replace(/\)$/, ` / ${a})`);
const STORAGE_KEY = "babytrack_reminders";

type RepeatDay = 0 | 1 | 2 | 3 | 4 | 5 | 6;

interface Reminder {
  id: string;
  title: string;
  emoji: string;
  color: string;
  time: string;
  repeatDays: RepeatDay[];
  enabled: boolean;
  category: "feeding" | "sleep" | "meds" | "doctor" | "custom";
  note?: string;
}

const RU_DAYS_SHORT = ["Пн","Вт","Ср","Чт","Пт","Сб","Вс"];

const INITIAL: Reminder[] = [
  {
    id: "r1", title: "Утреннее кормление", emoji: "🍼",
    color: "hsl(var(--feeding))", time: "07:00",
    repeatDays: [0,1,2,3,4,5,6], enabled: true, category: "feeding",
  },
  {
    id: "r2", title: "Витамин Д3", emoji: "💊",
    color: "hsl(var(--diaper))", time: "09:00",
    repeatDays: [0,1,2,3,4,5,6], enabled: true, category: "meds",
    note: "1 капля в молоко",
  },
  {
    id: "r3", title: "Дневной сон", emoji: "🌙",
    color: "hsl(var(--sleep))", time: "13:00",
    repeatDays: [0,1,2,3,4], enabled: true, category: "sleep",
  },
  {
    id: "r4", title: "Визит к педиатру", emoji: "👨‍⚕️",
    color: "hsl(var(--health))", time: "10:00",
    repeatDays: [], enabled: true, category: "doctor",
    note: "Плановый осмотр 9 месяцев",
  },
  {
    id: "r5", title: "Вечернее купание", emoji: "🛁",
    color: "hsl(var(--activity))", time: "19:30",
    repeatDays: [0,1,2,3,4,5,6], enabled: false, category: "custom",
  },
];

const SMART_SUGGEST = [
  { emoji: "🌡️", title: "Измерение температуры", color: "hsl(var(--health))",   time: "08:00", category: "meds"    as const },
  { emoji: "⚖️",  title: "Взвешивание",           color: "hsl(var(--feeding))", time: "09:00", category: "custom" as const },
  { emoji: "📏",  title: "Измерение роста",        color: "hsl(var(--activity))", time: "09:00", category: "custom" as const },
  { emoji: "🦷",  title: "Массаж дёсен",           color: "hsl(var(--mood))", time: "18:00", category: "custom" as const },
];

function readReminders(): Reminder[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return INITIAL;
    const parsed = JSON.parse(saved) as Reminder[];
    return Array.isArray(parsed) ? parsed : INITIAL;
  } catch {
    return INITIAL;
  }
}

function minutesUntil(timeStr: string): number {
  const [h, m] = timeStr.split(":").map(Number);
  const now    = new Date();
  const target = new Date();
  target.setHours(h, m, 0, 0);
  if (target <= now) target.setDate(target.getDate() + 1);
  return Math.floor((target.getTime() - now.getTime()) / 60000);
}

function formatCountdown(minutes: number): string {
  if (minutes < 60) return `${minutes} мин`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}ч ${m}м` : `${h}ч`;
}

function NextAlertCard({ reminders }: { reminders: Reminder[] }) {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setTick((v) => v + 1), 60000);
    return () => clearInterval(t);
  }, []);

  const enabled  = reminders.filter((r) => r.enabled);
  if (!enabled.length) return null;

  const next = enabled
    .map((r) => ({ ...r, mins: minutesUntil(r.time) }))
    .sort((a, b) => a.mins - b.mins)[0];

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-4 md:mx-6 rounded-3xl p-5 relative overflow-hidden"
      style={{
        background: `linear-gradient(135deg, ${hca(next.color, 0.15)}, ${hca(next.color, 0.06)})`,
        border: `1px solid ${hca(next.color, 0.25)}`,
      }}
    >
      <motion.div
        className="absolute -right-6 -top-6 w-28 h-28 rounded-full opacity-15"
        style={{ background: next.color }}
        animate={{ scale: [1, 1.1, 1] }}
        transition={{ duration: 3, repeat: Infinity }}
      />

      <div className="flex items-center gap-4 relative">
        <motion.div
          className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shrink-0"
          style={{ background: `${hca(next.color, 0.19)}` }}
          animate={{ rotate: [0, -5, 5, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 2 }}
        >
          {next.emoji}
        </motion.div>

        <div className="flex-1">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
            Следующее напоминание
          </p>
          <p className="text-base font-bold text-foreground mt-0.5">{next.title}</p>
          <p className="text-sm mt-0.5" style={{ color: next.color }}>
            {next.time} · через {formatCountdown(next.mins)}
          </p>
        </div>

        <div className="flex flex-col items-end shrink-0">
          <motion.span
            key={next.mins}
            initial={{ y: -8, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="text-3xl font-bold tabular-nums"
            style={{ color: next.color }}
          >
            {next.mins < 60 ? next.mins : Math.floor(next.mins / 60)}
          </motion.span>
          <span className="text-[9px] text-muted-foreground">
            {next.mins < 60 ? "мин" : "ч"}
          </span>
        </div>
      </div>
    </motion.div>
  );
}

function ReminderBubble({
  reminder,
  onToggle,
  onDelete,
  onEdit,
}: {
  reminder: Reminder;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit:   (r: Reminder) => void;
}) {
  const x         = useMotionValue(0);
  const background = useTransform(
    x,
    [-80, 0, 80],
    ["hsl(var(--health) / 0.25)", "transparent", "hsl(145,45%,20%)"]
  );
  const [dragging, setDragging] = useState(false);

  const handleDragEnd = (_: any, info: any) => {
    setDragging(false);
    if (info.offset.x < -60) {
      onDelete(reminder.id);
      toast({ title: "Удалено" });
    } else if (info.offset.x > 60) {
      onToggle(reminder.id);
      toast({ title: reminder.enabled ? "Выключено" : "Включено" });
    }
  };

  const mins = minutesUntil(reminder.time);

  return (
    <div className="relative overflow-hidden rounded-3xl">
      <motion.div
        className="absolute inset-0 rounded-3xl flex items-center justify-between px-5"
        style={{ background }}
      >
        <Check className="w-6 h-6 text-green-400" />
        <Trash2 className="w-6 h-6 text-red-400" />
      </motion.div>

      <motion.div
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.3}
        style={{
          x,
          background: reminder.enabled
            ? `${hca(reminder.color, 0.07)}`
            : "hsl(var(--card))",
          border: `1.5px solid ${reminder.enabled ? hca(reminder.color, 0.20) : "hsl(var(--border))"}`,
          opacity: reminder.enabled ? 1 : 0.55,
        }}
        onDragStart={() => setDragging(true)}
        onDragEnd={handleDragEnd}
        whileTap={{ cursor: "grabbing" }}
        layout
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, x: -200, height: 0 }}
        className="relative rounded-3xl p-4 flex items-center gap-3"
        onClick={() => !dragging && onEdit(reminder)}
      >
        <div
          className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0"
          style={{ background: `${hca(reminder.color, 0.12)}` }}
        >
          {reminder.emoji}
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-foreground truncate">{reminder.title}</p>

          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-xs text-muted-foreground">{reminder.time}</span>
            {reminder.enabled && (
              <span
                className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
                style={{ background: `${hca(reminder.color, 0.12)}`, color: reminder.color }}
              >
                через {formatCountdown(mins)}
              </span>
            )}
          </div>

          {reminder.repeatDays.length > 0 && (
            <div className="flex gap-1 mt-1.5 flex-wrap">
              {RU_DAYS_SHORT.map((d, i) => {
                const active = reminder.repeatDays.includes(i as RepeatDay);
                return (
                  <span
                    key={i}
                    className="text-[9px] font-bold px-1.5 py-0.5 rounded-lg"
                    style={{
                      background: active ? `${hca(reminder.color, 0.15)}` : "hsl(var(--muted))",
                      color:      active ? reminder.color : "hsl(var(--muted-foreground))",
                    }}
                  >
                    {d}
                  </span>
                );
              })}
            </div>
          )}
          {reminder.repeatDays.length === 0 && (
            <span className="text-[10px] text-muted-foreground/50 mt-0.5 block">
              Однократно
            </span>
          )}
        </div>

        <motion.button
          onClick={(e) => { e.stopPropagation(); onToggle(reminder.id); }}
          className="w-12 h-6 rounded-full relative shrink-0 transition-colors"
          style={{ background: reminder.enabled ? reminder.color : "hsl(var(--border))" }}
          whileTap={{ scale: 0.9 }}
        >
          <motion.div
            className="absolute top-1 w-4 h-4 rounded-full bg-white"
            animate={{ left: reminder.enabled ? 26 : 4 }}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
          />
        </motion.button>
      </motion.div>
    </div>
  );
}

function SmartSuggestions({ onAdd }: { onAdd: (r: Reminder) => void }) {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-4 md:mx-6 rounded-3xl p-4"
      style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--sleep) / 0.18)" }}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-purple-400" />
          <p className="text-xs font-bold text-purple-400 uppercase tracking-widest">
            Умные предложения
          </p>
        </div>
        <button onClick={() => setDismissed(true)}>
          <X className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>

      <div className="flex flex-col gap-2">
        {SMART_SUGGEST.map((s, i) => (
          <motion.button
            key={i}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.06 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => {
              onAdd({
                id:         `smart-${Date.now()}-${i}`,
                title:      s.title,
                emoji:      s.emoji,
                color:      s.color,
                time:       s.time,
                repeatDays: [0,1,2,3,4,5,6],
                enabled:    true,
                category:   s.category,
              });
              toast({ title: `✅ Добавлено: ${s.title}` });
            }}
            className="flex items-center gap-3 p-3 rounded-2xl"
            style={{ background: `${hca(s.color, 0.07)}`, border: `1px solid ${hca(s.color, 0.15)}` }}
          >
            <span className="text-xl">{s.emoji}</span>
            <div className="flex-1 text-left">
              <p className="text-sm font-semibold text-foreground">{s.title}</p>
              <p className="text-[10px] text-muted-foreground">{s.time} · Ежедневно</p>
            </div>
            <Plus className="w-4 h-4 shrink-0" style={{ color: s.color }} />
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
}

const COLORS = [
  "hsl(var(--feeding))", "hsl(var(--sleep))", "hsl(var(--diaper))",
  "hsl(var(--health))",   "hsl(var(--activity))", "hsl(var(--mood))",
];

const EMOJIS = ["🍼","🌙","💊","👨‍⚕️","🛁","🌡️","⚖️","📏","🦷","💉","🥣","🚶","🎯","⏰","🔔"];

function AddSheet({
  initial: initReminder,
  onSave,
  onClose,
}: {
  initial?: Reminder | null;
  onSave:  (r: Reminder) => void;
  onClose: () => void;
}) {
  const [title,  setTitle]  = useState(initReminder?.title      ?? "");
  const [emoji,  setEmoji]  = useState(initReminder?.emoji      ?? "🔔");
  const [color,  setColor]  = useState(initReminder?.color      ?? COLORS[0]);
  const [time,   setTime]   = useState(initReminder?.time       ?? "08:00");
  const [repeat, setRepeat] = useState<RepeatDay[]>(initReminder?.repeatDays ?? [0,1,2,3,4,5,6]);
  const [note,   setNote]   = useState(initReminder?.note       ?? "");

  const toggleDay = (d: RepeatDay) =>
    setRepeat((prev) => prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d].sort() as RepeatDay[]);

  const handleSave = () => {
    if (!title.trim()) return;
    onSave({
      id:         initReminder?.id ?? `r-${Date.now()}`,
      title:      title.trim(),
      emoji, color, time,
      repeatDays: repeat,
      enabled:    initReminder?.enabled ?? true,
      category:   initReminder?.category ?? "custom",
      note:       note || undefined,
    });
    onClose();
  };

  return (
    <motion.div
      initial={{ y: "100%" }}
      animate={{ y: 0 }}
      exit={{ y: "100%" }}
      transition={{ type: "spring", stiffness: 300, damping: 32 }}
      className="fixed inset-x-0 bottom-0 z-40 max-w-md mx-auto rounded-t-3xl overflow-hidden"
      style={{ background: "hsl(var(--background))", border: "1px solid hsl(var(--border))" }}
    >
      <div className="flex justify-center pt-3 pb-1">
        <div className="w-10 h-1 rounded-full bg-white/20" />
      </div>

      <div className="px-5 pb-10 flex flex-col gap-4 max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-foreground">
            {initReminder ? "Изменить" : "Новое"} напоминание
          </h3>
          <button onClick={onClose}><X className="w-5 h-5 text-muted-foreground" /></button>
        </div>

        <div>
          <p className="text-xs text-muted-foreground mb-2">Иконка</p>
          <div className="flex flex-wrap gap-2">
            {EMOJIS.map((e) => (
              <button
                key={e}
                onClick={() => setEmoji(e)}
                className="w-10 h-10 rounded-xl flex items-center justify-center text-xl transition-all"
                style={emoji === e
                  ? { background: `${hca(color, 0.19)}`, border: `2px solid ${color}` }
                  : { background: "hsl(var(--muted))", border: "2px solid transparent" }
                }
              >
                {e}
              </button>
            ))}
          </div>
        </div>

        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Название напоминания"
          className="w-full h-12 px-4 rounded-2xl bg-muted text-foreground text-sm focus:outline-none"
          style={{ border: "1px solid hsl(var(--border))" }}
        />

        <div>
          <p className="text-xs text-muted-foreground mb-1">Время</p>
          <input
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="w-full h-12 px-4 rounded-2xl bg-muted text-foreground text-base font-bold focus:outline-none"
            style={{ border: `1px solid ${hca(color, 0.25)}` }}
          />
        </div>

        <div>
          <p className="text-xs text-muted-foreground mb-2">Цвет</p>
          <div className="flex gap-2">
            {COLORS.map((c) => (
              <button
                key={c}
                onClick={() => setColor(c)}
                className="w-9 h-9 rounded-xl transition-all"
                style={{
                  background:   c,
                  outline:      color === c ? "3px solid white" : "none",
                  outlineOffset: 2,
                }}
              />
            ))}
          </div>
        </div>

        <div>
          <p className="text-xs text-muted-foreground mb-2">Повторять</p>
          <div className="flex gap-1.5">
            {RU_DAYS_SHORT.map((d, i) => {
              const active = repeat.includes(i as RepeatDay);
              return (
                <motion.button
                  key={i}
                  onClick={() => toggleDay(i as RepeatDay)}
                  whileTap={{ scale: 0.85 }}
                  className="flex-1 py-2 rounded-xl text-xs font-bold transition-all"
                  style={active
                    ? { background: color, color: "white" }
                    : { background: "hsl(var(--muted))", color: "hsl(var(--muted-foreground))" }
                  }
                >
                  {d}
                </motion.button>
              );
            })}
          </div>
          <button
            onClick={() => setRepeat(repeat.length === 7 ? [] : [0,1,2,3,4,5,6])}
            className="mt-2 text-xs font-semibold"
            style={{ color }}
          >
            {repeat.length === 7 ? "Снять все" : "Выбрать все"}
          </button>
        </div>

        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Заметка (необязательно)"
          className="w-full h-11 px-4 rounded-2xl bg-muted text-foreground text-sm focus:outline-none"
          style={{ border: "1px solid hsl(var(--border))" }}
        />

        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={handleSave}
          disabled={!title.trim()}
          className="w-full h-14 rounded-2xl font-bold text-base text-white flex items-center justify-center gap-2"
          style={{
            background: title.trim()
              ? `linear-gradient(135deg, ${color}, ${hca(color, 0.67)})`
              : "hsl(var(--muted))",
            boxShadow: title.trim() ? `0 8px 24px ${hca(color, 0.25)}` : "none",
          }}
        >
          <Check className="w-5 h-5" />
          {initReminder ? "Сохранить" : "Добавить"}
        </motion.button>
      </div>
    </motion.div>
  );
}

export default function Reminders() {
  const navigate = useNavigate();
  const [reminders, setReminders] = useState<Reminder[]>(() => readReminders());
  const [showAdd,   setShowAdd]   = useState(false);
  const [editItem,  setEditItem]  = useState<Reminder | null>(null);
  const [filter,    setFilter]    = useState<"all" | "on" | "off">("all");

  const enabledCount  = reminders.filter((r) => r.enabled).length;

  const filtered = reminders.filter((r) =>
    filter === "all" ? true : filter === "on" ? r.enabled : !r.enabled
  );

  const handleToggle = (id: string) =>
    setReminders((prev) => prev.map((r) => r.id === id ? { ...r, enabled: !r.enabled } : r));

  const handleDelete = (id: string) =>
    setReminders((prev) => prev.filter((r) => r.id !== id));

  const handleSave = (r: Reminder) => {
    setReminders((prev) => {
      const exists = prev.find((x) => x.id === r.id);
      return exists ? prev.map((x) => x.id === r.id ? r : x) : [...prev, r];
    });
    toast({ title: `🔔 ${r.title}`, description: `${r.time} · сохранено` });
  };

  const handleEdit = (r: Reminder) => {
    setEditItem(r);
    setShowAdd(true);
  };

  const handleClose = () => {
    setShowAdd(false);
    setEditItem(null);
  };

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(reminders));
    } catch {}
  }, [reminders]);

  return (
    <AppLayout>
      <AnimatePresence>
        {showAdd && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-30 bg-black/60"
            onClick={handleClose}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showAdd && (
          <AddSheet initial={editItem} onSave={handleSave} onClose={handleClose} />
        )}
      </AnimatePresence>

      <div className="flex flex-col gap-4 pt-safe pb-10">

        <motion.header
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          className="px-4 md:px-6 pt-4 flex items-center justify-between"
        >
          <div>
            <h1 className="text-2xl font-bold text-foreground">Напоминания</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {enabledCount} из {reminders.length} активно
            </p>
          </div>
          <motion.button
            whileTap={{ scale: 0.88 }}
            onClick={() => { setEditItem(null); setShowAdd(true); }}
            className="w-10 h-10 rounded-2xl flex items-center justify-center"
            style={{ background: "hsl(var(--sleep) / 0.20)" }}
          >
            <Plus className="w-5 h-5 text-purple-400" />
          </motion.button>
        </motion.header>

        <NextAlertCard reminders={reminders} />

        <SmartSuggestions onAdd={(r) => handleSave(r)} />

        <div className="px-4 md:px-6">
          <div
            className="flex p-1 rounded-2xl"
            style={{ background: "hsl(var(--background))", border: "1px solid hsl(var(--border))" }}
          >
            {(["all","on","off"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className="flex-1 py-2 rounded-xl text-sm font-semibold transition-all"
                style={filter === f
                  ? { background: "linear-gradient(135deg, hsl(var(--sleep)), hsl(var(--milestone) / 0.28))", color: "white" }
                  : { color: "hsl(var(--muted-foreground))" }
                }
              >
                {{ all:"Все", on:"Активные", off:"Выключенные" }[f]}
              </button>
            ))}
          </div>
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-[10px] text-muted-foreground/50 text-center px-4"
        >
          ← Свайп влево = удалить · Свайп вправо = вкл/выкл →
        </motion.p>

        <div className="px-4 md:px-6 flex flex-col gap-2">
          <AnimatePresence>
            {filtered.map((r) => (
              <ReminderBubble
                key={r.id}
                reminder={r}
                onToggle={handleToggle}
                onDelete={handleDelete}
                onEdit={handleEdit}
              />
            ))}
          </AnimatePresence>

          {filtered.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-16"
            >
              <span className="text-5xl">🔕</span>
              <p className="text-muted-foreground mt-3 text-sm">Нет напоминаний</p>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowAdd(true)}
                className="mt-4 px-6 py-3 rounded-2xl text-sm font-semibold text-white"
                style={{ background: "hsl(var(--sleep))" }}
              >
                Создать напоминание
              </motion.button>
            </motion.div>
          )}
        </div>

      </div>
    </AppLayout>
  );
}
