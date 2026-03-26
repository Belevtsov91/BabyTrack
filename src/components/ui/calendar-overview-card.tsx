"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  ArrowRight,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Plus,
  Sparkles,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const DEFAULT_DAY_LABELS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

const hc = (value: string) => `hsl(var(${value}))`;
const hca = (value: string, alpha: number) => `hsl(var(${value}) / ${alpha})`;

function toYMD(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfWeek(year: number, month: number) {
  return (new Date(year, month, 1).getDay() + 6) % 7;
}

function formatDateLabel(date: string) {
  return new Date(`${date}T12:00:00`).toLocaleDateString("ru-RU", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

interface CalendarOverviewEvent {
  id: string;
  title: string;
  emoji: string;
  colorVar: string;
  date: string;
  detail?: string;
  kind?: string;
}

interface CalendarOverviewCardProps extends React.HTMLAttributes<HTMLDivElement> {
  year: number;
  month: number;
  monthLabel: string;
  selectedDate: string;
  events: CalendarOverviewEvent[];
  dayLabels?: string[];
  onSelectDate: (date: string) => void;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onJumpToday?: () => void;
  onAddEvent?: () => void;
  onOpenSelectedDay?: () => void;
}

function BentoCard({
  children,
  className,
  ...props
}: React.PropsWithChildren<React.HTMLAttributes<HTMLDivElement>>) {
  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-[30px] border border-white/10 bg-card/80 p-4 shadow-[0_28px_90px_-52px_rgba(0,0,0,0.95)] backdrop-blur-xl sm:p-5 md:p-6",
        className,
      )}
      {...props}
    >
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.05),transparent_38%,rgba(255,255,255,0.02))]" />
      <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100">
        <div className="absolute -right-12 -top-8 h-40 w-40 rounded-full blur-3xl" style={{ background: hca("--sleep", 0.18) }} />
        <div className="absolute -bottom-16 left-0 h-44 w-44 rounded-full blur-3xl" style={{ background: hca("--milestone", 0.18) }} />
      </div>
      <div className="relative z-[1]">{children}</div>
    </div>
  );
}

