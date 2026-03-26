"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, Sparkles } from "lucide-react";

import { cn } from "@/lib/utils";

export type CountdownMode = "auto" | "hms" | "dhm";

export interface CountdownState {
  targetTime: number | null;
  totalMs: number;
  isComplete: boolean;
  days: number;
  hours: number;
  totalHours: number;
  minutes: number;
  seconds: number;
}

export interface CountdownBannerProps extends React.HTMLAttributes<HTMLElement> {
  targetDate: Date | string | number | null | undefined;
  badge?: string;
  eyebrow?: string;
  title: string;
  description?: string;
  accent?: string;
  secondaryAccent?: string;
  mode?: CountdownMode;
  footer?: React.ReactNode;
  visual?: React.ReactNode | ((state: CountdownState) => React.ReactNode);
  completedTitle?: string;
  completedDescription?: string;
  icon?: React.ReactNode;
}

function toTimestamp(value: Date | string | number | null | undefined): number | null {
  if (value === null || value === undefined) return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value.getTime();
  const timestamp = new Date(value).getTime();
  return Number.isNaN(timestamp) ? null : timestamp;
}

export function getCountdownState(targetDate: Date | string | number | null | undefined, nowMs = Date.now()): CountdownState {
  const targetTime = toTimestamp(targetDate);
  const totalMs = targetTime ? Math.max(0, targetTime - nowMs) : 0;
  const totalSeconds = Math.floor(totalMs / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const totalHours = Math.floor(totalSeconds / 3600);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return {
    targetTime,
    totalMs,
    isComplete: !targetTime || totalMs <= 0,
    days,
    hours,
    totalHours,
    minutes,
    seconds,
  };
}

function useCountdown(targetDate: Date | string | number | null | undefined) {
  const [nowMs, setNowMs] = React.useState(() => Date.now());

  React.useEffect(() => {
    const interval = window.setInterval(() => setNowMs(Date.now()), 1000);
    return () => window.clearInterval(interval);
  }, []);

  return React.useMemo(() => getCountdownState(targetDate, nowMs), [targetDate, nowMs]);
}

function AnimatedDigit({ value }: { value: number }) {
  const display = String(value).padStart(2, "0");

  return (
    <div className="relative h-[1em] min-w-[1.6ch] overflow-hidden">
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={display}
          initial={{ y: "100%", opacity: 0 }}
          animate={{ y: "0%", opacity: 1 }}
          exit={{ y: "-100%", opacity: 0 }}
          transition={{ type: "spring", stiffness: 280, damping: 26 }}
          className="absolute inset-0 flex items-center justify-center"
        >
          {display}
        </motion.span>
      </AnimatePresence>
    </div>
  );
}

function TimeUnit({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex min-w-[74px] flex-col items-center gap-2 sm:min-w-[88px]">
      <div className="relative flex w-full items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-black/15 px-3 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] backdrop-blur-sm sm:px-4 sm:py-4">
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),transparent_50%)]" />
        <span className="relative z-[1] font-mono text-3xl font-semibold tracking-tight text-foreground sm:text-4xl md:text-5xl">
          <AnimatedDigit value={value} />
        </span>
      </div>
      <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
        {label}
      </span>
    </div>
  );
}

function unitsForMode(state: CountdownState, mode: CountdownMode) {
  const resolvedMode = mode === "auto" ? (state.days > 0 ? "dhm" : "hms") : mode;

  if (resolvedMode === "dhm") {
    return [
      { value: state.days, label: "Дни" },
      { value: state.hours, label: "Часы" },
      { value: state.minutes, label: "Мин" },
    ];
  }

  return [
    { value: state.totalHours, label: "Часы" },
    { value: state.minutes, label: "Мин" },
    { value: state.seconds, label: "Сек" },
  ];
}

export function CountdownBanner({
  targetDate,
  badge,
  eyebrow,
  title,
  description,
  accent = "hsl(var(--sleep))",
  secondaryAccent = "hsl(var(--milestone))",
  mode = "auto",
  footer,
  visual,
  completedTitle = "Событие уже наступило",
  completedDescription = "Отсчёт завершён.",
  icon,
  className,
  ...props
}: CountdownBannerProps) {
  const countdown = useCountdown(targetDate);
  const units = unitsForMode(countdown, mode);
  const visualNode = typeof visual === "function" ? visual(countdown) : visual;

  return (
    <section
      className={cn("relative overflow-hidden rounded-[30px] border border-white/10 bg-card/78 p-4 shadow-[0_28px_90px_-52px_rgba(0,0,0,0.95)] backdrop-blur-xl sm:p-5 md:p-6", className)}
      {...props}
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="absolute -left-12 -top-10 h-40 w-40 rounded-full blur-3xl"
          style={{ background: accent, opacity: 0.16 }}
        />
        <div
          className="absolute -bottom-14 right-0 h-44 w-44 rounded-full blur-3xl"
          style={{ background: secondaryAccent, opacity: 0.14 }}
        />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.045),transparent_42%)]" />
      </div>

      <div className={cn("relative z-[1] grid gap-6", visualNode && "md:grid-cols-[minmax(0,0.92fr)_minmax(220px,1.08fr)] md:items-center")}>
        <div className="space-y-5">
          {(badge || eyebrow) && (
            <div className="flex flex-wrap items-center gap-3">
              {badge ? (
                <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/6 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/80">
                  {icon ?? <Sparkles className="h-3.5 w-3.5" style={{ color: accent }} />}
                  <span>{badge}</span>
                </div>
              ) : null}

              {eyebrow ? (
                <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-muted-foreground">
                  {eyebrow}
                </span>
              ) : null}
            </div>
          )}

          <div className="space-y-2">
            <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              {countdown.isComplete ? completedTitle : title}
            </h2>
            <p className="max-w-xl text-sm leading-7 text-muted-foreground sm:text-base">
              {countdown.isComplete ? completedDescription : description}
            </p>
          </div>

          {!countdown.isComplete ? (
            <div className="flex flex-wrap items-start gap-2 sm:gap-3">
              {units.map((unit, index) => (
                <React.Fragment key={unit.label}>
                  <TimeUnit value={unit.value} label={unit.label} />
                  {index < units.length - 1 ? (
                    <div className="flex h-[76px] items-center pb-6 text-2xl font-light text-muted-foreground/40 sm:h-[88px] sm:text-3xl md:text-4xl">
                      :
                    </div>
                  ) : null}
                </React.Fragment>
              ))}
            </div>
          ) : (
            <div className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/6 px-4 py-3 text-sm font-semibold text-foreground">
              <Clock className="h-4 w-4" style={{ color: accent }} />
              Состояние обновлено
            </div>
          )}

          {footer ? <div className="pt-1">{footer}</div> : null}
        </div>

        {visualNode ? (
          <div className="flex items-center justify-center md:justify-end">
            {visualNode}
          </div>
        ) : null}
      </div>
    </section>
  );
}

export default CountdownBanner;
