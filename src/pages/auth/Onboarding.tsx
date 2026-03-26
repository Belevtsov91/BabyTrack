import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, Check, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  saveBabyProfileState,
  setLastAppVisitAt,
  setOnboarded,
  setSessionRecapDismissedContext,
} from "@/lib/appStorage";
import {
  GlassFilter,
  LiquidSurface,
  LIQUID_TONE_BY_COLOR_VAR,
  type LiquidTone,
} from "@/components/ui/liquid-radio";

type Gender = "girl" | "boy" | "neutral";

const hc = (value: string) => `hsl(var(${value}))`;
const hca = (value: string, alpha: number) => `hsl(var(${value}) / ${alpha})`;
const toneFromVar = (value: string): LiquidTone =>
  LIQUID_TONE_BY_COLOR_VAR[value] ?? (value === "--foreground" ? "neutral" : "primary");

const STEP_BG_VARS = ["--sleep", "--health", "--activity", "--mood", "--feeding", "--milestone"] as const;
const STEP_ACCENT_VARS = ["--sleep", "--health", "--activity", "--mood", "--feeding", "--milestone"] as const;

const STEP_META = [
  {
    eyebrow: "Старт",
    title: "Добро пожаловать",
    hint: "Коротко покажем, как приложение помогает собирать день малыша в одну понятную историю.",
  },
  {
    eyebrow: "Профиль",
    title: "Имя малыша",
    hint: "Имя понадобится для персонализации сводок, истории роста и карточек внутри приложения.",
  },
  {
    eyebrow: "Возраст",
    title: "Дата рождения",
    hint: "По дате рождения считаются возраст, этапы развития и часть аналитики.",
  },
  {
    eyebrow: "Персонализация",
    title: "Кто у вас?",
    hint: "Настроим более личную визуальную подачу профиля и быстрых экранов.",
  },
  {
    eyebrow: "Трекинг",
    title: "Что отслеживать",
    hint: "Выберите только нужные разделы, чтобы интерфейс не шумел лишним.",
  },
  {
    eyebrow: "Финиш",
    title: "Все готово",
    hint: "Профиль собран. Осталось зайти в приложение и сделать первую запись.",
  },
] as const;

const FEATURE_OPTIONS = [
  { id: "sleep", emoji: "🌙", label: "Сон", desc: "Дневной и ночной", colorVar: "--sleep" },
  { id: "feeding", emoji: "🍼", label: "Кормление", desc: "Грудь и бутылочка", colorVar: "--feeding" },
  { id: "diaper", emoji: "👶", label: "Подгузники", desc: "Типы и частота", colorVar: "--diaper" },
  { id: "growth", emoji: "📏", label: "Рост и вес", desc: "Замеры и динамика", colorVar: "--growth" },
  { id: "health", emoji: "🏥", label: "Здоровье", desc: "Врачи и прививки", colorVar: "--health" },
  { id: "milestones", emoji: "🏆", label: "Достижения", desc: "Первые шаги и слова", colorVar: "--milestone" },
] as const;

const PREVIEW_CARDS = [
  {
    id: "preview-sleep",
    emoji: "🌙",
    title: "Сон",
    text: "Ритм сна и окна бодрствования собираются в одну ленту.",
    colorVar: "--sleep",
  },
  {
    id: "preview-feed",
    emoji: "🍼",
    title: "Кормления",
    text: "Грудь, бутылочка и прикорм остаются в одном контексте.",
    colorVar: "--feeding",
  },
  {
    id: "preview-health",
    emoji: "💙",
    title: "Здоровье",
    text: "Температура, лекарства и визиты не теряются среди обычного дня.",
    colorVar: "--health",
  },
  {
    id: "preview-moments",
    emoji: "🏆",
    title: "Моменты",
    text: "Фото и достижения складываются в живую историю роста.",
    colorVar: "--milestone",
  },
] as const;

