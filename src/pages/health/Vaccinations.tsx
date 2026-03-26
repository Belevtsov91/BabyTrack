import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronRight, Check, Clock, AlertTriangle,
  Plus,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { AppLayout } from "@/components/layout/AppLayout";
import CountdownBanner from "@/components/ui/the-future-arrives-soon-cta";
import { toast } from "@/hooks/use-toast";
import { eventsDB, vaccinationsDB } from "@/lib/crud";

const hca = (c: string, a: number) => c.replace(/\)$/, ` / ${a})`);

interface Vaccine {
  id: string;
  name: string;
  shortName: string;
  description: string;
  ageMonths: number;
  status: "done" | "upcoming" | "overdue";
  scheduledDate: string;
  doneDate?: string;
  reaction?: string;
  color: string;
  doses: number;
  dosesDone: number;
}

type StoredVaccineStatus = "pending" | "completed" | "overdue";

const VACCINES: Vaccine[] = [
  { id: "hbv1", name: "Гепатит B (1 доза)", shortName: "HBV-1", description: "Первая доза вакцины против гепатита B", ageMonths: 0, status: "done", scheduledDate: "2024-09-15", doneDate: "2024-09-16", color: "hsl(var(--feeding))", doses: 3, dosesDone: 1 },
  { id: "bcg", name: "БЦЖ", shortName: "BCG", description: "Вакцина против туберкулёза", ageMonths: 0, status: "done", scheduledDate: "2024-09-15", doneDate: "2024-09-17", color: "hsl(var(--feeding))", doses: 1, dosesDone: 1 },
  { id: "hbv2", name: "Гепатит B (2 доза)", shortName: "HBV-2", description: "Вторая доза вакцины против гепатита B", ageMonths: 1, status: "done", scheduledDate: "2024-10-15", doneDate: "2024-10-15", color: "hsl(var(--feeding))", doses: 3, dosesDone: 2 },
  { id: "dtp1", name: "АКДС (1 доза)", shortName: "DTP-1", description: "Коклюш, дифтерия, столбняк + полиомиелит + гемофильная инфекция", ageMonths: 2, status: "done", scheduledDate: "2024-11-15", doneDate: "2024-11-15", reaction: "Лёгкое покраснение в месте укола, прошло за 2 дня", color: "hsl(var(--activity))", doses: 3, dosesDone: 1 },
  { id: "pcv1", name: "Пневмококк (1 доза)", shortName: "PCV-1", description: "Пневмококковая инфекция", ageMonths: 2, status: "done", scheduledDate: "2024-11-15", doneDate: "2024-11-15", color: "hsl(var(--activity))", doses: 3, dosesDone: 1 },
  { id: "dtp2", name: "АКДС (2 доза)", shortName: "DTP-2", description: "Коклюш, дифтерия, столбняк + полиомиелит + гемофильная инфекция", ageMonths: 4, status: "done", scheduledDate: "2025-01-15", doneDate: "2025-01-15", color: "hsl(var(--activity))", doses: 3, dosesDone: 2 },
  { id: "pcv2", name: "Пневмококк (2 доза)", shortName: "PCV-2", description: "Пневмококковая инфекция", ageMonths: 4, status: "done", scheduledDate: "2025-01-15", doneDate: "2025-01-15", color: "hsl(var(--activity))", doses: 3, dosesDone: 2 },
  { id: "dtp3", name: "АКДС (3 доза)", shortName: "DTP-3", description: "Коклюш, дифтерия, столбняк + полиомиелит + гемофильная инфекция", ageMonths: 6, status: "done", scheduledDate: "2025-03-15", doneDate: "2025-03-15", color: "hsl(var(--activity))", doses: 3, dosesDone: 3 },
  { id: "hbv3", name: "Гепатит B (3 доза)", shortName: "HBV-3", description: "Третья (завершающая) доза вакцины против гепатита B", ageMonths: 6, status: "done", scheduledDate: "2025-03-15", doneDate: "2025-03-15", color: "hsl(var(--feeding))", doses: 3, dosesDone: 3 },
  { id: "flu", name: "Грипп", shortName: "FLU", description: "Ежегодная вакцинация против гриппа", ageMonths: 6, status: "upcoming", scheduledDate: "2025-03-15", color: "hsl(var(--diaper))", doses: 1, dosesDone: 0 },
  { id: "mmr", name: "КПК", shortName: "MMR", description: "Корь, паротит, краснуха", ageMonths: 12, status: "upcoming", scheduledDate: "2025-09-15", color: "hsl(var(--sleep))", doses: 2, dosesDone: 0 },
  { id: "var", name: "Ветряная оспа", shortName: "VAR", description: "Вакцина против ветрянки", ageMonths: 12, status: "upcoming", scheduledDate: "2025-09-15", color: "hsl(var(--sleep))", doses: 1, dosesDone: 0 },
  { id: "pcv3", name: "Пневмококк (ревакцинация)", shortName: "PCV-R", description: "Ревакцинация от пневмококковой инфекции", ageMonths: 15, status: "upcoming", scheduledDate: "2025-12-15", color: "hsl(var(--mood))", doses: 1, dosesDone: 0 },
  { id: "dtp4", name: "АКДС (ревакцинация)", shortName: "DTP-R", description: "Ревакцинация коклюш/дифтерия/столбняк + полиомиелит", ageMonths: 18, status: "upcoming", scheduledDate: "2026-03-15", color: "hsl(var(--mood))", doses: 1, dosesDone: 0 },
];