export function CalendarOverviewCard({
  year,
  month,
  monthLabel,
  selectedDate,
  events,
  dayLabels = DEFAULT_DAY_LABELS,
  onSelectDate,
  onPrevMonth,
  onNextMonth,
  onJumpToday,
  onAddEvent,
  onOpenSelectedDay,
  className,
  ...props
}: CalendarOverviewCardProps) {
  const today = toYMD(new Date());
  const monthPrefix = `${year}-${String(month + 1).padStart(2, "0")}-`;
  const monthEvents = React.useMemo(
    () => events.filter((event) => event.date.startsWith(monthPrefix)),
    [events, monthPrefix],
  );

  const eventsByDate = React.useMemo(() => {
    const map = new Map<string, CalendarOverviewEvent[]>();
    monthEvents.forEach((event) => {
      const next = map.get(event.date) ?? [];
      next.push(event);
      map.set(event.date, next);
    });
    return map;
  }, [monthEvents]);

  const selectedEvents = events.filter((event) => event.date === selectedDate);
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfWeek(year, month);
  const activeDays = eventsByDate.size;
  const busiestEntry = [...eventsByDate.entries()].sort((a, b) => b[1].length - a[1].length)[0];
  const cells = [...Array.from({ length: firstDay }, () => null), ...Array.from({ length: daysInMonth }, (_, index) => index + 1)];
  const rhythmStats = [
    { label: "Кормления", value: monthEvents.filter((event) => event.kind === "feeding").length, emoji: "🍼", colorVar: "--feeding" },
    { label: "Сны", value: monthEvents.filter((event) => event.kind === "sleep").length, emoji: "🌙", colorVar: "--sleep" },
    { label: "Подгузники", value: monthEvents.filter((event) => event.kind === "diaper").length, emoji: "👶", colorVar: "--diaper" },
  ];

  return (
    <BentoCard className={className} {...props}>
      <div className="grid gap-6 xl:grid-cols-[minmax(0,0.96fr)_minmax(320px,1.04fr)] xl:items-center">
        <div className="space-y-5">
          <div className="flex flex-wrap items-center gap-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/6 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/80">
              <Sparkles className="h-3.5 w-3.5" style={{ color: hc("--sleep") }} />
              <span>Обзор календаря</span>
            </div>
            <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-muted-foreground">
              {monthEvents.length} событий в месяце
            </span>
          </div>

          <div className="space-y-2">
            <h2 className="max-w-xl text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              Весь ритм малыша в одном календаре
            </h2>
            <p className="max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">
              Блок собран из реальных записей BabyTracker: видно активные дни, выбранную дату и быстрый вход в день без случайных подсветок и фейковых слотов.
            </p>
          </div>

          <div className="grid gap-2 sm:grid-cols-3">
            {[
              { label: "Активных дней", value: activeDays, colorVar: "--sleep", emoji: "🗓️" },
              { label: "На дату", value: selectedEvents.length, colorVar: "--milestone", emoji: "✨" },
              { label: "Всего событий", value: monthEvents.length, colorVar: "--activity", emoji: "📚" },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-2xl border border-white/10 bg-white/6 px-4 py-3"
              >
                <div className="flex items-center gap-2">
                  <span className="text-base">{item.emoji}</span>
                  <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                    {item.label}
                  </span>
                </div>
                <p className="mt-2 text-2xl font-semibold tracking-tight" style={{ color: hc(item.colorVar) }}>
                  {item.value}
                </p>
              </div>
            ))}
          </div>

          <div className="rounded-[26px] border border-white/10 bg-white/[0.04] p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                Ритм месяца
              </p>
              <span className="text-xs text-muted-foreground">
                Перенесено из старого month summary
              </span>
            </div>
            <div className="mt-3 grid gap-2 sm:grid-cols-3">
              {rhythmStats.map((item) => (
                <div
                  key={item.label}
                  className="rounded-2xl border px-3 py-3"
                  style={{ borderColor: hca(item.colorVar, 0.18), background: hca(item.colorVar, 0.08) }}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-base">{item.emoji}</span>
                    <span className="text-xs font-medium text-muted-foreground">{item.label}</span>
                  </div>
                  <p className="mt-2 text-xl font-semibold" style={{ color: hc(item.colorVar) }}>
                    {item.value}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[26px] border border-white/10 bg-black/10 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                  Выбранный день
                </p>
                <p className="mt-1 text-lg font-semibold text-foreground capitalize">
                  {formatDateLabel(selectedDate)}
                </p>
              </div>
              {busiestEntry ? (
                <div className="rounded-full border border-white/10 bg-white/6 px-3 py-1.5 text-xs font-medium text-muted-foreground">
                  Пик: {formatDateLabel(busiestEntry[0])} · {busiestEntry[1].length}
                </div>
              ) : null}
            </div>

            <div className="mt-4 flex flex-col gap-2">
              {selectedEvents.length > 0 ? (
                selectedEvents.slice(0, 4).map((event, index) => (
                  <motion.div
                    key={event.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-center gap-3 rounded-2xl border px-3 py-3"
                    style={{ borderColor: hca(event.colorVar, 0.2), background: hca(event.colorVar, 0.1) }}
                  >
                    <div
                      className="flex h-10 w-10 items-center justify-center rounded-2xl text-lg"
                      style={{ background: hca(event.colorVar, 0.16) }}
                    >
                      {event.emoji}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-foreground">{event.title}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {event.detail ?? "Запись дня"}
                      </p>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.03] px-4 py-5 text-sm text-muted-foreground">
                  На выбранную дату ещё нет событий. Можно быстро добавить запись или перейти к сегодняшнему дню.
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {onOpenSelectedDay ? (
              <Button onClick={onOpenSelectedDay} className="rounded-2xl">
                Открыть день
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            ) : null}
            {onAddEvent ? (
              <Button variant="secondary" onClick={onAddEvent} className="rounded-2xl">
                <Plus className="mr-2 h-4 w-4" />
                Добавить событие
              </Button>
            ) : null}
            {onJumpToday ? (
              <Button variant="ghost" onClick={onJumpToday} className="rounded-2xl text-muted-foreground">
                <CalendarDays className="mr-2 h-4 w-4" />
                Сегодня
              </Button>
            ) : null}
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          className="relative xl:pl-4"
        >
          <div className="pointer-events-none absolute -right-6 top-2 h-24 w-24 rounded-full blur-3xl" style={{ background: hca("--sleep", 0.18) }} />

          <div className="relative rounded-[28px] border border-white/10 bg-card p-3 shadow-[0_16px_44px_-30px_rgba(0,0,0,0.9)] sm:p-4">
            <div
              className="rounded-[24px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.01))] p-3 sm:p-4"
              style={{ boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04)" }}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                    Месяц
                  </p>
                  <p className="truncate text-lg font-semibold text-foreground">
                    {monthLabel}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={onPrevMonth}
                    className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-muted-foreground transition-colors hover:bg-white/[0.08]"
                    aria-label="Предыдущий месяц"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    onClick={onNextMonth}
                    className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-muted-foreground transition-colors hover:bg-white/[0.08]"
                    aria-label="Следующий месяц"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-7 gap-1.5 sm:gap-2">
                {dayLabels.map((day) => (
                  <div key={day} className="flex h-9 items-center justify-center">
                    <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground/70">
                      {day}
                    </span>
                  </div>
                ))}

                {cells.map((day, index) => {
                  if (!day) {
                    return <div key={`empty-${index}`} className="aspect-square min-h-[42px]" />;
                  }

                  const ymd = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                  const cellEvents = eventsByDate.get(ymd) ?? [];
                  const isSelected = ymd === selectedDate;
                  const isToday = ymd === today;
                  const primaryColorVar = cellEvents[0]?.colorVar ?? "--muted";

                  return (
                    <motion.button
                      key={ymd}
                      onClick={() => onSelectDate(ymd)}
                      whileTap={{ scale: 0.95 }}
                      className="relative flex aspect-square min-h-[42px] flex-col items-center justify-center overflow-hidden rounded-[18px] border text-center transition-all sm:min-h-[48px]"
                      style={{
                        borderColor: isSelected ? hca(primaryColorVar, 0.45) : isToday ? hca("--sleep", 0.35) : "rgba(255,255,255,0.04)",
                        background: isSelected
                          ? `linear-gradient(180deg, ${hca(primaryColorVar, 0.38)}, ${hca(primaryColorVar, 0.24)})`
                          : cellEvents.length > 0
                            ? hca(primaryColorVar, 0.12)
                            : "rgba(255,255,255,0.02)",
                        boxShadow: isSelected ? `0 0 16px ${hca(primaryColorVar, 0.28)}` : "none",
                      }}
                    >
                      <span className={cn("text-sm font-semibold", isSelected ? "text-white" : isToday ? "text-purple-300" : "text-foreground")}>
                        {day}
                      </span>

                      {cellEvents.length > 0 ? (
                        <div className="mt-1 flex items-center gap-1">
                          {cellEvents.slice(0, 3).map((event) => (
                            <span
                              key={event.id}
                              className="h-1.5 w-1.5 rounded-full"
                              style={{ background: hc(event.colorVar), opacity: isSelected ? 0.95 : 0.8 }}
                            />
                          ))}
                          {cellEvents.length > 3 ? (
                            <span className={cn("text-[8px] font-bold", isSelected ? "text-white/85" : "text-muted-foreground/80")}>
                              +{cellEvents.length - 3}
                            </span>
                          ) : null}
                        </div>
                      ) : null}
                    </motion.button>
                  );
                })}
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-2">
                <div className="rounded-full border border-white/10 bg-white/6 px-3 py-1.5 text-xs font-medium text-muted-foreground">
                  Активных дней: {activeDays}
                </div>
                <div className="rounded-full border border-white/10 bg-white/6 px-3 py-1.5 text-xs font-medium text-muted-foreground">
                  Выбрано: {selectedEvents.length}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </BentoCard>
  );
}

export default CalendarOverviewCard;