function Confetti() {
  const colorVars = ["--sleep", "--health", "--feeding", "--mood", "--milestone", "--activity"];
  const items = Array.from({ length: 28 }, (_, index) => ({
    width: 4 + (index % 4),
    height: 4 + ((index * 3) % 5),
    left: `${(index * 11) % 100}%`,
    rotate: (index * 29) % 360,
    drift: -90 + (index % 7) * 30,
    delay: (index % 6) * 0.08,
  }));

  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
      {items.map((item, index) => (
        <motion.div
          key={index}
          className="absolute rounded-sm"
          style={{
            width: item.width,
            height: item.height,
            left: item.left,
            top: "-20px",
            backgroundColor: index === 4 ? "white" : hc(colorVars[index % colorVars.length]),
            rotate: item.rotate,
          }}
          animate={{ y: [0, "110vh"], x: [0, item.drift], rotate: [item.rotate, item.rotate + 180], opacity: [1, 1, 0] }}
          transition={{ duration: 1.8 + (index % 4) * 0.18, delay: item.delay, ease: "easeOut" }}
        />
      ))}
    </div>
  );
}

function OnboardingBackground({ accentVar, bgVar }: { accentVar: string; bgVar: string }) {
  const bubbles = [
    { size: 260, x: "-6%", y: "-10%", color: hc(bgVar), delay: 0 },
    { size: 200, x: "76%", y: "12%", color: hc(accentVar), delay: 0.5 },
    { size: 180, x: "10%", y: "72%", color: hc("--activity"), delay: 1 },
    { size: 160, x: "74%", y: "74%", color: hc("--mood"), delay: 1.4 },
  ];

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {bubbles.map((bubble, index) => (
        <motion.div
          key={index}
          className="absolute rounded-full blur-3xl"
          style={{ width: bubble.size, height: bubble.size, left: bubble.x, top: bubble.y, background: bubble.color, opacity: 0.18 }}
          animate={{ x: [0, 24, -10, 18, 0], y: [0, -16, 20, -10, 0], scale: [1, 1.08, 0.96, 1.04, 1] }}
          transition={{ duration: 10 + index * 2, repeat: Infinity, ease: "easeInOut", delay: bubble.delay }}
        />
      ))}
    </div>
  );
}

function ProgressDots({ current, total, accentVar }: { current: number; total: number; accentVar: string }) {
  return (
    <div className="flex items-center gap-1.5">
      {Array.from({ length: total }).map((_, index) => (
        <motion.div
          key={index}
          className="h-1.5 rounded-full"
          animate={{
            width: index === current ? 28 : index < current ? 18 : 8,
            backgroundColor: index <= current ? hc(accentVar) : "hsl(var(--border))",
            opacity: index <= current ? 1 : 0.55,
          }}
          transition={{ duration: 0.28 }}
        />
      ))}
    </div>
  );
}

function StepSection({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={cn("mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center px-4 py-8 md:px-8 md:py-10", className)}>
      {children}
    </div>
  );
}