function normalizeName(value: string) {
  return value.toLowerCase().replace(/[^a-zа-я0-9]+/gi, "");
}

function getBirthDate() {
  try {
    return localStorage.getItem("birthDate");
  } catch {
    return null;
  }
}

function addMonths(date: string, months: number) {
  const next = new Date(date);
  next.setMonth(next.getMonth() + months);
  return next.toISOString().slice(0, 10);
}

function scheduledDateFor(vaccine: Vaccine) {
  const birthDate = getBirthDate();
  return birthDate ? addMonths(birthDate, vaccine.ageMonths) : vaccine.scheduledDate;
}

function calcCurrentAgeMonths() {
  const birthDate = getBirthDate();
  if (!birthDate) return 0;
  const birth = new Date(birthDate);
  if (Number.isNaN(birth.getTime())) return 0;
  const now = new Date();
  const months = (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth());
  return Math.max(0, months - (now.getDate() < birth.getDate() ? 1 : 0));
}

function storageStatus(status: Vaccine["status"]): StoredVaccineStatus {
  if (status === "done") return "completed";
  if (status === "overdue") return "overdue";
  return "pending";
}

function viewStatus(status: StoredVaccineStatus): Vaccine["status"] {
  if (status === "completed") return "done";
  if (status === "overdue") return "overdue";
  return "upcoming";
}

function vaccineShortName(name: string) {
  return name
    .split(/[\s()]+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 4)
    .toUpperCase() || "VAX";
}

function seedVaccinations() {
  const existing = vaccinationsDB.getAll();
  const existingByName = new Map(existing.map((item) => [normalizeName(item.name), item]));

  VACCINES.forEach((seed) => {
    const key = normalizeName(seed.name);
    if (existingByName.has(key)) return;

    vaccinationsDB.create({
      name: seed.name,
      scheduledDate: scheduledDateFor(seed),
      completedDate: seed.doneDate,
      status: storageStatus(seed.status),
      notes: seed.reaction,
    });
  });

  const eventVaccines = eventsDB
    .getAll()
    .filter((event) => event.data?.eventSubType === "vaccine" || event.data?.vaccineName)
    .map((event) => ({
      name: String(event.data?.vaccineName ?? event.title ?? "Прививка"),
      scheduledDate: event.timestamp.slice(0, 10),
      completedDate: event.timestamp.slice(0, 10),
      status: "completed" as const,
      notes: event.description,
    }));

  eventVaccines.forEach((entry) => {
    const key = normalizeName(entry.name);
    const existingRecord = vaccinationsDB.getAll().find((item) => normalizeName(item.name) === key);
    if (existingRecord) return;

    vaccinationsDB.create(entry);
  });
}

