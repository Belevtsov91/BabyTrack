/**
 * ФАЙЛ: src/pages/profile/Milestones.tsx
 */

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Lock, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";
import { milestonesDB } from "@/lib/crud";
import { toast } from "@/hooks/use-toast";
import { AppLayout } from "@/components/layout/AppLayout";

const hca = (c: string, a: number) => c.replace(/\)$/, ` / ${a})`);

// ─── Типы ─────────────────────────────────────────────────────────────────────

interface Milestone {
  id: string;
  category: "motor" | "social" | "speech" | "feeding" | "cognitive";
  title: string;
  desc: string;
  ageMonths: number;
  emoji: string;
  completed: boolean;
  completedAt?: string;
}

// ─── Моковые данные ───────────────────────────────────────────────────────────

const MOCK_MILESTONES: Milestone[] = [
  { id: "m1",  category: "motor",    title: "Держит голову",     desc: "Лёжа на животе поднимает голову",      ageMonths: 2,  emoji: "💪", completed: true,  completedAt: "2024-11-10" },
  { id: "m2",  category: "social",   title: "Первая улыбка",     desc: "Осознанная социальная улыбка",          ageMonths: 2,  emoji: "😊", completed: true,  completedAt: "2024-11-15" },
  { id: "m3",  category: "speech",   title: "Гуление",           desc: "Издаёт протяжные звуки",                ageMonths: 3,  emoji: "🗣️", completed: true,  completedAt: "2024-12-01" },
  { id: "m4",  category: "motor",    title: "Переворот",         desc: "Переворачивается со спины на живот",    ageMonths: 4,  emoji: "🔄", completed: true,  completedAt: "2025-01-05" },
  { id: "m5",  category: "feeding",  title: "Прикорм",           desc: "Первый прикорм — пюре",                 ageMonths: 6,  emoji: "🥣", completed: true,  completedAt: "2025-03-11" },
  { id: "m6",  category: "motor",    title: "Сидит",             desc: "Сидит без поддержки",                   ageMonths: 7,  emoji: "🪑", completed: true,  completedAt: "2025-04-20" },
  { id: "m7",  category: "motor",    title: "Ползает",           desc: "Активное ползание",                     ageMonths: 9,  emoji: "🐛", completed: false },
  { id: "m8",  category: "speech",   title: "Мама/Папа",         desc: "Первые осознанные слова",               ageMonths: 10, emoji: "👄", completed: false },
  { id: "m9",  category: "motor",    title: "Встаёт у опоры",    desc: "Поднимается держась за мебель",         ageMonths: 10, emoji: "🧱", completed: false },
  { id: "m10", category: "social",   title: "Машет рукой",       desc: "Прощается и приветствует жестом",       ageMonths: 10, emoji: "👋", completed: false },
  { id: "m11", category: "motor",    title: "Первые шаги",       desc: "Идёт без поддержки",                    ageMonths: 12, emoji: "👣", completed: false },
  { id: "m12", category: "speech",   title: "10 слов",           desc: "Словарный запас 10+ слов",              ageMonths: 15, emoji: "💬", completed: false },
  { id: "m13", category: "cognitive",title: "Сортировка",        desc: "Сортирует фигуры по форме",             ageMonths: 18, emoji: "🔷", completed: false },
  { id: "m14", category: "feeding",  title: "Ест ложкой",        desc: "Самостоятельно ест ложкой",             ageMonths: 18, emoji: "🥄", completed: false },
  { id: "m15", category: "speech",   title: "Фразы из 2 слов",   desc: "Строит простые фразы",                  ageMonths: 21, emoji: "🗨️", completed: false },
  { id: "m16", category: "motor",    title: "Прыгает",           desc: "Прыгает на двух ногах",                 ageMonths: 24, emoji: "🦘", completed: false },
];

// ─── Конфиг категорий ─────────────────────────────────────────────────────────

const CATS = {
  all:       { label: "Все",          emoji: "⭐", color: "hsl(var(--diaper))"  },
  motor:     { label: "Моторика",     emoji: "💪", color: "hsl(var(--activity))" },
  social:    { label: "Социальное",   emoji: "😊", color: "hsl(var(--mood))" },
  speech:    { label: "Речь",         emoji: "🗣️", color: "hsl(var(--feeding))" },
  feeding:   { label: "Питание",      emoji: "🥣", color: "hsl(var(--diaper))"  },
  cognitive: { label: "Мышление",     emoji: "🧠", color: "hsl(var(--sleep))" },
};