function DesktopRail({ step, totalSteps, accentVar }: { step: number; totalSteps: number; accentVar: string }) {
  return (
    <aside className="hidden w-[320px] shrink-0 lg:flex lg:flex-col">
      <div className="flex h-full flex-col justify-between rounded-[32px] border border-white/10 bg-black/15 p-6 shadow-[0_24px_80px_-48px_rgba(0,0,0,0.95)] backdrop-blur-2xl">
        <div className="space-y-8">
          <div className="space-y-4">
            <div
              className="inline-flex h-14 w-14 items-center justify-center rounded-[20px] border border-white/10"
              style={{
                background: `linear-gradient(135deg, ${hca(accentVar, 0.28)}, ${hca(accentVar, 0.08)})`,
                boxShadow: `0 18px 48px -28px ${hca(accentVar, 0.75)}`,
              }}
            >
              <span className="text-3xl">👶</span>
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-muted-foreground">
                {STEP_META[step].eyebrow}
              </p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground">
                {STEP_META[step].title}
              </h1>
              <p className="mt-3 text-sm leading-7 text-muted-foreground">{STEP_META[step].hint}</p>
            </div>
          </div>

          <div className="space-y-3">
            {STEP_META.map((item, index) => {
              const active = index === step;
              const done = index < step;
              return (
                <div
                  key={item.title}
                  className={cn(
                    "flex items-center gap-3 rounded-2xl border px-4 py-3 transition-all",
                    active ? "border-white/10 bg-white/6" : "border-white/6 bg-black/10",
                  )}
                >
                  <div
                    className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold"
                    style={{
                      background: done || active ? hc(accentVar) : "hsl(var(--muted))",
                      color: done || active ? "hsl(var(--background))" : "hsl(var(--muted-foreground))",
                    }}
                  >
                    {done ? <Check className="h-3.5 w-3.5" /> : String(index + 1).padStart(2, "0")}
                  </div>
                  <div className="min-w-0">
                    <p className={cn("text-sm font-semibold", active ? "text-foreground" : "text-foreground/75")}>
                      {item.title}
                    </p>
                    <p className="text-[11px] text-muted-foreground">{item.eyebrow}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-[28px] border border-white/8 bg-white/5 p-4">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
            Шаг {step + 1} из {totalSteps}
          </p>
          <div className="mt-4">
            <ProgressDots current={step} total={totalSteps} accentVar={accentVar} />
          </div>
        </div>
      </div>
    </aside>
  );
}

function MobileHeader({
  step,
  totalSteps,
  accentVar,
  onBack,
}: {
  step: number;
  totalSteps: number;
  accentVar: string;
  onBack: () => void;
}) {
  return (
    <div className="border-b border-white/8 px-4 py-4 md:px-6 lg:hidden">
      <div className="flex items-center gap-3">
        {step > 0 ? (
          <motion.button whileTap={{ scale: 0.9 }} onClick={onBack} className="h-10 w-10 shrink-0">
            <LiquidSurface
              tone="neutral"
              ambientDelay={0.15}
              className="h-10 w-10 rounded-full"
              contentClassName="flex h-full w-full items-center justify-center rounded-full bg-muted"
            >
              <ArrowLeft className="h-4 w-4 text-muted-foreground" />
            </LiquidSurface>
          </motion.button>
        ) : null}

        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-muted-foreground">
            {STEP_META[step].eyebrow}
          </p>
          <p className="mt-1 text-base font-semibold text-foreground">{STEP_META[step].title}</p>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between gap-4">
        <ProgressDots current={step} total={totalSteps} accentVar={accentVar} />
        <span className="text-xs font-semibold text-muted-foreground">
          {step + 1}/{totalSteps}
        </span>
      </div>
    </div>
  );
}

function WelcomeStep({ accentVar }: { accentVar: string }) {
  return (
    <StepSection className="max-w-4xl">
      <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
        <div className="text-center lg:text-left">
          <motion.div
            initial={{ scale: 0.92, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.45 }}
            className="mx-auto mb-8 flex h-28 w-28 items-center justify-center rounded-[32px] lg:mx-0"
            style={{
              background: `linear-gradient(145deg, ${hca(accentVar, 0.24)}, ${hca(accentVar, 0.08)})`,
              border: `1px solid ${hca(accentVar, 0.22)}`,
              boxShadow: `0 24px 60px -30px ${hca(accentVar, 0.65)}`,
            }}
          >
            <span className="text-6xl">👶</span>
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
            className="text-[11px] font-bold uppercase tracking-[0.24em] text-muted-foreground"
          >
            Спокойный старт
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12 }}
            className="mt-3 text-4xl font-semibold tracking-tight text-foreground md:text-5xl"
          >
            Добро пожаловать в BabyTrack
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.18 }}
            className="mt-5 text-base leading-8 text-muted-foreground"
          >
            Здесь день малыша собирается в понятную, живую историю: от сна и кормлений до фото,
            достижений и заметок о самочувствии.
          </motion.p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {PREVIEW_CARDS.map((card, index) => (
            <motion.div
              key={card.id}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + index * 0.06 }}
            >
              <LiquidSurface
                tone={toneFromVar(card.colorVar)}
                ambientDelay={index * 0.22}
                className="rounded-[28px]"
                contentClassName="h-full rounded-[28px] p-5"
                style={{
                  background: `linear-gradient(145deg, ${hca(card.colorVar, 0.15)}, ${hca(card.colorVar, 0.05)})`,
                  border: `1px solid ${hca(card.colorVar, 0.24)}`,
                }}
              >
                <div className="space-y-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-black/15 text-2xl">
                    {card.emoji}
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-foreground">{card.title}</p>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">{card.text}</p>
                  </div>
                </div>
              </LiquidSurface>
            </motion.div>
          ))}
        </div>
      </div>
    </StepSection>
  );
}