function loadVaccines(): Vaccine[] {
  seedVaccinations();
  const records = vaccinationsDB.getAll();
  const byName = new Map(records.map((item) => [normalizeName(item.name), item]));

  const view: Vaccine[] = VACCINES.map((seed): Vaccine => {
    const record = byName.get(normalizeName(seed.name));
    if (!record) {
      const scheduledDate = scheduledDateFor(seed);
      const status: Vaccine["status"] = seed.status === "done"
        ? "done"
        : new Date(scheduledDate) < new Date() ? "overdue" : seed.status;
      return {
        ...seed,
        scheduledDate,
        status,
      };
    }

    const scheduledDate = record.scheduledDate ?? scheduledDateFor(seed);
    const baseStatus = viewStatus(record.status);
    const status: Vaccine["status"] = baseStatus === "upcoming" && new Date(scheduledDate) < new Date()
      ? "overdue"
      : baseStatus;
    return {
      ...seed,
      status,
      scheduledDate,
      doneDate: record.completedDate ?? seed.doneDate,
      reaction: record.notes ?? seed.reaction,
      dosesDone: status === "done" ? seed.doses : seed.dosesDone,
    };
  });

  const extra = records.filter((record) => !VACCINES.some((seed) => normalizeName(seed.name) === normalizeName(record.name)));
  extra.forEach((record) => {
    view.push({
      id: record.id,
      name: record.name,
      shortName: vaccineShortName(record.name),
      description: record.notes ? "Запись из журнала" : "Сохранённая прививка",
      ageMonths: 0,
      status: viewStatus(record.status),
      scheduledDate: record.scheduledDate,
      doneDate: record.completedDate,
      reaction: record.notes,
      color: "hsl(var(--feeding))",
      doses: 1,
      dosesDone: record.status === "completed" ? 1 : 0,
    });
  });

  return view;
}

function ageLabel(m: number): string {
  if (m === 0) return "При рождении";
  if (m < 12) return `${m} ${m < 5 ? "месяца" : "месяцев"}`;
  const y = Math.floor(m / 12);
  const r = m % 12;
  const yl = y === 1 ? "год" : y < 5 ? "года" : "лет";
  return r > 0 ? `${y} ${yl} ${r} мес` : `${y} ${yl}`;
}

function groupByAge(vaxes: Vaccine[]) {
  return vaxes.reduce((acc, vaccine) => {
    const key = vaccine.ageMonths;
    acc[key] = [...(acc[key] ?? []), vaccine];
    return acc;
  }, {} as Record<number, Vaccine[]>);
}

function ImmunityShield({ vaccines }: { vaccines: Vaccine[] }) {
  const done = vaccines.filter((v) => v.status === "done").length;
  const total = vaccines.length || 1;
  const pct = Math.round((done / total) * 100);

  const SIZE = 140;
  const R = 54;
  const C = 2 * Math.PI * R;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.2 }}
      className="mx-4 rounded-3xl p-5 flex items-center gap-5"
      style={{
        background: "linear-gradient(135deg, hsl(var(--feeding) / 0.08), hsl(var(--card)))",
        border: "1px solid hsl(var(--feeding) / 0.16)",
      }}
    >
      <div className="relative shrink-0" style={{ width: SIZE, height: SIZE }}>
        <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} style={{ transform: "rotate(-90deg)" }}>
          <circle cx={SIZE / 2} cy={SIZE / 2} r={R} fill="none" stroke="hsl(var(--border))" strokeWidth="10" />
          <motion.circle
            cx={SIZE / 2} cy={SIZE / 2} r={R}
            fill="none"
            stroke="hsl(var(--feeding))"
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={C}
            initial={{ strokeDashoffset: C }}
            animate={{ strokeDashoffset: C - (pct / 100) * C }}
            transition={{ duration: 1.4, delay: 0.4, ease: "easeOut" }}
            style={{ filter: "drop-shadow(0 0 8px hsl(var(--feeding)))" }}
          />
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.8 }}
            className="text-2xl font-bold text-white"
          >
            {pct}%
          </motion.span>
          <span className="text-[9px] text-muted-foreground mt-0.5">защита</span>
        </div>
      </div>

      <div className="flex flex-col gap-3 flex-1">
        <div>
          <p className="text-xl font-bold text-white">{done}<span className="text-muted-foreground text-sm font-normal">/{total}</span></p>
          <p className="text-xs text-muted-foreground">прививок выполнено</p>
        </div>

        {[
          { label: "Выполнено", count: done, color: "hsl(var(--feeding))" },
          { label: "Предстоит", count: vaccines.filter((v) => v.status === "upcoming").length, color: "hsl(var(--diaper))" },
          { label: "Просрочено", count: vaccines.filter((v) => v.status === "overdue").length, color: "hsl(var(--health))" },
        ].map((s) => (
          <div key={s.label} className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full shrink-0" style={{ background: s.color }} />
            <span className="text-xs text-muted-foreground flex-1">{s.label}</span>
            <span className="text-xs font-bold" style={{ color: s.color }}>{s.count}</span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

function NextVaccineAlert({ vaccines }: { vaccines: Vaccine[] }) {
  const upcoming = vaccines
    .filter((v) => v.status === "upcoming")
    .sort((a, b) => a.ageMonths - b.ageMonths)[0];

  if (!upcoming) return null;

  const targetDate = new Date(`${upcoming.scheduledDate}T09:00:00`);
  const formattedDate = targetDate.toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-4 md:mx-6"
    >
      <CountdownBanner
        targetDate={targetDate}
        badge="Следующая прививка"
        eyebrow={`Возраст · ${ageLabel(upcoming.ageMonths)}`}
        title={`До ${upcoming.shortName}`}
        description={`${upcoming.name} запланирована на ${formattedDate}. Отсчёт помогает видеть, сколько осталось до ближайшего окна вакцинации.`}
        accent={upcoming.color}
        secondaryAccent="hsl(var(--feeding))"
        icon={<Clock className="h-3.5 w-3.5" style={{ color: upcoming.color }} />}
        footer={(
          <div className="flex flex-wrap gap-2">
            <div className="rounded-full border border-white/10 bg-white/6 px-3 py-1.5 text-xs font-medium text-foreground/85">
              {formattedDate}
            </div>
            <div
              className="rounded-full border px-3 py-1.5 text-xs font-semibold"
              style={{ borderColor: hca(upcoming.color, 0.22), color: upcoming.color, background: hca(upcoming.color, 0.12) }}
            >
              {upcoming.shortName}
            </div>
          </div>
        )}
        visual={(
          <motion.div
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 3.4, repeat: Infinity, ease: "easeInOut" }}
            className="relative flex w-full max-w-[270px] flex-col gap-3 rounded-[28px] border border-white/10 bg-black/15 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]"
          >
            <div
              className="absolute -right-6 top-2 h-20 w-20 rounded-full blur-3xl"
              style={{ background: upcoming.color, opacity: 0.16 }}
            />
            <div className="flex items-center gap-3">
              <div
                className="flex h-12 w-12 items-center justify-center rounded-2xl text-2xl"
                style={{ background: hca(upcoming.color, 0.14) }}
              >
                💉
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground">{upcoming.shortName}</p>
                <p className="text-xs text-muted-foreground">{ageLabel(upcoming.ageMonths)}</p>
              </div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/6 px-3 py-3">
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-muted-foreground">Дата</p>
              <p className="mt-1 text-sm font-semibold text-foreground">{formattedDate}</p>
            </div>
          </motion.div>
        )}
      />
    </motion.div>
  );
}

