/**
 * ФАЙЛ: src/pages/profile/BabyProfileDetail.tsx
 */

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Edit3, X, Check } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { eventsDB, allergensDB } from "@/lib/crud";
import { AppLayout } from "@/components/layout/AppLayout";
import { toast } from "@/hooks/use-toast";

const hc  = (v: string) => `hsl(var(${v}))`;
const hca = (v: string, a: number) => `hsl(var(${v}) / ${a})`;

// ─── Типы ─────────────────────────────────────────────────────────────────────

interface BabyProfile {
  id?: string;
  name: string;
  birthDate: string;   // YYYY-MM-DD
  gender: "girl" | "boy" | "neutral";
  avatar: string;      // эмодзи
  bloodType: string;
  weight: number;      // кг (последний)
  height: number;      // см (последний)
  head: number;        // см (последний)
  allergies: string[];
  doctorName: string;
  clinicName: string;
}

type StoredProfile = {
  id: string;
  name: string;
  birthDate: string;
  gender: "girl" | "boy" | "neutral";
  avatar: string;
  active?: boolean;
  bloodType?: string;
  weight?: number;
  height?: number;
  head?: number;
  allergies?: string[];
  doctorName?: string;
  clinicName?: string;
};

const PROFILE_STORAGE_KEY = "babytrack_profiles";

const DEFAULT_PROFILE: BabyProfile = {
  name: "Малыш",
  birthDate: "2024-09-15",
  gender: "neutral",
  avatar: "👶",
  bloodType: "A(II) Rh+",
  weight: 9.3,
  height: 71.5,
  head: 45.1,
  allergies: ["Цитрусовые"],
  doctorName: "Иванова О.В.",
  clinicName: "Детская поликлиника №5",
};

function safeParse<T>(raw: string | null, fallback: T): T {
  try {
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function normalizeGender(value: string | null | undefined): BabyProfile["gender"] {
  if (value === "girl" || value === "boy" || value === "neutral") return value;
  return "neutral";
}

function getProfileKey(profile: Pick<BabyProfile, "name" | "birthDate" | "gender" | "avatar"> & { id?: string }) {
  return profile.id || `${profile.name}|${profile.birthDate}|${profile.gender}|${profile.avatar}`;
}

function getStoredProfiles(): StoredProfile[] {
  return safeParse<StoredProfile[]>(localStorage.getItem(PROFILE_STORAGE_KEY), []);
}

function findActiveStoredProfile(): StoredProfile | undefined {
  const profiles = getStoredProfiles();
  if (profiles.length === 0) return undefined;

  const active = profiles.find((profile) => profile.active);
  if (active) return active;

  const legacyName = localStorage.getItem("babyName");
  return profiles.find((profile) => profile.name === legacyName) ?? profiles[0];
}

function readLatestMetric(subType: "weight" | "height" | "head", fallback: number): number {
  const latest = eventsDB
    .getAll()
    .filter((event) => event.data?.eventSubType === subType || event.title === ({ weight: "Вес", height: "Рост", head: "Обхват головы" }[subType]))
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];

  const value = latest?.data?.amount;
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function readLatestDoctorName(fallback: string): string {
  const latest = eventsDB
    .getAll()
    .filter((event) => event.data?.eventSubType === "doctor")
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];

  return latest?.data?.doctorName || fallback;
}

function readAllergies(fallback: string[]): string[] {
  const items = allergensDB
    .getAll()
    .filter((record) => record.reaction !== "none")
    .map((record) => record.food)
    .filter(Boolean);

  return Array.from(new Set([...fallback, ...items]));
}

function loadProfileSnapshot(): BabyProfile {
  const stored = findActiveStoredProfile();
  const fallback = DEFAULT_PROFILE;
  const profile: BabyProfile = {
    id: stored?.id,
    name: stored?.name || localStorage.getItem("babyName") || fallback.name,
    birthDate: stored?.birthDate || localStorage.getItem("birthDate") || fallback.birthDate,
    gender: normalizeGender(stored?.gender || localStorage.getItem("gender")),
    avatar: stored?.avatar || localStorage.getItem("userAvatar") || fallback.avatar,
    bloodType: stored?.bloodType || fallback.bloodType,
    weight: stored?.weight ?? fallback.weight,
    height: stored?.height ?? fallback.height,
    head: stored?.head ?? fallback.head,
    allergies: stored?.allergies?.length ? stored.allergies : fallback.allergies,
    doctorName: stored?.doctorName || fallback.doctorName,
    clinicName: stored?.clinicName || fallback.clinicName,
  };

  return {
    ...profile,
    weight: readLatestMetric("weight", profile.weight),
    height: readLatestMetric("height", profile.height),
    head: readLatestMetric("head", profile.head),
    doctorName: readLatestDoctorName(profile.doctorName),
    allergies: readAllergies(profile.allergies),
  };
}

function persistProfileSnapshot(profile: BabyProfile): void {
  const profiles = getStoredProfiles();
  const key = getProfileKey(profile);
  const storedIndex = profiles.findIndex((item) => getProfileKey(item) === key);
  const nextStored: StoredProfile = {
    id: profile.id || profiles[storedIndex]?.id || `profile-${Date.now()}`,
    name: profile.name,
    birthDate: profile.birthDate,
    gender: profile.gender,
    avatar: profile.avatar,
    active: true,
    bloodType: profile.bloodType,
    weight: profile.weight,
    height: profile.height,
    head: profile.head,
    allergies: profile.allergies,
    doctorName: profile.doctorName,
    clinicName: profile.clinicName,
  };

  const nextProfiles = profiles.length > 0
    ? profiles.map((item, index) => (
        index === storedIndex || getProfileKey(item) === key
          ? nextStored
          : { ...item, active: false }
      ))
    : [nextStored];

  if (storedIndex === -1 && profiles.length > 0) {
    nextProfiles.unshift(nextStored);
  }

  const deduped = nextProfiles.filter((item, index, self) => self.findIndex((candidate) => candidate.id === item.id) === index);
  localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(deduped));
  localStorage.setItem("babyName", profile.name);
  localStorage.setItem("birthDate", profile.birthDate);
  localStorage.setItem("gender", profile.gender);
  localStorage.setItem("userAvatar", profile.avatar);
}

