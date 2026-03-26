import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { AppLayout } from "@/components/layout/AppLayout";
import CalendarOverviewCard from "@/components/ui/calendar-overview-card";
import { BabyEvent, eventsDB } from "@/lib/crud";

const hc = (v: string) => `hsl(var(${v}))`;
const hca = (v: string, a: number) => `hsl(var(${v}) / ${a})`;

type ViewMode = "week" | "day";

interface CalEvent {
  id: string;
  title: string;
  emoji: string;
  colorVar: string;
  date: string;
  startHour: number;
  durationMin: number;
  kind: "sleep" | "feeding" | "diaper" | "activity" | "health" | "other";
  route: string;
  timestamp: string;
  detail?: string;
}

const RU_DAYS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];
const RU_MONTHS = ["Январь", "Февраль", "Март", "Апрель", "Май", "Июнь", "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"];

function toYMD(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function getSubType(event: BabyEvent): string {
  return String(event.data?.eventSubType ?? event.data?.subType ?? "").toLowerCase();
}

function getKind(event: BabyEvent): CalEvent["kind"] {
  const sub = getSubType(event);
  if (event.type === "sleep") return "sleep";
  if (event.type === "feeding") return "feeding";
  if (event.type === "diaper") return "diaper";
  if (event.type === "temperature") return "health";
  if (event.type === "activity" && ["doctor", "vaccine", "medication", "weight", "height", "head"].includes(sub)) return "health";
  if (event.type === "activity" && ["walk", "bath"].includes(sub)) return "activity";
  return event.type === "mood" ? "other" : "activity";
}

function getColorVar(kind: CalEvent["kind"]): string {
  if (kind === "sleep") return "--sleep";
  if (kind === "feeding") return "--feeding";
  if (kind === "diaper") return "--diaper";
  if (kind === "health") return "--health";
  return "--activity";
}

function getEmoji(event: BabyEvent): string {
  const sub = getSubType(event);
  if (event.type === "sleep") return "🌙";
  if (event.type === "feeding") {
    if (sub === "breast") return "🤱";
    if (sub === "pump") return "🥛";
    if (sub === "solid") return "🥣";
    return "🍼";
  }
  if (event.type === "diaper") return "👶";
  if (event.type === "temperature") return "🌡️";
  if (sub === "doctor") return "🩺";
  if (sub === "vaccine") return "💉";
  if (sub === "medication") return "💊";
  if (sub === "weight") return "⚖️";
  if (sub === "height") return "📏";
  if (sub === "head") return "🔵";
  if (sub === "bath") return "🛁";
  if (sub === "walk") return "🚶";
  return "✨";
}

function getRoute(event: BabyEvent): string {
  const sub = getSubType(event);
  if (sub) return `/event/${sub}`;
  if (event.type === "temperature") return "/event/temperature";
  if (event.type === "sleep") return "/event/sleep";
  if (event.type === "feeding") return "/event/bottle";
  if (event.type === "diaper") return "/event/diaper";
  if (event.type === "activity") return "/event/walk";
  return "/add";
}

function getDuration(event: BabyEvent): number {
  if (typeof event.duration === "number" && event.duration > 0) return event.duration;
  const sub = getSubType(event);
  if (event.type === "sleep") return 90;
  if (event.type === "feeding") return sub === "breast" ? 20 : 15;
  if (event.type === "diaper") return 5;
  if (event.type === "temperature") return 4;
  if (event.type === "activity") {
    if (["doctor", "vaccine", "medication"].includes(sub)) return 15;
    if (["weight", "height", "head"].includes(sub)) return 8;
    if (sub === "bath") return 20;
    return 45;
  }
  return 15;
}

function formatDetail(event: BabyEvent): string | undefined {
  const sub = getSubType(event);
  if (typeof event.duration === "number" && event.duration > 0) return `${event.duration} мин`;
  const temp = Number(event.data?.temperature ?? event.data?.value ?? event.data?.amount);
  if (Number.isFinite(temp) && (event.type === "temperature" || sub === "temperature")) return `${temp.toFixed(1)}°`;
  if (event.data?.amount) return `${event.data.amount} ${event.data.unit ?? "мл"}`;
  if (event.data?.diaperType) {
    const map: Record<string, string> = { wet: "Мокрый", dirty: "Грязный", mixed: "Смешанный" };
    return map[event.data.diaperType] ?? event.data.diaperType;
  }
  return event.description;
}

function formatClock(timestamp: string): string {
  const date = new Date(timestamp);
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

function normalizeEvents(events: BabyEvent[]): CalEvent[] {
  return events
    .slice()
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
    .map((event) => {
      const date = new Date(event.timestamp);
      return {
        id: event.id,
        title: event.title,
        emoji: getEmoji(event),
        colorVar: getColorVar(getKind(event)),
        date: toYMD(date),
        startHour: date.getHours() + date.getMinutes() / 60,
        durationMin: getDuration(event),
        kind: getKind(event),
        route: getRoute(event),
        timestamp: event.timestamp,
        detail: formatDetail(event),
      };
    });
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfWeek(year: number, month: number): number {
  return (new Date(year, month, 1).getDay() + 6) % 7;
}

function WeekStrip({ selectedDate, events, onSelect }: { selectedDate: string; events: CalEvent[]; onSelect: (date: string) => void }) {
  const selected = new Date(selectedDate);
  const monday = new Date(selected);
  monday.setDate(selected.getDate() - ((selected.getDay() + 6) % 7));
  const week = Array.from({ length: 7 }, (_, index) => {
    const day = new Date(monday);
    day.setDate(monday.getDate() + index);
    return day;
  });
  const countByDay = useMemo(() => {
    const map: Record<string, number> = {};
    events.forEach((event) => {
      map[event.date] = (map[event.date] ?? 0) + 1;
    });
    return map;
  }, [events]);
  const today = toYMD(new Date());

  return (
    <div className="rounded-3xl p-3" style={{ background: hc("--card"), border: `1px solid ${hc("--border")}` }}>
      <div className="flex gap-1">
        {week.map((day, index) => {
          const ymd = toYMD(day);
          const count = countByDay[ymd] ?? 0;
          const isSelected = ymd === selectedDate;
          const isToday = ymd === today;

          return (
            <motion.button
              key={ymd}
              onClick={() => onSelect(ymd)}
              whileTap={{ scale: 0.88 }}
              className="flex-1 flex flex-col items-center gap-1.5 py-2.5 rounded-2xl transition-all"
              style={isSelected ? { background: hc("--sleep"), boxShadow: `0 0 12px ${hca("--sleep", 0.3)}` } : isToday ? { background: hca("--sleep", 0.12) } : { background: "transparent" }}
            >
              <span className={cn("text-[9px] font-bold", isSelected ? "text-white/80" : "text-muted-foreground")}>{RU_DAYS[index]}</span>
              <span className={cn("text-sm font-bold", isSelected ? "text-white" : isToday ? "text-purple-400" : "text-foreground")}>{day.getDate()}</span>
              {count > 0 && (
                <div className="flex gap-0.5">
                  {Array.from({ length: Math.min(count, 3) }).map((_, dot) => (
                    <div key={dot} className="w-1 h-1 rounded-full" style={{ backgroundColor: isSelected ? "white" : hc("--sleep"), opacity: 0.7 }} />
                  ))}
                </div>
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

function DayTimeline({
  date,
  events,
  onAddEvent,
  onOpenEvent,
}: {
  date: string;
  events: CalEvent[];
  onAddEvent: () => void;
  onOpenEvent: (route: string) => void;
}) {
  const HOUR_H = 52;
  const START_H = 6;
  const HOURS = 18;
  const hours = Array.from({ length: HOURS }, (_, index) => START_H + index);
  const dayEvents = events.filter((event) => event.date === date).sort((a, b) => a.timestamp.localeCompare(b.timestamp));
  const now = new Date();
  const nowH = now.getHours() + now.getMinutes() / 60;
  const nowY = (nowH - START_H) * HOUR_H;
  const isToday = date === toYMD(now);

  return (
    <div className="rounded-3xl overflow-hidden" style={{ background: hc("--card"), border: `1px solid ${hc("--border")}` }}>
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
          ⏱ {new Date(`${date}T12:00`).toLocaleDateString("ru-RU", { weekday: "long", day: "numeric", month: "long" })}
        </p>
        <motion.button whileTap={{ scale: 0.88 }} onClick={onAddEvent} className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold" style={{ background: hca("--sleep", 0.2), color: hc("--sleep") }}>
          <Plus className="w-3.5 h-3.5" /> Добавить
        </motion.button>
      </div>

      <div className="overflow-y-auto max-h-72 px-3 pb-4">
        <div className="relative" style={{ height: HOURS * HOUR_H }}>
          {hours.map((hour) => (
            <div key={hour} className="absolute left-0 right-0 flex items-start" style={{ top: (hour - START_H) * HOUR_H }}>
              <span className="text-[9px] text-muted-foreground/50 w-8 shrink-0 -mt-2 text-right pr-2">{hour}:00</span>
              <div className="flex-1 h-px bg-white/[0.04]" />
            </div>
          ))}

          {isToday && nowY >= 0 && nowY <= HOURS * HOUR_H && (
            <motion.div className="absolute left-8 right-0 flex items-center gap-1" style={{ top: nowY - 1 }} animate={{ opacity: [1, 0.5, 1] }} transition={{ duration: 2, repeat: Infinity }}>
              <div className="w-2 h-2 rounded-full bg-red-400 shrink-0" />
              <div className="flex-1 h-px bg-red-400" />
              <span className="text-[9px] text-red-400 shrink-0">
                {now.getHours()}:{String(now.getMinutes()).padStart(2, "0")}
              </span>
            </motion.div>
          )}

          {dayEvents.map((event, index) => {
            const top = (event.startHour - START_H) * HOUR_H;
            const height = Math.max((event.durationMin / 60) * HOUR_H, 24);
            if (top < 0 || top > HOURS * HOUR_H) return null;

            return (
              <motion.button
                key={event.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.04, type: "spring" }}
                className="absolute left-10 right-1 rounded-xl px-3 py-1.5 flex items-center gap-2 overflow-hidden cursor-pointer text-left"
                style={{ top, height, background: hca(event.colorVar, 0.15), border: `1px solid ${hca(event.colorVar, 0.31)}` }}
                whileTap={{ scale: 0.97 }}
                onClick={() => onOpenEvent(event.route)}
              >
                <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl" style={{ background: hc(event.colorVar) }} />
                <span className="text-sm ml-1">{event.emoji}</span>
                {height >= 30 && (
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-foreground truncate">{event.title}</p>
                    {height >= 44 && <p className="text-[9px] text-muted-foreground">{formatClock(event.timestamp)} · {event.detail ?? `${event.durationMin}м`}</p>}
                  </div>
                )}
              </motion.button>
            );
          })}
        </div>
      </div>

      {dayEvents.length === 0 && <div className="text-center py-8 text-muted-foreground text-sm">Нет событий</div>}
    </div>
  );
}

export default function Calendar() {
  const navigate = useNavigate();
  const today = new Date();
  const todayKey = toYMD(today);
  const [view, setView] = useState<ViewMode>("day");
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [selected, setSelected] = useState(todayKey);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const sync = () => setRefreshKey((value) => value + 1);
    sync();
    const timer = window.setInterval(sync, 2500);
    window.addEventListener("focus", sync);
    window.addEventListener("storage", sync);
    document.addEventListener("visibilitychange", sync);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("focus", sync);
      window.removeEventListener("storage", sync);
      document.removeEventListener("visibilitychange", sync);
    };
  }, []);

  const events = useMemo(() => {
    void refreshKey;
    return normalizeEvents(eventsDB.getAll());
  }, [refreshKey]);
  const monthEvents = useMemo(() => events.filter((event) => {
    const [eventYear, eventMonth] = event.date.split("-").map(Number);
    return eventYear === year && eventMonth === month + 1;
  }), [events, year, month]);

  useEffect(() => {
    const selectedDate = new Date(`${selected}T12:00:00`);
    if (Number.isNaN(selectedDate.getTime())) return;
    if (selectedDate.getFullYear() !== year || selectedDate.getMonth() !== month) {
      setYear(selectedDate.getFullYear());
      setMonth(selectedDate.getMonth());
    }
  }, [selected, year, month]);

  const setMonthAndSelection = (nextYear: number, nextMonth: number) => {
    const selectedDate = new Date(`${selected}T12:00:00`);
    const selectedDay = Number.isNaN(selectedDate.getTime()) ? 1 : selectedDate.getDate();
    const nextDay = Math.min(selectedDay, getDaysInMonth(nextYear, nextMonth));
    const nextSelected = toYMD(new Date(nextYear, nextMonth, nextDay));
    setYear(nextYear);
    setMonth(nextMonth);
    setSelected(nextSelected);
  };

  const handlePrevMonth = () => {
    if (month === 0) {
      setMonthAndSelection(year - 1, 11);
    } else {
      setMonthAndSelection(year, month - 1);
    }
  };

  const handleNextMonth = () => {
    if (month === 11) {
      setMonthAndSelection(year + 1, 0);
    } else {
      setMonthAndSelection(year, month + 1);
    }
  };

  return (
    <AppLayout>
      <div className="flex flex-col gap-4 pt-safe pb-10 xl:max-w-5xl xl:mx-auto">
        <motion.header initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="px-4 md:px-6 pt-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Календарь</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {monthEvents.length} событий в {RU_MONTHS[month].toLowerCase()}
            </p>
          </div>
          <motion.button whileTap={{ scale: 0.88 }} onClick={() => navigate("/add")} className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: hca("--sleep", 0.20) }}>
            <Plus className="w-5 h-5 text-purple-400" />
          </motion.button>
        </motion.header>

        <div className="px-4 md:px-6">
          <CalendarOverviewCard
            year={year}
            month={month}
            monthLabel={`${RU_MONTHS[month]} ${year}`}
            selectedDate={selected}
            events={events}
            onSelectDate={(date) => {
              setSelected(date);
              setView("day");
            }}
            onPrevMonth={handlePrevMonth}
            onNextMonth={handleNextMonth}
            onJumpToday={() => {
              setSelected(todayKey);
              setYear(today.getFullYear());
              setMonth(today.getMonth());
              setView("day");
            }}
            onAddEvent={() => navigate("/add")}
            onOpenSelectedDay={() => setView("day")}
          />
        </div>

        <div className="px-4 md:px-6">
          <div className="flex p-1 rounded-2xl" style={{ background: hc("--background"), border: `1px solid ${hc("--border")}` }}>
            {(["week", "day"] as ViewMode[]).map((item) => (
              <button
                key={item}
                onClick={() => setView(item)}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all"
                style={view === item ? { background: `linear-gradient(135deg, ${hc("--sleep")}, ${hc("--milestone")})`, color: "white" } : { color: hc("--muted-foreground") }}
              >
                {{ week: "Неделя", day: "День" }[item]}
              </button>
            ))}
          </div>
        </div>

        <AnimatePresence mode="wait">
          {view === "week" && (
            <motion.div key="week" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex flex-col gap-4">
              <div className="px-4 md:px-6">
                <WeekStrip selectedDate={selected} events={events} onSelect={(date) => { setSelected(date); setView("day"); }} />
              </div>
              <div className="px-4 md:px-6">
                <DayTimeline date={selected} events={events} onAddEvent={() => navigate("/add")} onOpenEvent={(route) => navigate(route)} />
              </div>
            </motion.div>
          )}

          {view === "day" && (
            <motion.div key="day" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex flex-col gap-4">
              <div className="px-4 md:px-6">
                <WeekStrip selectedDate={selected} events={events} onSelect={setSelected} />
              </div>
              <div className="px-4 md:px-6">
                <DayTimeline date={selected} events={events} onAddEvent={() => navigate("/add")} onOpenEvent={(route) => navigate(route)} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AppLayout>
  );
}