function VaccineCard({
  vaccine,
  onMarkDone,
  onAddReaction,
}: {
  vaccine: Vaccine;
  onMarkDone: (id: string) => void;
  onAddReaction: (id: string, text: string) => void;
}) {
  const [showNeedle, setShowNeedle] = useState(false);
  const [showReaction, setShowReaction] = useState(false);
  const [reaction, setReaction] = useState(vaccine.reaction ?? "");

  const isDone = vaccine.status === "done";
  const isOverdue = vaccine.status === "overdue";

  const statusColor =
    isDone ? "hsl(var(--feeding))" :
    isOverdue ? "hsl(var(--health))" :
    vaccine.color;

  const handleMark = () => {
    setShowNeedle(true);
    setTimeout(() => setShowNeedle(false), 800);
    onMarkDone(vaccine.id);
    toast({ title: `✅ ${vaccine.shortName} отмечена`, description: "Прививка выполнена" });
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="relative rounded-2xl p-4 flex items-start gap-3"
      style={{
        background: isDone ? `${hca(statusColor, 0.06)}` : "hsl(var(--muted))",
        border: `1.5px solid ${isDone ? hca(statusColor, 0.19) : "hsl(var(--border))"}`,
      }}
    >
      <AnimatePresence>
        {showNeedle && (
          <motion.div
            className="absolute z-10 text-3xl pointer-events-none"
            style={{ right: 16, top: 8 }}
            initial={{ opacity: 1, y: 0, rotate: -45 }}
            animate={{ opacity: 0, y: -40, rotate: -80 }}
            transition={{ duration: 0.7 }}
          >
            💉
          </motion.div>
        )}
      </AnimatePresence>

      <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5" style={{ background: `${hca(statusColor, 0.12)}` }}>
        {isDone
          ? <Check className="w-5 h-5" style={{ color: statusColor }} />
          : isOverdue
          ? <AlertTriangle className="w-4 h-4" style={{ color: statusColor }} />
          : <Clock className="w-4 h-4" style={{ color: statusColor }} />
        }
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start gap-2">
          <div className="flex-1 min-w-0">
            <p className={cn("text-sm font-bold leading-tight", isDone ? "text-foreground" : "text-muted-foreground")}>
              {vaccine.name}
            </p>
            <p className="text-[10px] text-muted-foreground mt-0.5 leading-snug">
              {vaccine.description}
            </p>
          </div>

          <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold shrink-0" style={{ background: `${hca(statusColor, 0.12)}`, color: statusColor }}>
            {vaccine.shortName}
          </span>
        </div>

        {isDone && vaccine.doneDate && (
          <p className="text-[10px] mt-1.5" style={{ color: statusColor }}>
            ✓ {new Date(vaccine.doneDate).toLocaleDateString("ru-RU", {
              day: "numeric", month: "long", year: "numeric",
            })}
          </p>
        )}

        {isDone && vaccine.reaction && (
          <div className="mt-2 px-3 py-2 rounded-xl" style={{ background: "hsl(var(--diaper) / 0.12)", border: "1px solid hsl(var(--diaper) / 0.20)" }}>
            <p className="text-[10px] text-yellow-400/80">
              ⚠️ Реакция: {vaccine.reaction}
            </p>
          </div>
        )}

        <div className="flex gap-2 mt-2">
          {!isDone && (
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={handleMark}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold"
              style={{ background: `${hca(vaccine.color, 0.12)}`, color: vaccine.color }}
            >
              <Check className="w-3.5 h-3.5" />
              Отметить
            </motion.button>
          )}
          {isDone && !vaccine.reaction && (
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => setShowReaction((v) => !v)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold"
              style={{ background: "hsl(var(--diaper) / 0.12)", color: "hsl(var(--diaper))" }}
            >
              ⚠️ Добавить реакцию
            </motion.button>
          )}
        </div>

        <AnimatePresence>
          {showReaction && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden mt-2"
            >
              <div className="flex gap-2">
                <input
                  value={reaction}
                  onChange={(e) => setReaction(e.target.value)}
                  placeholder="Опишите реакцию..."
                  className="flex-1 h-9 px-3 rounded-xl bg-muted text-foreground text-xs focus:outline-none"
                  style={{ border: "1px solid hsl(var(--diaper) / 0.22)" }}
                />
                <button
                  onClick={() => {
                    onAddReaction(vaccine.id, reaction);
                    setShowReaction(false);
                    toast({ title: "Реакция сохранена" });
                  }}
                  className="w-9 h-9 rounded-xl flex items-center justify-center"
                  style={{ background: "hsl(var(--diaper) / 0.35)" }}
                >
                  <Check className="w-4 h-4 text-yellow-300" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

function AgeGroup({
  ageMonths, vaccines, currentAge,
  onMarkDone, onAddReaction,
}: {
  ageMonths: number;
  vaccines: Vaccine[];
  currentAge: number;
  onMarkDone: (id: string) => void;
  onAddReaction: (id: string, text: string) => void;
}) {
  const [open, setOpen] = useState(ageMonths <= currentAge + 1);
  const allDone = vaccines.every((v) => v.status === "done");
  const hasDue = vaccines.some((v) => v.status !== "done") && ageMonths <= currentAge;
  const isCurrent = Math.abs(ageMonths - currentAge) <= 1;

  const nodeColor =
    allDone ? "hsl(var(--feeding))" :
    hasDue ? "hsl(var(--health))" :
    isCurrent ? "hsl(var(--sleep))" :
    "hsl(var(--border))";

  return (
    <div className="flex gap-3">
      <div className="flex flex-col items-center w-6 shrink-0">
        <motion.div
          className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 z-10"
          style={{ background: nodeColor, boxShadow: isCurrent ? `0 0 12px ${hca(nodeColor, 0.38)}` : "none" }}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring" }}
        >
          {allDone
            ? <Check className="w-3.5 h-3.5 text-white" />
            : <span className="text-[9px] font-bold text-white">{ageMonths}</span>
          }
        </motion.div>
        <div className="flex-1 w-0.5 mt-1" style={{ background: allDone ? "hsl(var(--feeding) / 0.35)" : "hsl(var(--border))" }} />
      </div>

      <div className="flex-1 pb-4 min-w-0">
        <motion.button
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-2 w-full mb-2"
          whileTap={{ scale: 0.97 }}
        >
          <p className="font-bold text-sm text-foreground">{ageLabel(ageMonths)}</p>
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: `${hca(nodeColor, 0.12)}`, color: nodeColor }}>
            {vaccines.length} {vaccines.length === 1 ? "прививка" : "прививки"}
          </span>
          <motion.div animate={{ rotate: open ? 90 : 0 }} className="ml-auto">
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </motion.div>
        </motion.button>

        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden flex flex-col gap-2"
            >
              {vaccines.map((v) => (
                <VaccineCard
                  key={v.id}
                  vaccine={v}
                  onMarkDone={onMarkDone}
                  onAddReaction={onAddReaction}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default function Vaccinations() {
  const navigate = useNavigate();
  const [vaccines, setVaccines] = useState<Vaccine[]>(() => loadVaccines());
  const [viewMode, setViewMode] = useState<"timeline" | "list">("timeline");
  const currentAge = calcCurrentAgeMonths();

  const refresh = () => setVaccines(loadVaccines());

  const handleMarkDone = (id: string) => {
    const target = vaccines.find((v) => v.id === id);
    if (!target) return;

    const record = vaccinationsDB.getAll().find((item) => normalizeName(item.name) === normalizeName(target.name));
    const payload = {
      name: target.name,
      scheduledDate: target.scheduledDate,
      completedDate: new Date().toISOString().slice(0, 10),
      status: "completed" as StoredVaccineStatus,
      notes: target.reaction,
    };

    if (record) vaccinationsDB.update(record.id, payload);
    else vaccinationsDB.create(payload);

    refresh();
  };

  const handleAddReaction = (id: string, text: string) => {
    const target = vaccines.find((v) => v.id === id);
    if (!target) return;

    const record = vaccinationsDB.getAll().find((item) => normalizeName(item.name) === normalizeName(target.name));
    const payload = {
      name: target.name,
      scheduledDate: target.scheduledDate,
      completedDate: target.doneDate ?? new Date().toISOString().slice(0, 10),
      status: "completed" as StoredVaccineStatus,
      notes: text.trim() || undefined,
    };

    if (record) vaccinationsDB.update(record.id, payload);
    else vaccinationsDB.create(payload);

    refresh();
  };

  const grouped = groupByAge(vaccines);
  const ageKeys = Object.keys(grouped).map(Number).sort((a, b) => a - b);

  return (
    <AppLayout>
      <div className="flex flex-col gap-4 pt-safe pb-10">
        <motion.header
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          className="px-4 md:px-6 pt-4 flex items-center justify-between"
        >
          <div>
            <h1 className="text-2xl font-bold text-foreground">Прививки</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Национальный календарь РФ
            </p>
          </div>
          <motion.button
            whileTap={{ scale: 0.88 }}
            onClick={() => navigate("/event/vaccine")}
            className="w-10 h-10 rounded-2xl flex items-center justify-center"
            style={{ background: "hsl(var(--feeding) / 0.15)" }}
          >
            <Plus className="w-5 h-5 text-green-400" />
          </motion.button>
        </motion.header>

        <ImmunityShield vaccines={vaccines} />
        <NextVaccineAlert vaccines={vaccines} />

        <div className="px-4 md:px-6">
          <div
            className="flex p-1 rounded-2xl"
            style={{ background: "hsl(var(--background))", border: "1px solid hsl(var(--border))" }}
          >
            {(["timeline", "list"] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all"
                style={viewMode === mode
                  ? { background: "linear-gradient(135deg, hsl(var(--sleep)), hsl(var(--milestone) / 0.28))", color: "white" }
                  : { color: "hsl(var(--muted-foreground))" }
                }
              >
                {mode === "timeline" ? "🗓 Таймлайн" : "📋 Список"}
              </button>
            ))}
          </div>
        </div>

        <AnimatePresence mode="wait">
          {viewMode === "timeline" ? (
            <motion.div
              key="timeline"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="px-4 md:px-6 flex flex-col"
            >
              {ageKeys.map((age) => (
                <AgeGroup
                  key={age}
                  ageMonths={age}
                  vaccines={grouped[age]}
                  currentAge={currentAge}
                  onMarkDone={handleMarkDone}
                  onAddReaction={handleAddReaction}
                />
              ))}
            </motion.div>
          ) : (
            <motion.div
              key="list"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="px-4 md:px-6 flex flex-col gap-2 md:grid md:grid-cols-2"
            >
              {vaccines.map((v) => (
                <VaccineCard
                  key={v.id}
                  vaccine={v}
                  onMarkDone={handleMarkDone}
                  onAddReaction={handleAddReaction}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AppLayout>
  );
}