// ─── Знаки зодиака ────────────────────────────────────────────────────────────

function getZodiac(date: string): { sign: string; emoji: string; trait: string } {
  const d   = new Date(date);
  const m   = d.getMonth() + 1;
  const day = d.getDate();
  if ((m === 3 && day >= 21) || (m === 4 && day <= 19)) return { sign: "Овен",     emoji: "♈", trait: "Смелый и энергичный" };
  if ((m === 4 && day >= 20) || (m === 5 && day <= 20)) return { sign: "Телец",    emoji: "♉", trait: "Терпеливый и надёжный" };
  if ((m === 5 && day >= 21) || (m === 6 && day <= 20)) return { sign: "Близнецы", emoji: "♊", trait: "Любопытный и игривый" };
  if ((m === 6 && day >= 21) || (m === 7 && day <= 22)) return { sign: "Рак",      emoji: "♋", trait: "Чуткий и заботливый" };
  if ((m === 7 && day >= 23) || (m === 8 && day <= 22)) return { sign: "Лев",      emoji: "♌", trait: "Уверенный и яркий" };
  if ((m === 8 && day >= 23) || (m === 9 && day <= 22)) return { sign: "Дева",     emoji: "♍", trait: "Внимательный и умный" };
  if ((m === 9 && day >= 23) || (m === 10 && day <= 22)) return { sign: "Весы",    emoji: "♎", trait: "Добрый и гармоничный" };
  if ((m === 10 && day >= 23) || (m === 11 && day <= 21)) return { sign: "Скорпион",emoji: "♏", trait: "Решительный и страстный" };
  if ((m === 11 && day >= 22) || (m === 12 && day <= 21)) return { sign: "Стрелец",emoji: "♐", trait: "Весёлый и свободный" };
  if ((m === 12 && day >= 22) || (m === 1 && day <= 19)) return { sign: "Козерог", emoji: "♑", trait: "Серьёзный и целеустремлённый" };
  if ((m === 1 && day >= 20) || (m === 2 && day <= 18)) return { sign: "Водолей",  emoji: "♒", trait: "Оригинальный и независимый" };
  return { sign: "Рыбы", emoji: "♓", trait: "Мечтательный и добрый" };
}