function NameStep({
  accentVar,
  value,
  onChange,
}: {
  accentVar: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <StepSection className="max-w-xl">
      <div className="space-y-8 text-center">
        <div className="space-y-3">
          <span className="text-6xl">👶</span>
          <h2 className="text-3xl font-semibold text-foreground md:text-4xl">Как зовут малыша?</h2>
          <p className="text-sm leading-7 text-muted-foreground md:text-base">
            Имя будет использоваться в сводках, истории роста и карточках внутри приложения.
          </p>
        </div>

        <div
          className="rounded-[28px] border p-6"
          style={{ background: hca(accentVar, 0.07), borderColor: value ? hc(accentVar) : hca("--border", 0.75) }}
        >
          <input
            value={value}
            onChange={(event) => onChange(event.target.value)}
            placeholder="Имя малыша"
            autoFocus
            className="w-full border-0 bg-transparent text-center text-3xl font-semibold text-foreground placeholder:text-muted-foreground/35 focus:outline-none md:text-4xl"
          />
        </div>

        <AnimatePresence>
          {value.trim() ? (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6 }}
              className="mx-auto max-w-sm rounded-2xl px-5 py-3"
              style={{ background: hca(accentVar, 0.12), border: `1px solid ${hca(accentVar, 0.26)}` }}
            >
              <p className="text-sm font-semibold" style={{ color: hc(accentVar) }}>
                Привет, {value.trim()}!
              </p>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </StepSection>
  );
}

