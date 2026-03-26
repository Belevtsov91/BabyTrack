import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Check, Clock, AlertTriangle, X,
} from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { toast } from "@/hooks/use-toast";
import CountdownBanner, { type CountdownState } from "@/components/ui/the-future-arrives-soon-cta";

const hca = (c: string, a: number) => c.replace(/\)$/, ` / ${a})`);
const MED_STORAGE_KEY = "babytrack_medications";

interface Medication {
  id: string;
  name: string;
  dose: string;
  unit: string;
  form: "pill" | "syrup" | "drops" | "spray";
  color: string;
  times: number[];
  takenToday: number[];
  daysTotal: number;
  daysLeft: number;
  stockDays: number;
  note?: string;
}

interface MedicationState {
  day: string;
  meds: Medication[];
}

interface DosePoint {
  id: string;
  hour: number;
  color: string;
  taken: boolean;
  name: string;
  timestamp: Date;
  isTomorrow: boolean;
}

const INITIAL_MEDS: Medication[] = [
  {
    id: "m1",
    name: "Нурофен",
    dose: "2.5",
    unit: "мл",
    form: "syrup",
    color: "hsl(var(--health))",
    times: [8, 14, 20],
    takenToday: [8],
    daysTotal: 5,
    daysLeft: 3,
    stockDays: 4,
    note: "После еды, разбавить водой",
  },
  {
    id: "m2",
    name: "D3 Вигантол",
    dose: "1",
    unit: "кап",
    form: "drops",
    color: "hsl(var(--diaper))",
    times: [9],
    takenToday: [9],
    daysTotal: 30,
    daysLeft: 22,
    stockDays: 20,
    note: "Ежедневно, в ложке молока",
  },
  {
    id: "m3",
    name: "Смекта",
    dose: "1",
    unit: "пак",
    form: "pill",
    color: "hsl(var(--feeding))",
    times: [8, 12, 18],
    takenToday: [],
    daysTotal: 3,
    daysLeft: 2,
    stockDays: 2,
    note: "До еды",
  },
];

const FORM_EMOJI: Record<Medication["form"], string> = {
  pill: "💊",
  syrup: "🍯",
  drops: "💧",
  spray: "🌬️",
};

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function hourLabel(hour: number): string {
  return `${String(hour).padStart(2, "0")}:00`;
}

function atHour(baseDate: Date, hour: number, dayOffset = 0) {
  const value = new Date(baseDate);
  value.setHours(0, 0, 0, 0);
  value.setDate(value.getDate() + dayOffset);
  value.setHours(hour, 0, 0, 0);
  return value;
}

function buildDosePoints(meds: Medication[], baseDate = new Date()) {
  const today: DosePoint[] = [];

  meds.forEach((med) => {
    med.times.forEach((hour) => {
      today.push({
        id: `${med.id}-${hour}`,
        hour,
        color: med.color,
        taken: med.takenToday.includes(hour),
        name: med.name,
        timestamp: atHour(baseDate, hour),
        isTomorrow: false,
      });
    });
  });

  return today.sort((a, b) => a.hour - b.hour);
}

function resolveNextDose(meds: Medication[], baseDate = new Date()) {
  const nowMs = baseDate.getTime();
  const today = buildDosePoints(meds, baseDate);
  const upcomingToday = today.find((dose) => !dose.taken && dose.timestamp.getTime() >= nowMs);

  if (upcomingToday) {
    return { today, nextDose: upcomingToday };
  }

  const tomorrow = meds
    .flatMap((med) => med.times.map((hour) => ({
      id: `${med.id}-${hour}-tomorrow`,
      hour,
      color: med.color,
      taken: false,
      name: med.name,
      timestamp: atHour(baseDate, hour, 1),
      isTomorrow: true,
    } satisfies DosePoint)))
    .sort((a, b) => a.hour - b.hour);

  return {
    today,
    nextDose: tomorrow[0] ?? null,
  };
}

function polarPosition(angleDeg: number, radius: number, center: number) {
  const rad = (angleDeg * Math.PI) / 180;
  return {
    x: center + radius * Math.cos(rad),
    y: center + radius * Math.sin(rad),
  };
}