type CatKey = keyof typeof CATS;

type StoredMilestoneRecord = {
  id: string;
  title: string;
  emoji: string;
  category: Exclude<CatKey, "all">;
  completed: boolean;
  date?: string;
};

const MILESTONES_STORAGE_KEY = "babytrack_milestones";

function milestoneKey(title: string, category: Milestone["category"]) {
  return `${category}::${title}`;
}

function calcAgeMonths(birthDate: string): number {
  const birth = new Date(birthDate);
  if (Number.isNaN(birth.getTime())) return 0;

  const now = new Date();
  const years = now.getFullYear() - birth.getFullYear();
  const months = now.getMonth() - birth.getMonth();
  const monthDiff = years * 12 + months;
  return Math.max(0, monthDiff - (now.getDate() < birth.getDate() ? 1 : 0));
}

function readCurrentAgeMonths(): number {
  return calcAgeMonths(localStorage.getItem("birthDate") || "2024-09-15");
}

function readStoredMilestones(): StoredMilestoneRecord[] {
  return milestonesDB.getAll() as StoredMilestoneRecord[];
}

function serializeMilestones(items: Milestone[]): StoredMilestoneRecord[] {
  return items.map((item) => ({
    id: item.id,
    title: item.title,
    emoji: item.emoji,
    category: item.category,
    completed: item.completed,
    date: item.completedAt,
  }));
}

function persistMilestones(items: Milestone[]): void {
  localStorage.setItem(MILESTONES_STORAGE_KEY, JSON.stringify(serializeMilestones(items)));
}

function hydrateMilestones(): Milestone[] {
  const stored = readStoredMilestones();
  const storedByKey = new Map(stored.map((item) => [milestoneKey(item.title, item.category), item]));
  const currentAge = readCurrentAgeMonths();

  if (stored.length === 0) {
    persistMilestones(MOCK_MILESTONES);
    return MOCK_MILESTONES;
  }

  const merged = MOCK_MILESTONES.map((base) => {
    const match = storedByKey.get(milestoneKey(base.title, base.category));
    return {
      ...base,
      id: match?.id ?? base.id,
      completed: match?.completed ?? base.completed,
      completedAt: match?.date ?? base.completedAt,
    };
  });

  const knownKeys = new Set(MOCK_MILESTONES.map((item) => milestoneKey(item.title, item.category)));
  const extras = stored
    .filter((item) => !knownKeys.has(milestoneKey(item.title, item.category)))
    .map((item, index) => ({
      id: item.id,
      category: item.category,
      title: item.title,
      desc: item.title,
      ageMonths: currentAge + index,
      emoji: item.emoji,
      completed: item.completed,
      completedAt: item.date,
    }));

  const hydrated = [...merged, ...extras];
  persistMilestones(hydrated);
  return hydrated;
}

// ─── Конфетти из точки ────────────────────────────────────────────────────────

function BurstConfetti({ color, active }: { color: string; active: boolean }) {
  if (!active) return null;
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-3xl">
        {Array.from({ length: 14 }).map((_, i) => {
          const angle = (i / 14) * 360;
          const rad   = angle * (Math.PI / 180);
          const spread = 50 + (i % 5) * 8 + (i % 3) * 4;
          return (
            <motion.div
              key={i}
              className="absolute w-2 h-2 rounded-full"
              style={{ left: "50%", top: "50%", backgroundColor: i % 2 === 0 ? color : "white" }}
              animate={{
              x:       Math.cos(rad) * spread,
              y:       Math.sin(rad) * spread,
                opacity: [1, 1, 0],
                scale:   [1, 0.4],
              }}
              transition={{ duration: 0.7, ease: "easeOut" }}
          />
        );
      })}
    </div>
  );
}

// ─── Полка трофеев ────────────────────────────────────────────────────────────