function DateStep({
  accentVar,
  value,
  onChange,
}: {
  accentVar: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const today = new Date();
  const minDate = "1990-01-01";
  const maxDate = today.toISOString().split("T")[0];
  const invalid = value.length > 0 && (new Date(value) < new Date(minDate) || new Date(value) > today);
  const months = value && !invalid ? Math.floor((today.getTime() - new Date(value).getTime()) / (1000 * 60 * 60 * 24 * 30)) : null;

  return (
    <StepSection className="max-w-xl">
      <div className="space-y-8 text-center">
        <div className="space-y-3">
          <span className="text-6xl">🎂</span>
          <h2 className="text-3xl font-semibold text-foreground md:text-4xl">Дата рождения</h2>
          <p className="text-sm leading-7 text-muted-foreground md:text-base">
            По ней мы считаем возраст, этапы развития и часть аналитики внутри приложения.
          </p>
        </div>

        <div
          className="rounded-[28px] border p-5 md:p-6"
          style={{ background: hca(accentVar, 0.07), borderColor: invalid ? hc("--health") : hca(accentVar, 0.2) }}
        >
          <input
            type="date"
            value={value}
            onChange={(event) => onChange(event.target.value)}
            min={minDate}
            max={maxDate}
            className="w-full bg-transparent text-center text-2xl font-semibold text-foreground focus:outline-none md:text-3xl"
          />
        </div>

        <AnimatePresence mode="wait">
          {invalid ? (
            <motion.p
              key="error"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="text-sm font-semibold"
              style={{ color: hc("--health") }}
            >
              Укажите реальную дату между 1 января 1990 и сегодняшним днем.
            </motion.p>
          ) : months !== null ? (
            <motion.div
              key="age"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mx-auto max-w-sm rounded-2xl px-5 py-3"
              style={{ background: hca(accentVar, 0.12), border: `1px solid ${hca(accentVar, 0.24)}` }}
            >
              <p className="text-lg font-semibold" style={{ color: hc(accentVar) }}>
                {months} мес.
              </p>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </StepSection>
  );
}

function GenderStep({ value, onChange }: { value: Gender; onChange: (value: Gender) => void }) {
  const options: { id: Gender; emoji: string; label: string; colorVar: string }[] = [
    { id: "girl", emoji: "👧", label: "Девочка", colorVar: "--mood" },
    { id: "neutral", emoji: "👶", label: "Не указано", colorVar: "--foreground" },
    { id: "boy", emoji: "👦", label: "Мальчик", colorVar: "--activity" },
  ];

  return (
    <StepSection className="max-w-2xl">
      <div className="space-y-8 text-center">
        <div className="space-y-3">
          <h2 className="text-3xl font-semibold text-foreground md:text-4xl">Кто у вас?</h2>
          <p className="text-sm leading-7 text-muted-foreground md:text-base">
            Это нужно только для более личной визуальной подачи и базовой персонализации профиля.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          {options.map((option, index) => {
            const active = value === option.id;
            return (
              <motion.button
                key={option.id}
                onClick={() => onChange(option.id)}
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.06 }}
                whileTap={{ scale: 0.96 }}
                className="text-left"
              >
                <LiquidSurface
                  tone={toneFromVar(option.colorVar)}
                  active={active}
                  ambientDelay={index * 0.22}
                  className="rounded-[28px]"
                  contentClassName="flex h-full flex-col items-center gap-4 rounded-[28px] px-5 py-7 text-center"
                  style={{
                    background: active ? hca(option.colorVar, 0.15) : "hsl(var(--muted))",
                    border: `1.5px solid ${active ? hc(option.colorVar) : "transparent"}`,
                    boxShadow: active ? `0 20px 48px -34px ${hca(option.colorVar, 0.85)}` : "none",
                  }}
                >
                  <span className="text-5xl">{option.emoji}</span>
                  <div>
                    <p className="text-base font-semibold text-foreground">{option.label}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{active ? "Выбрано" : "Выберите вариант"}</p>
                  </div>
                  <div className="flex h-6 w-6 items-center justify-center rounded-full" style={{ background: active ? hc(option.colorVar) : "hsl(var(--border))" }}>
                    <Check className="h-3.5 w-3.5 text-white" />
                  </div>
                </LiquidSurface>
              </motion.button>
            );
          })}
        </div>
      </div>
    </StepSection>
  );
}

function FeaturesStep({ value, onChange }: { value: string[]; onChange: (value: string[]) => void }) {
  const toggle = (id: string) => onChange(value.includes(id) ? value.filter((item) => item !== id) : [...value, id]);

  return (
    <StepSection className="max-w-4xl">
      <div className="space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-semibold text-foreground md:text-4xl">Что отслеживаем?</h2>
          <p className="mt-3 text-sm leading-7 text-muted-foreground md:text-base">
            Выберите разделы, которые реально нужны сейчас. Все остальное можно включить позже.
          </p>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          {FEATURE_OPTIONS.map((feature, index) => {
            const active = value.includes(feature.id);
            return (
              <motion.button
                key={feature.id}
                onClick={() => toggle(feature.id)}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                whileTap={{ scale: 0.98 }}
                className="text-left"
              >
                <LiquidSurface
                  tone={toneFromVar(feature.colorVar)}
                  active={active}
                  ambientDelay={index * 0.18}
                  className="rounded-[26px]"
                  contentClassName="flex items-center gap-4 rounded-[26px] p-4 md:p-5"
                  style={{
                    background: active ? hca(feature.colorVar, 0.12) : "hsl(var(--muted))",
                    border: `1.5px solid ${active ? hc(feature.colorVar) : "transparent"}`,
                  }}
                >
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-2xl" style={{ background: active ? hca(feature.colorVar, 0.18) : "hsl(var(--card))" }}>
                    {feature.emoji}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-foreground md:text-base">{feature.label}</p>
                    <p className="mt-1 text-xs leading-6 text-muted-foreground md:text-sm">{feature.desc}</p>
                  </div>
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full" style={{ background: active ? hc(feature.colorVar) : "hsl(var(--border))" }}>
                    <Check className="h-3.5 w-3.5 text-white" />
                  </div>
                </LiquidSurface>
              </motion.button>
            );
          })}
        </div>
      </div>
    </StepSection>
  );
}

function ReadyStep({ accentVar, name, onStart }: { accentVar: string; name: string; onStart: () => void }) {
  return (
    <StepSection className="max-w-2xl">
      <div className="space-y-8 text-center">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.4 }}
          className="mx-auto flex h-28 w-28 items-center justify-center rounded-[32px]"
          style={{
            background: `linear-gradient(145deg, ${hca(accentVar, 0.26)}, ${hca(accentVar, 0.08)})`,
            border: `1px solid ${hca(accentVar, 0.22)}`,
            boxShadow: `0 24px 56px -28px ${hca(accentVar, 0.8)}`,
          }}
        >
          <span className="text-6xl">🚀</span>
        </motion.div>

        <div className="space-y-3">
          <h2 className="text-3xl font-semibold text-foreground md:text-4xl">Все готово</h2>
          <p className="text-sm leading-7 text-muted-foreground md:text-base">
            {name ? `${name} уже ждет` : "Профиль малыша уже готов"}. Осталось открыть приложение и сделать первую запись.
          </p>
        </div>

        <div className="rounded-[28px] border p-5 text-left" style={{ background: hca(accentVar, 0.08), borderColor: hca(accentVar, 0.2) }}>
          <div className="space-y-3">
            {["Профиль создан", "Разделы трекинга выбраны", "Можно начинать вести день"].map((item, index) => (
              <motion.div
                key={item}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.15 + index * 0.08 }}
                className="flex items-center gap-3"
              >
                <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full" style={{ background: hc(accentVar) }}>
                  <Check className="h-3 w-3 text-white" />
                </div>
                <span className="text-sm font-medium text-foreground/85">{item}</span>
              </motion.div>
            ))}
          </div>
        </div>

        <motion.button
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.32 }}
          whileTap={{ scale: 0.96 }}
          onClick={onStart}
          className="mx-auto w-full max-w-sm"
        >
          <LiquidSurface
            tone={toneFromVar(accentVar)}
            ambientDelay={0.8}
            className="rounded-2xl"
            contentClassName="flex h-14 items-center justify-center gap-3 rounded-2xl text-base font-bold text-white"
            style={{
              background: `linear-gradient(135deg, ${hc(accentVar)}, ${hca(accentVar, 0.62)})`,
              boxShadow: `0 14px 36px -20px ${hca(accentVar, 0.9)}`,
            }}
          >
            <Sparkles className="h-5 w-5" />
            Начать
          </LiquidSurface>
        </motion.button>
      </div>
    </StepSection>
  );
}