// ─── Возраст ──────────────────────────────────────────────────────────────────

function calcAgeDetailed(birthDate: string) {
  const birth = new Date(birthDate);
  const now   = new Date();
  const diffMs = now.getTime() - birth.getTime();
  const totalDays   = Math.floor(diffMs / 86400000);
  const totalHours  = Math.floor(diffMs / 3600000);
  const months      = Math.floor(totalDays / 30.44);
  const years       = Math.floor(months / 12);
  const remMonths   = months % 12;
  const remDays     = totalDays - Math.floor(months * 30.44);
  return { years, months, remMonths, days: totalDays, remDays, hours: totalHours };
}

// ─── 1. Hero Card ─────────────────────────────────────────────────────────────

function HeroCard({
  profile,
  onEdit,
}: {
  profile: BabyProfile;
  onEdit: () => void;
}) {
  const age     = calcAgeDetailed(profile.birthDate);
  const zodiac  = getZodiac(profile.birthDate);
  const genderColorVar =
    profile.gender === "girl" ? "--mood" :
    profile.gender === "boy"  ? "--activity" :
    "--sleep";
  const genderColor = hc(genderColorVar);

  const genderBg =
    profile.gender === "girl" ? `linear-gradient(135deg, ${hca("--mood", 0.18)}, ${hca("--mood", 0.14)})` :
    profile.gender === "boy"  ? `linear-gradient(135deg, ${hca("--activity", 0.18)}, ${hca("--activity", 0.14)})` :
    `linear-gradient(135deg, ${hca("--sleep", 0.18)}, ${hca("--sleep", 0.14)})`;

  return (
    <motion.div
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-4 md:mx-6 rounded-3xl p-5 relative overflow-hidden"
      style={{ background: genderBg, border: `1px solid ${hca(genderColorVar, 0.19)}` }}
    >
      <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full opacity-10"
        style={{ background: genderColor }} />
      <div className="absolute -bottom-6 -left-6 w-24 h-24 rounded-full opacity-[0.08]"
        style={{ background: genderColor }} />

      <div className="flex items-start gap-4 relative">
        <div className="relative shrink-0">
          <motion.div
            className="w-20 h-20 rounded-[24px] flex items-center justify-center text-4xl"
            style={{
              background: `${hca(genderColorVar, 0.15)}`,
              border: `2px solid ${hca(genderColorVar, 0.31)}`,
              boxShadow: `0 0 24px ${hca(genderColorVar, 0.19)}`,
            }}
            animate={{ boxShadow: [`0 0 16px ${hca(genderColorVar, 0.12)}`, `0 0 32px ${hca(genderColorVar, 0.25)}`, `0 0 16px ${hca(genderColorVar, 0.12)}`] }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            {profile.avatar}
          </motion.div>
          <div
            className="absolute -bottom-1 -right-1 w-7 h-7 rounded-xl flex items-center justify-center text-sm"
            style={{ background: genderColor, boxShadow: `0 2px 8px ${hca(genderColorVar, 0.38)}` }}
          >
            {profile.gender === "girl" ? "👧" : profile.gender === "boy" ? "👦" : "👶"}
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold text-white leading-tight">{profile.name}</h2>

          <div className="flex items-baseline gap-1 mt-1 flex-wrap">
            {age.years > 0 && (
              <span className="text-base font-bold" style={{ color: genderColor }}>
                {age.years} {age.years === 1 ? "год" : "года"}
              </span>
            )}
            <span className="text-base font-bold" style={{ color: genderColor }}>
              {age.remMonths} мес
            </span>
            <span className="text-xs text-white/50">
              {age.remDays} дн
            </span>
          </div>

          <p className="text-xs text-white/50 mt-0.5">
            {new Date(profile.birthDate).toLocaleDateString("ru-RU", {
              day: "numeric", month: "long", year: "numeric"
            })}
          </p>

          <div
            className="inline-flex items-center gap-1.5 mt-2 px-2.5 py-1 rounded-xl"
            style={{ background: `${hca(genderColorVar, 0.12)}` }}
          >
            <span className="text-sm">{zodiac.emoji}</span>
            <span className="text-xs font-semibold" style={{ color: genderColor }}>
              {zodiac.sign}
            </span>
          </div>
        </div>

        <motion.button
          whileTap={{ scale: 0.85 }}
          onClick={onEdit}
          className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: `${hca(genderColorVar, 0.12)}` }}
        >
          <Edit3 className="w-4 h-4" style={{ color: genderColor }} />
        </motion.button>
      </div>

      <div className="mt-3 relative">
        <p className="text-xs text-white/40 italic">
          {zodiac.emoji} {zodiac.trait}
        </p>
      </div>
    </motion.div>
  );
}