function describeArcPath(center: number, radius: number, startAngle: number, endAngle: number) {
  let resolvedEnd = endAngle;
  if (resolvedEnd <= startAngle) resolvedEnd += 360;

  const start = polarPosition(startAngle, radius, center);
  const end = polarPosition(resolvedEnd, radius, center);
  const largeArcFlag = resolvedEnd - startAngle > 180 ? 1 : 0;

  return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${end.x} ${end.y}`;
}

function normalizeForDay(meds: Medication[], day: string) {
  const current = todayKey();
  if (day === current) return meds;
  return meds.map((med) => ({ ...med, takenToday: [] }));
}

function loadMedicationState(): MedicationState {
  try {
    const raw = localStorage.getItem(MED_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as MedicationState;
      if (parsed?.meds) {
        return { day: todayKey(), meds: normalizeForDay(parsed.meds, parsed.day) };
      }
    }
  } catch {
    return { day: todayKey(), meds: INITIAL_MEDS };
  }
  return { day: todayKey(), meds: INITIAL_MEDS };
}

function saveMedicationState(meds: Medication[]) {
  const state: MedicationState = { day: todayKey(), meds };
  localStorage.setItem(MED_STORAGE_KEY, JSON.stringify(state));
}

function MedicationOrbitVisual({
  schedule,
  countdown,
}: {
  schedule: ReturnType<typeof resolveNextDose>;
  countdown: CountdownState;
}) {
  const SIZE = 248;
  const RADIUS = 86;
  const CENTER = SIZE / 2;
  const nextDose = schedule.nextDose;
  const points = nextDose?.isTomorrow ? [...schedule.today, nextDose] : schedule.today;
  const nowMs = countdown.targetTime && !countdown.isComplete
    ? countdown.targetTime - countdown.totalMs
    : Date.now();
  const now = new Date(nowMs);
  const nowHour = now.getHours() + now.getMinutes() / 60 + now.getSeconds() / 3600;
  const nowAngle = (nowHour / 24) * 360 - 90;
  const nextAngle = nextDose ? (nextDose.hour / 24) * 360 - 90 : nowAngle;
  const nowPoint = polarPosition(nowAngle, RADIUS - 20, CENTER);

  return (
    <div className="relative w-full max-w-[280px]">
      <div
        className="absolute inset-x-8 top-8 h-40 rounded-full blur-3xl"
        style={{ background: nextDose?.color ?? "hsl(var(--health))", opacity: 0.18 }}
      />

      <svg
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        className="relative z-[1] h-auto w-full overflow-visible"
        aria-hidden="true"
      >
        <defs>
          <radialGradient id="med-orbit-core" cx="50%" cy="45%" r="60%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.16)" />
            <stop offset="60%" stopColor="rgba(255,255,255,0.04)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0)" />
          </radialGradient>
        </defs>

        <circle cx={CENTER} cy={CENTER} r={RADIUS + 18} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="1.5" />
        <circle cx={CENTER} cy={CENTER} r={RADIUS} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="2" />
        <circle cx={CENTER} cy={CENTER} r={RADIUS - 30} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="1.5" />

        {nextDose ? (
          <motion.path
            d={describeArcPath(CENTER, RADIUS, nowAngle, nextAngle)}
            fill="none"
            stroke={nextDose.color}
            strokeWidth="4"
            strokeLinecap="round"
            initial={{ pathLength: 0.15, opacity: 0.45 }}
            animate={{ pathLength: 1, opacity: [0.35, 1, 0.45] }}
            transition={{ duration: 2.2, repeat: Infinity, repeatType: "reverse" }}
            style={{ filter: `drop-shadow(0 0 10px ${hca(nextDose.color, 0.45)})` }}
          />
        ) : null}

        {[0, 6, 12, 18].map((hour) => {
          const angle = (hour / 24) * 360 - 90;
          const position = polarPosition(angle, RADIUS + 20, CENTER);
          return (
            <text
              key={hour}
              x={position.x}
              y={position.y}
              textAnchor="middle"
              dominantBaseline="middle"
              fill="hsl(var(--muted-foreground))"
              fontSize="10"
              fontWeight="700"
            >
              {hour}
            </text>
          );
        })}

        <motion.line
          x1={CENTER}
          y1={CENTER}
          x2={nowPoint.x}
          y2={nowPoint.y}
          stroke="hsl(var(--health))"
          strokeWidth="2.5"
          strokeLinecap="round"
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 1.8, repeat: Infinity }}
        />
        <motion.circle
          cx={nowPoint.x}
          cy={nowPoint.y}
          r="4.5"
          fill="hsl(var(--health))"
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />

        {points.map((dose) => {
          const angle = (dose.hour / 24) * 360 - 90;
          const position = polarPosition(angle, RADIUS, CENTER);
          const isNext = nextDose?.id === dose.id;
          const symbol = dose.taken ? "✓" : "💊";

          return (
            <g key={dose.id}>
              {isNext ? (
                <motion.circle
                  cx={position.x}
                  cy={position.y}
                  r="17"
                  fill={hca(dose.color, 0.15)}
                  animate={{ scale: [0.95, 1.28, 0.95], opacity: [0.35, 0.12, 0.35] }}
                  transition={{ duration: 1.9, repeat: Infinity }}
                />
              ) : null}

              <circle
                cx={position.x}
                cy={position.y}
                r={isNext ? 11.5 : 10}
                fill={dose.taken ? hca(dose.color, 0.18) : "hsl(var(--card))"}
                stroke={dose.color}
                strokeWidth={isNext ? 2.4 : 1.8}
              />
              <text
                x={position.x}
                y={position.y + 0.5}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize={isNext ? "9.5" : "9"}
              >
                {symbol}
              </text>
            </g>
          );
        })}

        <circle cx={CENTER} cy={CENTER} r="50" fill="url(#med-orbit-core)" />
      </svg>

      <div className="pointer-events-none absolute inset-0 z-[2] flex flex-col items-center justify-center text-center">
        <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-muted-foreground">
          {nextDose?.isTomorrow ? "Завтра" : "Сейчас"}
        </p>
        <p className="mt-1 text-3xl font-semibold tracking-tight text-foreground">
          {nextDose ? hourLabel(nextDose.hour) : `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`}
        </p>
        <p className="mt-1 max-w-[132px] text-[11px] leading-5 text-muted-foreground">
          {nextDose ? nextDose.name : "На сегодня все приёмы закрыты"}
        </p>
      </div>
    </div>
  );
}

function MedWheel({ meds }: { meds: Medication[] }) {
  const [nowMs, setNowMs] = useState(() => Date.now());

  useEffect(() => {
    const interval = window.setInterval(() => setNowMs(Date.now()), 1000);
    return () => window.clearInterval(interval);
  }, []);

  const schedule = resolveNextDose(meds, new Date(nowMs));
  const nextDose = schedule.nextDose;
  const takenCount = schedule.today.filter((dose) => dose.taken).length;
  const remainingToday = schedule.today.length - takenCount;
  const nextDoseTime = nextDose?.timestamp ?? null;
  const title = nextDose?.isTomorrow ? "До первого приёма завтра" : "До следующего приёма";
  const description = nextDose
    ? nextDose.isTomorrow
      ? `Сегодняшний план уже закрыт. Следующий слот откроется завтра для ${nextDose.name}.`
      : `${nextDose.name} — ближайший слот в ${hourLabel(nextDose.hour)}. Цифровой отсчёт и круг синхронизированы.`
    : "На сегодня все дозы отмечены. Утренний слот завтра появится автоматически.";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.18 }}
    >
      <CountdownBanner
        targetDate={nextDoseTime}
        badge="Расписание на сегодня"
        eyebrow={`${takenCount}/${schedule.today.length} доз принято`}
        title={title}
        description={description}
        accent={nextDose?.color ?? "hsl(var(--feeding))"}
        secondaryAccent="hsl(var(--health))"
        mode="hms"
        completedTitle="Все дозы на сегодня отмечены"
        completedDescription="Секция перестроится сама, как только наступит следующий слот лечения."
        icon={<Clock className="h-3.5 w-3.5" style={{ color: nextDose?.color ?? "hsl(var(--health))" }} />}
        footer={(
          <div className="flex flex-wrap gap-2">
            <div className="rounded-full border border-white/10 bg-white/6 px-3 py-1.5 text-xs font-medium text-foreground/85">
              {nextDose ? `${nextDose.isTomorrow ? "Завтра" : "Сегодня"} · ${hourLabel(nextDose.hour)}` : "Сегодня всё закрыто"}
            </div>
            <div className="rounded-full border border-white/10 bg-white/6 px-3 py-1.5 text-xs font-medium text-muted-foreground">
              Осталось сегодня: {Math.max(remainingToday, 0)}
            </div>
          </div>
        )}
        visual={(countdown) => <MedicationOrbitVisual schedule={schedule} countdown={countdown} />}
      />
    </motion.div>
  );
}

function MedCard({
  med,
  onTake,
  onDelete,
}: {
  med: Medication;
  onTake: (medId: string, hour: number) => void;
  onDelete: (medId: string) => void;
}) {
  const [flyPill, setFlyPill] = useState<number | null>(null);
  const progress = (med.daysTotal - med.daysLeft) / med.daysTotal;
  const allTaken = med.times.every((hour) => med.takenToday.includes(hour));

  const handleTake = (hour: number) => {
    setFlyPill(hour);
    setTimeout(() => setFlyPill(null), 700);
    onTake(med.id, hour);
    toast({ title: `✅ ${med.name} принят`, description: `${hourLabel(hour)} · ${med.dose} ${med.unit}` });
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -100 }}
      className="rounded-3xl p-4 relative overflow-hidden"
      style={{
        background: allTaken ? `${hca(med.color, 0.06)}` : "hsl(var(--card))",
        border: `1.5px solid ${allTaken ? hca(med.color, 0.25) : "hsl(var(--border))"}`,
      }}
    >
      <AnimatePresence>
        {flyPill !== null && (
          <motion.div
            className="absolute z-20 text-2xl pointer-events-none"
            style={{ left: "50%", bottom: 20 }}
            initial={{ opacity: 1, y: 0, x: "-50%", scale: 1 }}
            animate={{ opacity: 0, y: -80, x: "-50%", scale: 0.4 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            {FORM_EMOJI[med.form]}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-start gap-3 mb-3">
        <motion.div
          className="w-12 h-12 rounded-2xl flex items-center justify-center text-xl shrink-0"
          style={{ background: `${hca(med.color, 0.12)}` }}
          animate={allTaken ? { scale: [1, 1.1, 1] } : {}}
          transition={{ duration: 0.5 }}
        >
          {FORM_EMOJI[med.form]}
        </motion.div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-bold text-foreground">{med.name}</p>
            {allTaken && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="w-5 h-5 rounded-full flex items-center justify-center"
                style={{ background: med.color }}
              >
                <Check className="w-3 h-3 text-white" />
              </motion.div>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            {med.dose} {med.unit} · {med.times.length}× в день
          </p>
          {med.note && <p className="text-[10px] text-muted-foreground/60 mt-0.5 italic">{med.note}</p>}
        </div>

        <button
          onClick={() => onDelete(med.id)}
          className="w-7 h-7 rounded-xl bg-muted flex items-center justify-center shrink-0"
        >
          <X className="w-3.5 h-3.5 text-muted-foreground" />
        </button>
      </div>

      <div className="flex items-center gap-2 mb-3">
        <div className="flex-1 h-1.5 rounded-full bg-white/5 overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{ backgroundColor: med.color }}
            initial={{ width: 0 }}
            animate={{ width: `${progress * 100}%` }}
            transition={{ duration: 0.8, delay: 0.3 }}
          />
        </div>
        <span className="text-[10px] text-muted-foreground shrink-0">
          {med.daysTotal - med.daysLeft}/{med.daysTotal} дн
        </span>
      </div>

      <div className="flex gap-2">
        {med.times.map((hour) => {
          const taken = med.takenToday.includes(hour);
          const isPast = hour < new Date().getHours();
          return (
            <motion.button
              key={hour}
              onClick={() => !taken && handleTake(hour)}
              whileTap={!taken ? { scale: 0.88 } : {}}
              disabled={taken}
              className="flex-1 flex flex-col items-center gap-1 py-2.5 rounded-2xl transition-all"
              style={taken
                ? { background: `${hca(med.color, 0.15)}`, border: `1px solid ${hca(med.color, 0.31)}` }
                : { background: "hsl(var(--muted))", border: "1px solid hsl(var(--border))" }
              }
            >
              <motion.div animate={taken ? { scale: [1, 1.3, 1] } : {}}>
                {taken
                  ? <Check className="w-4 h-4" style={{ color: med.color }} />
                  : <Clock className="w-4 h-4 text-muted-foreground/50" />
                }
              </motion.div>
              <span
                className="text-[10px] font-semibold"
                style={{ color: taken ? med.color : isPast ? "hsl(var(--health))" : "hsl(var(--muted-foreground))" }}
              >
                {hourLabel(hour)}
              </span>
            </motion.button>
          );
        })}
      </div>

      {med.stockDays <= 3 && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="mt-3 flex items-center gap-2 px-3 py-2 rounded-2xl"
          style={{ background: "hsl(var(--diaper) / 0.14)", border: "1px solid hsl(var(--diaper) / 0.25)" }}
        >
          <AlertTriangle className="w-3.5 h-3.5 text-yellow-400 shrink-0" />
          <p className="text-[10px] text-yellow-400 font-medium">
            Осталось на {med.stockDays} {med.stockDays === 1 ? "день" : "дня"} · Пополните запас
          </p>
        </motion.div>
      )}
    </motion.div>
  );
}

const MED_COLORS = [
  "hsl(var(--health))", "hsl(var(--diaper))", "hsl(var(--feeding))",
  "hsl(var(--activity))", "hsl(var(--sleep))", "hsl(var(--mood))",
];

function AddMedSheet({
  onAdd,
  onClose,
}: {
  onAdd: (med: Medication) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState("");
  const [dose, setDose] = useState("");
  const [unit, setUnit] = useState("мл");
  const [form, setForm] = useState<Medication["form"]>("syrup");
  const [color, setColor] = useState(MED_COLORS[0]);
  const [days, setDays] = useState(5);
  const [times, setTimes] = useState<number[]>([8]);

  const UNITS = ["мл", "кап", "мг", "таб", "пак"];
  const FORMS: Medication["form"][] = ["syrup", "drops", "pill", "spray"];

  const toggleHour = (hour: number) => {
    setTimes((prev) => (prev.includes(hour) ? prev.filter((value) => value !== hour) : [...prev, hour].sort((a, b) => a - b)));
  };

  const handleAdd = () => {
    if (!name.trim() || !dose || times.length === 0) return;
    onAdd({
      id: `med-${Date.now()}`,
      name: name.trim(),
      dose,
      unit,
      form,
      color,
      times,
      takenToday: [],
      daysTotal: days,
      daysLeft: days,
      stockDays: days * 2,
    });
    onClose();
    toast({ title: `💊 ${name} добавлен` });
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

      <div className="px-5 pb-8 flex flex-col gap-4 max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-foreground">Добавить лекарство</h3>
          <button onClick={onClose}>
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Название лекарства"
          className="w-full h-12 px-4 rounded-2xl bg-muted text-foreground text-sm placeholder:text-muted-foreground focus:outline-none"
          style={{ border: "1px solid hsl(var(--border))" }}
        />

        <div className="flex gap-2">
          <input
            value={dose}
            onChange={(e) => setDose(e.target.value)}
            placeholder="Доза"
            type="number"
            className="flex-1 min-w-0 h-12 px-4 rounded-2xl bg-muted text-foreground text-sm focus:outline-none"
            style={{ border: "1px solid hsl(var(--border))" }}
          />
          <div className="flex gap-1">
            {UNITS.map((value) => (
              <button
                key={value}
                onClick={() => setUnit(value)}
                className="px-3 h-12 rounded-2xl text-xs font-semibold transition-all"
                style={unit === value
                  ? { background: color, color: "white" }
                  : { background: "hsl(var(--muted))", color: "hsl(var(--muted-foreground))" }
                }
              >
                {value}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-2">
          {FORMS.map((value) => (
            <button
              key={value}
              onClick={() => setForm(value)}
              className="flex-1 flex flex-col items-center gap-1 py-3 rounded-2xl text-xs font-semibold transition-all"
              style={form === value
                ? { background: `${hca(color, 0.15)}`, border: `1.5px solid ${color}`, color }
                : { background: "hsl(var(--muted))", border: "1.5px solid transparent", color: "hsl(var(--muted-foreground))" }
              }
            >
              <span className="text-xl">{FORM_EMOJI[value]}</span>
              {{ syrup: "Сироп", drops: "Капли", pill: "Таблетка", spray: "Спрей" }[value]}
            </button>
          ))}
        </div>

        <div>
          <p className="text-xs text-muted-foreground mb-2">Цвет</p>
          <div className="flex gap-2">
            {MED_COLORS.map((value) => (
              <button
                key={value}
                onClick={() => setColor(value)}
                className="w-8 h-8 rounded-xl transition-all"
                style={{
                  background: value,
                  outline: color === value ? `3px solid white` : "none",
                  outlineOffset: 2,
                }}
              />
            ))}
          </div>
        </div>

        <div>
          <p className="text-xs text-muted-foreground mb-2">Время приёма</p>
          <div className="flex flex-wrap gap-2">
            {[6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22].map((hour) => (
              <button
                key={hour}
                onClick={() => toggleHour(hour)}
                className="px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all"
                style={times.includes(hour)
                  ? { background: color, color: "white" }
                  : { background: "hsl(var(--muted))", color: "hsl(var(--muted-foreground))" }
                }
              >
                {hourLabel(hour)}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <p className="text-xs text-muted-foreground">Курс (дней):</p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setDays((value) => Math.max(1, value - 1))}
              className="w-8 h-8 rounded-xl bg-muted flex items-center justify-center text-lg font-bold text-foreground"
            >
              −
            </button>
            <span className="w-8 text-center text-base font-bold text-foreground">{days}</span>
            <button
              onClick={() => setDays((value) => value + 1)}
              className="w-8 h-8 rounded-xl bg-muted flex items-center justify-center text-lg font-bold text-foreground"
            >
              +
            </button>
          </div>
        </div>

        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={handleAdd}
          disabled={!name.trim() || !dose || times.length === 0}
          className="w-full py-4 rounded-2xl font-bold text-sm text-white"
          style={{
            background: name && dose && times.length > 0
              ? `linear-gradient(135deg, ${color}, ${hca(color, 0.67)})`
              : "hsl(var(--muted))",
          }}
        >
          Добавить лекарство
        </motion.button>
      </div>
    </motion.div>
  );
}

export default function Medications() {
  const [meds, setMeds] = useState<Medication[]>(() => loadMedicationState().meds);
  const [showAdd, setShowAdd] = useState(false);

  useEffect(() => {
    saveMedicationState(meds);
  }, [meds]);

  const takenCount = meds.reduce((acc, med) => acc + med.takenToday.length, 0);
  const totalCount = meds.reduce((acc, med) => acc + med.times.length, 0);

  const handleTake = (medId: string, hour: number) => {
    setMeds((prev) => prev.map((med) => (
      med.id === medId ? { ...med, takenToday: med.takenToday.includes(hour) ? med.takenToday : [...med.takenToday, hour] } : med
    )));
  };

  const handleDelete = (medId: string) => {
    setMeds((prev) => prev.filter((med) => med.id !== medId));
    toast({ title: "Удалено" });
  };

  const handleAdd = (med: Medication) => {
    setMeds((prev) => [...prev, med]);
  };

  return (
    <AppLayout>
      <AnimatePresence>
        {showAdd && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-30 bg-black/60"
            onClick={() => setShowAdd(false)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showAdd && <AddMedSheet onAdd={handleAdd} onClose={() => setShowAdd(false)} />}
      </AnimatePresence>

      <div className="flex flex-col gap-4 pt-safe pb-24">
        <motion.header
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          className="px-4 md:px-6 pt-4 flex items-center justify-between"
        >
          <div>
            <h1 className="text-2xl font-bold text-foreground">Лекарства</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {takenCount}/{totalCount} доз принято сегодня
            </p>
          </div>
          <motion.button
            whileTap={{ scale: 0.88 }}
            onClick={() => setShowAdd(true)}
            className="w-10 h-10 rounded-2xl flex items-center justify-center"
            style={{ background: "hsl(var(--health) / 0.18)" }}
          >
            <Plus className="w-5 h-5 text-red-400" />
          </motion.button>
        </motion.header>

        {totalCount > 0 && (
          <div className="px-4 md:px-6">
            <div
              className="rounded-2xl px-4 py-3 flex items-center gap-3"
              style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}
            >
              <div className="flex-1 h-2 rounded-full bg-white/5 overflow-hidden">
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: "linear-gradient(90deg, hsl(var(--feeding)), hsl(var(--activity)))" }}
                  initial={{ width: 0 }}
                  animate={{ width: `${(takenCount / totalCount) * 100}%` }}
                  transition={{ duration: 0.8 }}
                />
              </div>
              <span className="text-xs font-bold text-foreground shrink-0">
                {Math.round((takenCount / totalCount) * 100)}%
              </span>
            </div>
          </div>
        )}

        {meds.length > 0 && (
          <div className="px-4 md:px-6">
            <MedWheel meds={meds} />
          </div>
        )}

        <div className="px-4 md:px-6">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">
            💊 Текущие курсы ({meds.length})
          </p>
          <div className="flex flex-col gap-3">
            <AnimatePresence>
              {meds.map((med) => (
                <MedCard key={med.id} med={med} onTake={handleTake} onDelete={handleDelete} />
              ))}
            </AnimatePresence>
          </div>

          {meds.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-16"
            >
              <span className="text-5xl">💊</span>
              <p className="text-muted-foreground mt-3 text-sm">Нет активных лекарств</p>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowAdd(true)}
                className="mt-4 px-6 py-3 rounded-2xl text-sm font-semibold text-white"
                style={{ background: "hsl(var(--health) / 0.45)" }}
              >
                Добавить лекарство
              </motion.button>
            </motion.div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