const TOTAL_STEPS = 6;

export default function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [name, setName] = useState("");
  const [birth, setBirth] = useState("");
  const [gender, setGender] = useState<Gender>("neutral");
  const [features, setFeatures] = useState<string[]>(["sleep", "feeding", "diaper"]);
  const [confetti, setConfetti] = useState(false);

  const accentVar = STEP_ACCENT_VARS[step];
  const bgVar = STEP_BG_VARS[step];

  const canProceed = () => {
    if (step === 1) return name.trim().length > 0;
    if (step === 2) {
      if (!birth) return false;
      const current = new Date();
      const min = new Date("1990-01-01");
      const selected = new Date(birth);
      return selected >= min && selected <= current;
    }
    if (step === 4) return features.length > 0;
    return true;
  };

  const goBack = () => {
    if (step === 0) return;
    setDirection(-1);
    setStep((current) => current - 1);
  };

  const goNext = () => {
    if (step === TOTAL_STEPS - 1) {
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
      setOnboarded(true);
      saveBabyProfileState({
        name: name.trim() || "Малыш",
        birthDate: birth || "2024-09-15",
        gender,
        trackedFeatures: features,
      });
      setLastAppVisitAt(new Date().toISOString());
      setSessionRecapDismissedContext(`yesterday:${yesterday}`);
      setConfetti(true);
      window.setTimeout(() => navigate("/"), 1600);
      return;
    }

    setDirection(1);
    setStep((current) => current + 1);
  };

  const slideVariants = {
    enter: (value: number) => ({ x: value > 0 ? 80 : -80, opacity: 0 }),
    center: {
      x: 0,
      opacity: 1,
      transition: { duration: 0.32, ease: [0.22, 1, 0.36, 1] as const },
    },
    exit: (value: number) => ({
      x: value > 0 ? -56 : 56,
      opacity: 0,
      transition: { duration: 0.22, ease: "easeOut" as const },
    }),
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      <GlassFilter />
      <OnboardingBackground accentVar={accentVar} bgVar={bgVar} />
      {confetti ? <Confetti /> : null}

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 py-4 md:px-6 md:py-6 lg:flex-row lg:gap-6">
        <DesktopRail step={step} totalSteps={TOTAL_STEPS} accentVar={accentVar} />

        <main className="flex min-h-[calc(100svh-2rem)] flex-1 flex-col overflow-hidden rounded-[32px] border border-white/10 bg-card/72 shadow-[0_32px_100px_-48px_rgba(0,0,0,0.98)] backdrop-blur-2xl">
          <MobileHeader step={step} totalSteps={TOTAL_STEPS} accentVar={accentVar} onBack={goBack} />

          <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={step}
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                className="flex min-h-0 flex-1 flex-col overflow-y-auto"
              >
                {step === 0 ? <WelcomeStep accentVar={accentVar} /> : null}
                {step === 1 ? <NameStep accentVar={accentVar} value={name} onChange={setName} /> : null}
                {step === 2 ? <DateStep accentVar={accentVar} value={birth} onChange={setBirth} /> : null}
                {step === 3 ? <GenderStep value={gender} onChange={setGender} /> : null}
                {step === 4 ? <FeaturesStep value={features} onChange={setFeatures} /> : null}
                {step === 5 ? <ReadyStep accentVar={accentVar} name={name} onStart={goNext} /> : null}
              </motion.div>
            </AnimatePresence>
          </div>

          {step < TOTAL_STEPS - 1 ? (
            <div className="border-t border-white/8 px-4 py-4 md:px-8 md:py-5">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div className="hidden min-w-0 md:block">
                  <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-muted-foreground">
                    {STEP_META[step].eyebrow}
                  </p>
                  <p className="mt-1 text-sm text-foreground/75">{STEP_META[step].hint}</p>
                </div>

                <div className="flex items-center justify-end gap-3">
                  {step > 0 ? (
                    <motion.button whileTap={{ scale: 0.97 }} onClick={goBack} className="hidden md:block">
                      <LiquidSurface
                        tone="neutral"
                        ambientDelay={0.1}
                        className="rounded-2xl"
                        contentClassName="flex h-12 items-center gap-2 rounded-2xl bg-muted px-5 text-sm font-semibold text-foreground"
                      >
                        <ArrowLeft className="h-4 w-4 text-muted-foreground" />
                        Назад
                      </LiquidSurface>
                    </motion.button>
                  ) : null}

                  <motion.button
                    whileTap={{ scale: canProceed() ? 0.97 : 1 }}
                    onClick={goNext}
                    disabled={!canProceed()}
                    className="w-full md:w-auto"
                  >
                    <LiquidSurface
                      tone={toneFromVar(accentVar)}
                      ambientDelay={0.24}
                      className="rounded-2xl"
                      contentClassName={cn(
                        "flex h-12 items-center justify-center gap-2 rounded-2xl px-5 text-sm font-bold text-white transition-opacity md:min-w-[180px]",
                        !canProceed() && "opacity-60",
                      )}
                      style={{
                        background: canProceed()
                          ? `linear-gradient(135deg, ${hc(accentVar)}, ${hca(accentVar, 0.62)})`
                          : "hsl(var(--muted-foreground) / 0.35)",
                        boxShadow: canProceed() ? `0 14px 34px -20px ${hca(accentVar, 0.85)}` : "none",
                      }}
                    >
                      Далее
                      <ArrowRight className="h-4 w-4" />
                    </LiquidSurface>
                  </motion.button>
                </div>
              </div>
            </div>
          ) : null}
        </main>
      </div>
    </div>
  );
}