// ─── 2. Живой счётчик возраста ────────────────────────────────────────────────

function AgeCounter({ birthDate }: { birthDate: string }) {
  const [age, setAge] = useState(calcAgeDetailed(birthDate));

  useEffect(() => {
    const interval = setInterval(() => setAge(calcAgeDetailed(birthDate)), 60000);
    return () => clearInterval(interval);
  }, [birthDate]);

  const items = [
    { label: "Дней",   value: age.days,   colorVar: "--sleep"    },
    { label: "Месяцев",value: age.months,  colorVar: "--activity" },
    { label: "Часов",  value: age.hours,   colorVar: "--mood"     },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 }}
      className="mx-4 md:mx-6 rounded-3xl p-4"
      style={{ background: "hsl(var(--card))", border: `1px solid ${hc("--border")}` }}
    >
      <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">
        ⏱ Возраст в цифрах
      </p>
      <div className="flex gap-3">
        {items.map((item, i) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 + i * 0.08 }}
            className="flex-1 rounded-2xl p-3 flex flex-col items-center gap-1"
            style={{ background: `${hca(item.colorVar, 0.07)}`, border: `1px solid ${hca(item.colorVar, 0.15)}` }}
          >
            <motion.span
              key={item.value}
              initial={{ y: -8, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="text-xl font-bold tabular-nums"
              style={{ color: hc(item.colorVar) }}
            >
              {item.value.toLocaleString("ru-RU")}
            </motion.span>
            <span className="text-[10px] text-muted-foreground">{item.label}</span>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

// ─── 3. Кольца метрик (Apple Watch style) ────────────────────────────────────

function MetricRings({ weight, height, head }: {
  weight: number; height: number; head: number;
}) {
  const metrics = [
    { label: "Вес",    value: weight, unit: "кг", norm: 9.5, colorVar: "--health",   emoji: "⚖️"  },
    { label: "Рост",   value: height, unit: "см", norm: 72,  colorVar: "--activity", emoji: "📏" },
    { label: "Голова", value: head,   unit: "см", norm: 45,  colorVar: "--sleep",    emoji: "🔵" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="mx-4 md:mx-6 rounded-3xl p-4"
      style={{ background: "hsl(var(--card))", border: `1px solid ${hc("--border")}` }}
    >
      <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-4">
        📊 Антропометрия
      </p>
      <div className="flex justify-around">
        {metrics.map((m, i) => {
          const SIZE = 88;
          const R    = 34;
          const C    = 2 * Math.PI * R;
          const pct  = Math.min(m.value / (m.norm * 1.3), 1);

          return (
            <motion.div
              key={m.label}
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 + i * 0.1, type: "spring" }}
              className="flex flex-col items-center gap-2"
            >
              <div className="relative" style={{ width: SIZE, height: SIZE }}>
                <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}
                  style={{ transform: "rotate(-90deg)" }}>
                  <circle cx={SIZE/2} cy={SIZE/2} r={R}
                    fill="none" stroke={hc("--border")} strokeWidth="7" />
                  <motion.circle
                    cx={SIZE/2} cy={SIZE/2} r={R}
                    fill="none" stroke={hc(m.colorVar)} strokeWidth="7" strokeLinecap="round"
                    strokeDasharray={C}
                    initial={{ strokeDashoffset: C }}
                    animate={{ strokeDashoffset: C - pct * C }}
                    transition={{ duration: 1, delay: 0.4 + i * 0.12, ease: "easeOut" }}
                    style={{ filter: `drop-shadow(0 0 4px ${hca(m.colorVar, 0.38)})` }}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-base">{m.emoji}</span>
                  <span className="text-xs font-bold" style={{ color: hc(m.colorVar) }}>
                    {m.value}
                  </span>
                </div>
              </div>
              <div className="text-center">
                <p className="text-xs font-semibold text-foreground">{m.label}</p>
                <p className="text-[10px] text-muted-foreground">{m.unit}</p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}

// ─── 4. Сетка показателей ─────────────────────────────────────────────────────

function StatGrid({ profile }: { profile: BabyProfile }) {
  const stats = [
    { emoji: "🩸", label: "Группа крови",  value: profile.bloodType,    colorVar: "--health"   },
    { emoji: "👨‍⚕️", label: "Педиатр",       value: profile.doctorName,   colorVar: "--feeding"  },
    { emoji: "🏥", label: "Клиника",        value: profile.clinicName,   colorVar: "--activity" },
    { emoji: "⚠️", label: "Аллергии",       value: profile.allergies.join(", ") || "Нет", colorVar: "--diaper" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="mx-4 md:mx-6 rounded-3xl p-4"
      style={{ background: "hsl(var(--card))", border: `1px solid ${hc("--border")}` }}
    >
      <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">
        📋 Медкарта
      </p>
      <div className="flex flex-col gap-2">
        {stats.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.35 + i * 0.06 }}
            className="flex items-center gap-3 p-3 rounded-2xl"
            style={{ background: `${hca(s.colorVar, 0.06)}` }}
          >
            <span className="text-lg shrink-0">{s.emoji}</span>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] text-muted-foreground">{s.label}</p>
              <p className="text-sm font-semibold text-foreground truncate">{s.value}</p>
            </div>
            <div
              className="w-2 h-2 rounded-full shrink-0"
              style={{ background: hc(s.colorVar) }}
            />
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

// ─── 5. Быстрые ссылки ────────────────────────────────────────────────────────

function QuickLinks() {
  const navigate = useNavigate();
  const links = [
    { label: "История событий", emoji: "📜", path: "/calendar",   colorVar: "--sleep"    },
    { label: "Кривые роста",    emoji: "📈", path: "/growth",      colorVar: "--activity" },
    { label: "Достижения",      emoji: "🏆", path: "/milestones",  colorVar: "--diaper"   },
    { label: "Вакцинация",      emoji: "💉", path: "/vaccinations",colorVar: "--feeding"  },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className="mx-4 md:mx-6 rounded-3xl p-4"
      style={{ background: "hsl(var(--card))", border: `1px solid ${hc("--border")}` }}
    >
      <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">
        🔗 Быстрые разделы
      </p>
      <div className="grid grid-cols-2 gap-2">
        {links.map((l, i) => (
          <motion.button
            key={l.path}
            onClick={() => navigate(l.path)}
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.45 + i * 0.06 }}
            whileTap={{ scale: 0.94 }}
            className="flex items-center gap-3 p-3 rounded-2xl text-left"
            style={{ background: `${hca(l.colorVar, 0.07)}`, border: `1px solid ${hca(l.colorVar, 0.15)}` }}
          >
            <span className="text-xl">{l.emoji}</span>
            <span className="text-xs font-semibold text-foreground leading-tight">{l.label}</span>
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
}

// ─── 6. Bottom Sheet редактирования ──────────────────────────────────────────

function EditSheet({
  profile,
  onSave,
  onClose,
}: {
  profile: BabyProfile;
  onSave: (p: BabyProfile) => void;
  onClose: () => void;
}) {
  const [name,       setName]       = useState(profile.name);
  const [birthDate,  setBirthDate]  = useState(profile.birthDate);
  const [gender,     setGender]     = useState(profile.gender);
  const [bloodType,  setBloodType]  = useState(profile.bloodType);
  const [doctorName, setDoctorName] = useState(profile.doctorName);
  const [clinicName, setClinicName] = useState(profile.clinicName);
  const [allergy,    setAllergy]    = useState(profile.allergies.join(", "));
  const [avatar,     setAvatar]     = useState(profile.avatar);

  const AVATARS = ["👶","👧","👦","🧒","🐣","🌟","🦊","🐨"];
  const BLOOD   = ["A(II) Rh+","A(II) Rh-","B(III) Rh+","B(III) Rh-","O(I) Rh+","O(I) Rh-","AB(IV) Rh+","AB(IV) Rh-"];

  const genderColorVars = {
    girl:    "--mood",
    boy:     "--activity",
    neutral: "--sleep",
  };

  const handleSave = () => {
    const updated = {
      ...profile, name, birthDate, gender, bloodType,
      doctorName, clinicName,
      allergies: allergy ? allergy.split(",").map((a) => a.trim()) : [],
      avatar,
    };
    persistProfileSnapshot(updated);
    onSave(updated);
    toast({ title: "✅ Профиль сохранён" });
    onClose();
  };

  return (
    <motion.div
      initial={{ y: "100%" }}
      animate={{ y: 0 }}
      exit={{ y: "100%" }}
      transition={{ type: "spring", stiffness: 280, damping: 32 }}
      className="fixed inset-x-0 bottom-0 z-40 max-w-md mx-auto rounded-t-3xl overflow-hidden"
      style={{ background: "hsl(var(--background))", border: `1px solid ${hc("--border")}` }}
    >
      <div className="flex justify-center pt-3 pb-1">
        <div className="w-10 h-1 rounded-full bg-white/20" />
      </div>

      <div className="px-5 pb-10 flex flex-col gap-4 max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-foreground">Редактировать профиль</h3>
          <button onClick={onClose}>
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        <div>
          <p className="text-xs text-muted-foreground mb-2">Аватар</p>
          <div className="flex gap-2 flex-wrap">
            {AVATARS.map((a) => (
              <motion.button
                key={a}
                onClick={() => setAvatar(a)}
                whileTap={{ scale: 0.85 }}
                className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl"
                style={avatar === a
                  ? { background: hca("--sleep", 0.18), border: `2px solid ${hc("--sleep")}` }
                  : { background: "hsl(var(--muted))", border: "2px solid transparent" }
                }
              >
                {a}
              </motion.button>
            ))}
          </div>
        </div>

        <div>
          <p className="text-xs text-muted-foreground mb-1">Имя</p>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full h-12 px-4 rounded-2xl bg-muted text-foreground text-sm focus:outline-none"
            style={{ border: `1px solid ${hc("--border")}` }}
          />
        </div>

        <div>
          <p className="text-xs text-muted-foreground mb-1">Дата рождения</p>
          <input
            type="date"
            value={birthDate}
            onChange={(e) => setBirthDate(e.target.value)}
            className="w-full h-12 px-4 rounded-2xl bg-muted text-foreground text-sm focus:outline-none"
            style={{ border: `1px solid ${hc("--border")}` }}
          />
        </div>

        <div>
          <p className="text-xs text-muted-foreground mb-2">Пол</p>
          <div className="flex gap-2">
            {(["girl","boy","neutral"] as const).map((g) => (
              <button
                key={g}
                onClick={() => setGender(g)}
                className="flex-1 py-3 rounded-2xl text-sm font-semibold transition-all"
                style={gender === g
                  ? { background: `${hca(genderColorVars[g], 0.15)}`, border: `1.5px solid ${hc(genderColorVars[g])}`, color: hc(genderColorVars[g]) }
                  : { background: "hsl(var(--muted))", border: "1.5px solid transparent", color: hc("--muted-foreground") }
                }
              >
                {{ girl:"👧 Девочка", boy:"👦 Мальчик", neutral:"👶 Не указан" }[g]}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="text-xs text-muted-foreground mb-2">Группа крови</p>
          <div className="flex flex-wrap gap-2">
            {BLOOD.map((b) => (
              <button
                key={b}
                onClick={() => setBloodType(b)}
                className="px-3 py-2 rounded-xl text-xs font-semibold transition-all"
                style={bloodType === b
                  ? { background: hca("--health", 0.18), border: `1.5px solid ${hc("--health")}`, color: hc("--health") }
                  : { background: "hsl(var(--muted))", border: "1.5px solid transparent", color: hc("--muted-foreground") }
                }
              >
                {b}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="text-xs text-muted-foreground mb-1">Педиатр</p>
          <input
            value={doctorName}
            onChange={(e) => setDoctorName(e.target.value)}
            placeholder="ФИО врача"
            className="w-full h-12 px-4 rounded-2xl bg-muted text-foreground text-sm focus:outline-none"
            style={{ border: `1px solid ${hc("--border")}` }}
          />
        </div>

        <div>
          <p className="text-xs text-muted-foreground mb-1">Клиника</p>
          <input
            value={clinicName}
            onChange={(e) => setClinicName(e.target.value)}
            placeholder="Название клиники"
            className="w-full h-12 px-4 rounded-2xl bg-muted text-foreground text-sm focus:outline-none"
            style={{ border: `1px solid ${hc("--border")}` }}
          />
        </div>

        <div>
          <p className="text-xs text-muted-foreground mb-1">Аллергии (через запятую)</p>
          <input
            value={allergy}
            onChange={(e) => setAllergy(e.target.value)}
            placeholder="Молоко, орехи..."
            className="w-full h-12 px-4 rounded-2xl bg-muted text-foreground text-sm focus:outline-none"
            style={{ border: `1px solid ${hc("--border")}` }}
          />
        </div>

        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={handleSave}
          className="w-full h-14 rounded-2xl font-bold text-base text-white flex items-center justify-center gap-2"
          style={{
            background: `linear-gradient(135deg, ${hc("--sleep")}, ${hc("--milestone")})`,
            boxShadow: `0 8px 24px ${hca("--sleep", 0.28)}`,
          }}
        >
          <Check className="w-5 h-5" /> Сохранить
        </motion.button>
      </div>
    </motion.div>
  );
}

// ─── Главный экран ────────────────────────────────────────────────────────────

export default function BabyProfileDetail() {
  const [profile,  setProfile]  = useState<BabyProfile>(() => loadProfileSnapshot());
  const [showEdit, setShowEdit] = useState(false);

  useEffect(() => {
    const syncProfile = () => setProfile(loadProfileSnapshot());
    syncProfile();

    window.addEventListener("storage", syncProfile);
    window.addEventListener("focus", syncProfile);

    return () => {
      window.removeEventListener("storage", syncProfile);
      window.removeEventListener("focus", syncProfile);
    };
  }, []);

  return (
    <AppLayout>
      <AnimatePresence>
        {showEdit && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-30 bg-black/60"
            onClick={() => setShowEdit(false)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showEdit && (
          <EditSheet
            profile={profile}
            onSave={setProfile}
            onClose={() => setShowEdit(false)}
          />
        )}
      </AnimatePresence>

      <div className="flex flex-col gap-4 pt-safe pb-10">

        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="px-4 md:px-6 pt-4"
        >
          <h1 className="text-2xl font-bold text-foreground">Профиль малыша</h1>
        </motion.div>

        <HeroCard profile={profile} onEdit={() => setShowEdit(true)} />
        <AgeCounter birthDate={profile.birthDate} />
        <MetricRings
          weight={profile.weight}
          height={profile.height}
          head={profile.head}
        />
        <StatGrid profile={profile} />
        <QuickLinks />

      </div>
    </AppLayout>
  );
}