function TrophyShelf({ completed }: { completed: Milestone[] }) {
  if (completed.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-3xl p-4 overflow-hidden relative"
      style={{
        background: "linear-gradient(135deg, hsl(var(--diaper) / 0.12), hsl(var(--diaper) / 0.06))",
        border: "1px solid hsl(var(--diaper) / 0.20)",
      }}
    >
      <div className="absolute top-0 right-0 w-24 h-24 opacity-5"
        style={{ background: "radial-gradient(circle, hsl(var(--diaper)), transparent)" }} />

      <div className="flex items-center gap-2 mb-3">
        <Trophy className="w-4 h-4 text-yellow-400" />
        <p className="text-xs font-bold text-yellow-400/80 uppercase tracking-widest">
          Полка трофеев
        </p>
        <span
          className="ml-auto px-2 py-0.5 rounded-full text-[10px] font-bold"
          style={{ background: "hsl(var(--diaper) / 0.18)", color: "hsl(var(--diaper))" }}
        >
          {completed.length}
        </span>
      </div>

      <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
        {completed.map((m, i) => (
          <motion.div
            key={m.id}
            initial={{ opacity: 0, scale: 0, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ delay: i * 0.06, type: "spring", stiffness: 200 }}
            className="flex flex-col items-center gap-1 shrink-0"
          >
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center text-xl relative"
              style={{ background: "hsl(var(--diaper) / 0.15)" }}
            >
              {m.emoji}
              <div
                className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center"
                style={{ background: "hsl(var(--diaper))" }}
              >
                <Check className="w-2.5 h-2.5 text-white" />
              </div>
            </div>
            <p className="text-[8px] text-yellow-400/60 text-center w-12 leading-tight truncate">
              {m.title}
            </p>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

// ─── Роадмап по месяцам ───────────────────────────────────────────────────────

function AgeRoadmap({
  milestones,
  currentMonth,
}: {
  milestones: Milestone[];
  currentMonth: number;
}) {
  const months = [0, 2, 4, 6, 9, 12, 15, 18, 21, 24];

  return (
    <div
      className="rounded-3xl p-4"
      style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}
    >
      <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-4">
        🗺️ Роадмап развития
      </p>

      <div className="overflow-x-auto scrollbar-hide">
        <div className="flex items-center gap-0 min-w-max px-2">
          {months.map((m, i) => {
            const items      = milestones.filter((ms) => ms.ageMonths === m);
            const done       = items.filter((ms) => ms.completed).length;
            const total      = items.length;
            const isCurrent  = currentMonth >= m && (months[i + 1] === undefined || currentMonth < months[i + 1]);
            const isPast     = currentMonth > m;

            return (
              <div key={m} className="flex items-center">
                {i > 0 && (
                  <div
                    className="w-8 h-0.5"
                    style={{ background: isPast ? "hsl(var(--sleep))" : "hsl(var(--border))" }}
                  />
                )}

                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex flex-col items-center gap-1.5"
                >
                  <div
                    className="w-10 h-10 rounded-2xl flex items-center justify-center relative"
                    style={{
                      background: isCurrent
                        ? "hsl(var(--sleep) / 0.20)"
                        : isPast
                        ? "hsl(var(--sleep) / 0.15)"
                        : "hsl(var(--muted))",
                      border: isCurrent ? "2px solid hsl(var(--sleep))" : "2px solid transparent",
                      boxShadow: isCurrent ? "0 0 16px hsl(260,60%,40%)" : "none",
                    }}
                  >
                    {total > 0 ? (
                      <span className="text-base">{items[0].emoji}</span>
                    ) : (
                      <span className="text-muted-foreground/40 text-xs">—</span>
                    )}
                    {done > 0 && (
                      <div
                        className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center"
                        style={{ background: "hsl(var(--feeding))" }}
                      >
                        <Check className="w-2.5 h-2.5 text-white" />
                      </div>
                    )}
                  </div>
                  <span
                    className="text-[9px] font-semibold"
                    style={{ color: isCurrent ? "hsl(var(--sleep))" : "hsl(var(--muted-foreground))" }}
                  >
                    {m}м
                  </span>
                </motion.div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Карточка достижения ──────────────────────────────────────────────────────

function MilestoneCard({
  m,
  catColor,
  onComplete,
}: {
  m: Milestone;
  catColor: string;
  onComplete: (id: string) => void;
}) {
  const [burst, setBurst] = useState(false);

  const handleComplete = () => {
    if (m.completed) return;
    setBurst(true);
    setTimeout(() => setBurst(false), 800);
    onComplete(m.id);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="relative rounded-3xl p-4 flex items-center gap-4"
      style={{
        background: m.completed
          ? `${hca(catColor, 0.07)}`
          : "hsl(var(--card))",
        border: `1.5px solid ${m.completed ? hca(catColor, 0.20) : "hsl(var(--border))"}`,
      }}
    >
      <BurstConfetti color={catColor} active={burst} />

      <motion.div
        animate={m.completed ? { rotate: [0, -10, 10, 0] } : {}}
        transition={{ duration: 0.5 }}
        className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shrink-0 relative"
        style={{
          background: m.completed ? `${hca(catColor, 0.15)}` : "hsl(var(--muted))",
          border: `1px solid ${m.completed ? hca(catColor, 0.25) : "transparent"}`,
        }}
      >
        {m.completed ? m.emoji : <Lock className="w-5 h-5 text-muted-foreground/30" />}
        {m.completed && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full flex items-center justify-center"
            style={{ background: catColor }}
          >
            <Check className="w-3 h-3 text-white" />
          </motion.div>
        )}
      </motion.div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className={cn(
            "text-sm font-bold",
            m.completed ? "text-foreground" : "text-muted-foreground"
          )}>
            {m.title}
          </p>
          <span
            className="px-1.5 py-0.5 rounded-full text-[9px] font-bold shrink-0"
            style={{
              background: `${hca(catColor, 0.12)}`,
              color: catColor,
            }}
          >
            {m.ageMonths}м
          </span>
        </div>
        <p className="text-xs text-muted-foreground mt-0.5 truncate">{m.desc}</p>
        {m.completed && m.completedAt && (
          <p className="text-[10px] mt-1" style={{ color: catColor }}>
            ✓ {new Date(m.completedAt).toLocaleDateString("ru-RU", { day: "numeric", month: "long" })}
          </p>
        )}
      </div>

      {!m.completed && (
        <motion.button
          whileTap={{ scale: 0.85 }}
          onClick={handleComplete}
          className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0"
          style={{ background: `${hca(catColor, 0.12)}`, border: `1px solid ${hca(catColor, 0.25)}` }}
        >
          <Check className="w-5 h-5" style={{ color: catColor }} />
        </motion.button>
      )}
    </motion.div>
  );
}

// ─── Фильтры — светящиеся шары ────────────────────────────────────────────────

function CategoryOrbs({
  active,
  onChange,
}: {
  active: CatKey;
  onChange: (k: CatKey) => void;
}) {
  return (
    <div className="flex gap-2 overflow-x-auto scrollbar-hide px-4 pb-1">
      {(Object.entries(CATS) as [CatKey, typeof CATS[CatKey]][]).map(([key, cat], i) => (
        <motion.button
          key={key}
          onClick={() => onChange(key)}
          initial={{ opacity: 0, scale: 0.7 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: i * 0.05 }}
          whileTap={{ scale: 0.88 }}
          className="flex items-center gap-1.5 px-3 py-2 rounded-2xl shrink-0 transition-all"
          style={
            active === key
              ? { background: `${hca(cat.color, 0.15)}`, border: `1.5px solid ${cat.color}`, boxShadow: `0 0 12px ${hca(cat.color, 0.19)}` }
              : { background: "hsl(var(--card))", border: "1.5px solid transparent" }
          }
        >
          <span className="text-base">{cat.emoji}</span>
          <span
            className="text-xs font-semibold whitespace-nowrap"
            style={{ color: active === key ? cat.color : "hsl(var(--muted-foreground))" }}
          >
            {cat.label}
          </span>
        </motion.button>
      ))}
    </div>
  );
}

// ─── Главный экран ────────────────────────────────────────────────────────────

export default function Milestones() {
  const [activeCat, setActiveCat] = useState<CatKey>("all");
  const [milestones, setMilestones] = useState<Milestone[]>(() => hydrateMilestones());
  const [view, setView] = useState<"list" | "roadmap">("list");

  const completed  = milestones.filter((m) => m.completed);
  const currentAge = readCurrentAgeMonths();

  useEffect(() => {
    const syncMilestones = () => setMilestones(hydrateMilestones());
    syncMilestones();

    window.addEventListener("storage", syncMilestones);
    return () => window.removeEventListener("storage", syncMilestones);
  }, []);

  const filtered = activeCat === "all"
    ? milestones
    : milestones.filter((m) => m.category === activeCat);

  const filteredCompleted = filtered.filter((m) => m.completed);
  const filteredUpcoming  = filtered.filter((m) => !m.completed);

  const handleComplete = (id: string) => {
    const completedAt = new Date().toISOString().split("T")[0];
    const target = milestones.find((x) => x.id === id);
    if (!target) return;

    const next = milestones.map((m) =>
      m.id === id ? { ...m, completed: true, completedAt } : m
    );

    setMilestones(next);
    persistMilestones(next);

    try {
      milestonesDB.update(id, { completed: true });
    } catch {
      /* если нет в DB — ок */
    }

    toast({ title: `🎉 ${target.emoji} ${target.title}!`, description: "Достижение отмечено!" });
  };

  const catColor = (m: Milestone) => CATS[m.category]?.color ?? CATS.all.color;

  return (
    <AppLayout>
      <div className="flex flex-col gap-4 pt-safe pb-8">

        <motion.header
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          className="px-4 md:px-6 pt-4"
        >
          <h1 className="text-2xl font-bold text-foreground">Достижения</h1>

          <div className="mt-3 flex items-center gap-3">
            <div className="flex-1 h-2 rounded-full bg-white/5 overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{ background: "linear-gradient(90deg, hsl(var(--diaper)), hsl(var(--milestone)))" }}
                initial={{ width: 0 }}
                animate={{ width: `${(completed.length / milestones.length) * 100}%` }}
                transition={{ duration: 1, delay: 0.3 }}
              />
            </div>
            <span className="text-xs font-bold text-muted-foreground">
              {completed.length}/{milestones.length}
            </span>
          </div>
        </motion.header>

        <div className="px-4 md:px-6">
          <div
            className="flex p-1 rounded-2xl"
            style={{ background: "hsl(var(--background))", border: "1px solid hsl(var(--border))" }}
          >
            {(["list", "roadmap"] as const).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all"
                style={view === v
                  ? { background: "linear-gradient(135deg, hsl(var(--sleep)), hsl(var(--milestone) / 0.28))", color: "white" }
                  : { color: "hsl(var(--muted-foreground))" }
                }
              >
                {v === "list" ? "📋 Список" : "🗺️ Роадмап"}
              </button>
            ))}
          </div>
        </div>

        <AnimatePresence mode="wait">
          {view === "roadmap" ? (
            <motion.div
              key="roadmap"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="px-4 md:px-6"
            >
              <AgeRoadmap milestones={milestones} currentMonth={currentAge} />
            </motion.div>
          ) : (
            <motion.div
              key="list"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col gap-4"
            >
              <div className="px-4 md:px-6">
                <TrophyShelf completed={completed} />
              </div>

              <CategoryOrbs active={activeCat} onChange={setActiveCat} />

              {filteredCompleted.length > 0 && (
                <div className="px-4 md:px-6">
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2">
                    ✅ Выполнено ({filteredCompleted.length})
                  </p>
                  <div className="flex flex-col gap-2">
                    <AnimatePresence>
                      {filteredCompleted.map((m) => (
                        <MilestoneCard
                          key={m.id}
                          m={m}
                          catColor={catColor(m)}
                          onComplete={handleComplete}
                        />
                      ))}
                    </AnimatePresence>
                  </div>
                </div>
              )}

              {filteredUpcoming.length > 0 && (
                <div className="px-4 md:px-6">
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2">
                    🔒 Впереди ({filteredUpcoming.length})
                  </p>
                  <div className="flex flex-col gap-2">
                    <AnimatePresence>
                      {filteredUpcoming.map((m) => (
                        <MilestoneCard
                          key={m.id}
                          m={m}
                          catColor={catColor(m)}
                          onComplete={handleComplete}
                        />
                      ))}
                    </AnimatePresence>
                  </div>
                </div>
              )}

              {filteredCompleted.length === 0 && filteredUpcoming.length === 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-16 px-8"
                >
                  <span className="text-5xl">🏆</span>
                  <p className="text-muted-foreground mt-3 text-sm">
                    Нет достижений в этой категории
                  </p>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </AppLayout>
  );
}
