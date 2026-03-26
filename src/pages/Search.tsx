import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X, Clock, ArrowUpRight, Mic } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import AnimatedGlowingSearchBar from "@/components/ui/animated-glowing-search-bar";
import {
  allergensDB,
  eventsDB,
  getEventSubType,
  milestonesDB,
  photosDB,
  temperatureDB,
  vaccinationsDB,
  type BabyEvent,
} from "@/lib/crud";
import { getBabyProfileState } from "@/lib/appStorage";

type SearchCategory =
  | "all"
  | "page"
  | "sleep"
  | "feeding"
  | "diaper"
  | "health"
  | "growth"
  | "milestone"
  | "media"
  | "profile";

interface SearchItem {
  id: string;
  type: SearchCategory;
  emoji: string;
  title: string;
  desc: string;
  date: string;
  color: string;
  route: string;
  keywords: string;
}

const CATEGORIES: { id: SearchCategory; label: string; emoji: string; color: string }[] = [
  { id: "all",       label: "Все",         emoji: "⭐",  color: "--milestone" },
  { id: "page",      label: "Страницы",    emoji: "🧭", color: "--activity"  },
  { id: "sleep",     label: "Сон",         emoji: "🌙", color: "--sleep"     },
  { id: "feeding",   label: "Кормление",   emoji: "🍼", color: "--feeding"   },
  { id: "diaper",    label: "Подгузник",   emoji: "👶", color: "--diaper"    },
  { id: "health",    label: "Здоровье",    emoji: "🏥", color: "--health"    },
  { id: "growth",    label: "Рост",        emoji: "📏", color: "--activity"  },
  { id: "milestone", label: "Достижения",  emoji: "🏆", color: "--mood"      },
  { id: "media",     label: "Медиа",       emoji: "📸", color: "--sleep"     },
  { id: "profile",   label: "Профиль",     emoji: "🪪", color: "--growth"    },
];

const RECENT = ["Температура", "Календарь", "Прививки", "Профиль", "Фото"];
const SUGGESTS = ["Последние события", "Температура за неделю", "Открыть календарь", "Прививки", "Фотодневник"];

const EVENT_META: Record<string, { emoji: string; color: string; type: SearchCategory; route: string }> = {
  sleep:       { emoji: "🌙", color: "--sleep",     type: "sleep",     route: "/event/sleep" },
  breast:      { emoji: "🤱", color: "--feeding",   type: "feeding",   route: "/event/breast" },
  bottle:      { emoji: "🍼", color: "--feeding",   type: "feeding",   route: "/event/bottle" },
  solid:       { emoji: "🥣", color: "--feeding",   type: "feeding",   route: "/event/solid" },
  pump:        { emoji: "🥛", color: "--feeding",   type: "feeding",   route: "/event/pump" },
  diaper:      { emoji: "👶", color: "--diaper",    type: "diaper",    route: "/event/diaper" },
  walk:        { emoji: "🚶", color: "--activity",  type: "health",    route: "/calendar" },
  bath:        { emoji: "🛁", color: "--activity",  type: "health",    route: "/calendar" },
  weight:      { emoji: "⚖️", color: "--growth",    type: "growth",    route: "/growth" },
  height:      { emoji: "📏", color: "--growth",    type: "growth",    route: "/growth" },
  head:        { emoji: "🔵", color: "--growth",    type: "growth",    route: "/growth" },
  temperature: { emoji: "🌡️", color: "--health",    type: "health",    route: "/temperature" },
  doctor:      { emoji: "👨‍⚕️", color: "--health",   type: "health",    route: "/doctor-visits" },
  vaccine:     { emoji: "💉", color: "--health",    type: "health",    route: "/vaccinations" },
  medication:  { emoji: "💊", color: "--health",    type: "health",    route: "/medications" },
  mood:        { emoji: "😊", color: "--mood",      type: "health",    route: "/event/mood" },
  milestone:   { emoji: "🏆", color: "--milestone", type: "milestone", route: "/milestones" },
};

function formatDateLabel(isoLike: string): string {
  const date = new Date(isoLike);
  if (Number.isNaN(date.getTime())) return isoLike;

  return date.toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "short",
  });
}

function buildEventDescription(event: BabyEvent): string {
  const data = event.data ?? {};
  if (typeof event.duration === "number" && event.duration > 0) return `${event.duration} мин`;
  if (typeof data.amount === "number") return `${data.amount} ${typeof data.unit === "string" ? data.unit : "мл"}`;
  if (typeof data.temperature === "number") return `${data.temperature.toFixed(1)}°C`;
  if (typeof data.vaccineName === "string" && data.vaccineName) return data.vaccineName;
  if (typeof data.medName === "string" && data.medName) return `${data.medName}${data.medDose ? ` · ${String(data.medDose)}` : ""}`;
  if (typeof data.doctorName === "string" && data.doctorName) {
    return `${data.doctorName}${data.specialty ? ` · ${String(data.specialty)}` : ""}`;
  }
  if (typeof event.description === "string" && event.description.trim()) return event.description.trim();
  return event.title;
}

function mapEventToSearchItem(event: BabyEvent): SearchItem {
  const subType = getEventSubType(event) || event.type;
  const meta = EVENT_META[subType] ?? EVENT_META[event.type] ?? EVENT_META.milestone;

  return {
    id: `event-${event.id}`,
    type: meta.type,
    emoji: meta.emoji,
    title: event.title,
    desc: buildEventDescription(event),
    date: formatDateLabel(event.timestamp),
    color: meta.color,
    route: meta.route,
    keywords: [event.title, event.description, subType, JSON.stringify(event.data ?? {})].filter(Boolean).join(" ").toLowerCase(),
  };
}

function buildSearchIndex(): SearchItem[] {
  const profile = getBabyProfileState();

  const pages: SearchItem[] = [
    {
      id: "page-home",
      type: "page",
      emoji: "🏠",
      title: "Главная",
      desc: "Быстрые действия и дневной обзор",
      date: "Экран",
      color: "--sleep",
      route: "/",
      keywords: "главная home дневник обзор быстрые действия",
    },
    {
      id: "page-stats",
      type: "page",
      emoji: "📊",
      title: "Статистика",
      desc: "Аналитика и паттерны",
      date: "Экран",
      color: "--activity",
      route: "/stats",
      keywords: "статистика аналитика графики паттерны",
    },
    {
      id: "page-calendar",
      type: "page",
      emoji: "📅",
      title: "Календарь",
      desc: "Месяц, неделя и день событий",
      date: "Экран",
      color: "--activity",
      route: "/calendar",
      keywords: "календарь события неделя день месяц",
    },
    {
      id: "page-settings",
      type: "page",
      emoji: "⚙️",
      title: "Настройки",
      desc: "Тема, язык, экспорт и параметры",
      date: "Экран",
      color: "--mood",
      route: "/settings",
      keywords: "настройки тема язык экспорт импорт синхронизация",
    },
    {
      id: "page-profile",
      type: "profile",
      emoji: "🪪",
      title: profile.name,
      desc: "Профиль малыша",
      date: "Профиль",
      color: "--growth",
      route: "/baby-profile",
      keywords: `${profile.name} профиль малыш ребенок ${profile.birthDate}`.toLowerCase(),
    },
    {
      id: "page-photos",
      type: "media",
      emoji: "📸",
      title: "Фотодневник",
      desc: "Лента и папки воспоминаний",
      date: "Экран",
      color: "--sleep",
      route: "/photos",
      keywords: "фото фотодневник медиа воспоминания",
    },
    {
      id: "page-chat",
      type: "page",
      emoji: "💬",
      title: "Чат",
      desc: "Семейные комнаты и переписка",
      date: "Экран",
      color: "--sleep",
      route: "/chat",
      keywords: "чат сообщения семья doctor social",
    },
    {
      id: "page-reminders",
      type: "page",
      emoji: "🔔",
      title: "Напоминания",
      desc: "Расписание и повторы",
      date: "Экран",
      color: "--diaper",
      route: "/reminders",
      keywords: "напоминания будильник schedule reminders",
    },
    {
      id: "page-favorites",
      type: "page",
      emoji: "⭐",
      title: "Быстрые действия",
      desc: "Ярлыки на главной",
      date: "Экран",
      color: "--milestone",
      route: "/favorites",
      keywords: "избранное быстрые действия ярлыки favorites",
    },
    {
      id: "page-temperature",
      type: "health",
      emoji: "🌡️",
      title: "Температура",
      desc: "Замеры и динамика",
      date: "Экран",
      color: "--health",
      route: "/temperature",
      keywords: "температура fever health",
    },
    {
      id: "page-vaccinations",
      type: "health",
      emoji: "💉",
      title: "Прививки",
      desc: "Календарь вакцинации",
      date: "Экран",
      color: "--health",
      route: "/vaccinations",
      keywords: "прививки вакцинация vaccines",
    },
    {
      id: "page-growth",
      type: "growth",
      emoji: "📏",
      title: "Рост и вес",
      desc: "Графики роста ВОЗ",
      date: "Экран",
      color: "--growth",
      route: "/growth",
      keywords: "рост вес графики growth",
    },
    {
      id: "page-allergens",
      type: "health",
      emoji: "⚠️",
      title: "Аллергены",
      desc: "Пищевые реакции и наблюдения",
      date: "Экран",
      color: "--health",
      route: "/allergens",
      keywords: "аллергия аллерген food reaction",
    },
    {
      id: "page-medications",
      type: "health",
      emoji: "💊",
      title: "Лекарства",
      desc: "Прием и история препаратов",
      date: "Экран",
      color: "--health",
      route: "/medications",
      keywords: "лекарства препараты medicine meds",
    },
    {
      id: "page-doctor",
      type: "health",
      emoji: "🩺",
      title: "Чат с педиатром",
      desc: "Сообщения и вложения",
      date: "Экран",
      color: "--health",
      route: "/doctor",
      keywords: "врач доктор pediatric chat",
    },
    {
      id: "page-doctor-visits",
      type: "health",
      emoji: "👨‍⚕️",
      title: "Визиты к врачу",
      desc: "Приемы и назначения",
      date: "Экран",
      color: "--health",
      route: "/doctor-visits",
      keywords: "визиты врач appointments clinic",
    },
    {
      id: "page-report",
      type: "media",
      emoji: "📄",
      title: "PDF отчёт",
      desc: "Экспорт данных и печать",
      date: "Экран",
      color: "--health",
      route: "/report",
      keywords: "pdf отчет export print",
    },
    {
      id: "page-recap",
      type: "media",
      emoji: "✨",
      title: "Итог года",
      desc: "Подборка важных моментов",
      date: "Экран",
      color: "--mood",
      route: "/recap",
      keywords: "recap итог года memories highlights",
    },
    {
      id: "page-milestones",
      type: "milestone",
      emoji: "🏆",
      title: "Достижения",
      desc: "Этапы развития малыша",
      date: "Экран",
      color: "--milestone",
      route: "/milestones",
      keywords: "milestones достижения развитие",
    },
  ];

  const eventItems = eventsDB.getAll().slice(0, 120).map(mapEventToSearchItem);

  const milestoneItems: SearchItem[] = milestonesDB.getAll().map((item) => ({
    id: `milestone-${item.id}`,
    type: "milestone",
    emoji: item.emoji,
    title: item.title,
    desc: item.completed ? "Достижение отмечено" : "Ещё не отмечено",
    date: item.date ? formatDateLabel(item.date) : "Веха",
    color: "--milestone",
    route: "/milestones",
    keywords: `${item.title} ${item.category} ${item.completed ? "готово" : "план"}`.toLowerCase(),
  }));

  const vaccinationItems: SearchItem[] = vaccinationsDB.getAll().map((item) => ({
    id: `vaccine-${item.id}`,
    type: "health",
    emoji: "💉",
    title: item.name,
    desc: item.status === "completed" ? "Прививка выполнена" : "Ожидает выполнения",
    date: formatDateLabel(item.completedDate || item.scheduledDate),
    color: "--health",
    route: "/vaccinations",
    keywords: `${item.name} прививка вакцина ${item.notes ?? ""}`.toLowerCase(),
  }));

  const temperatureItems: SearchItem[] = temperatureDB.getAll().map((item) => ({
    id: `temperature-${item.id}`,
    type: "health",
    emoji: "🌡️",
    title: "Температура",
    desc: `${item.value.toFixed(1)}°C${item.notes ? ` · ${item.notes}` : ""}`,
    date: formatDateLabel(item.timestamp),
    color: "--health",
    route: "/temperature",
    keywords: `температура ${item.value} ${item.notes ?? ""}`.toLowerCase(),
  }));

  const allergenItems: SearchItem[] = allergensDB.getAll().map((item) => ({
    id: `allergen-${item.id}`,
    type: "health",
    emoji: "⚠️",
    title: item.food,
    desc: item.notes || `Реакция: ${item.reaction}`,
    date: formatDateLabel(item.date),
    color: "--health",
    route: "/allergens",
    keywords: `${item.food} аллерген ${item.reaction} ${item.notes ?? ""}`.toLowerCase(),
  }));

  const photoItems: SearchItem[] = photosDB.getAll().map((item) => ({
    id: `photo-${item.id}`,
    type: "media",
    emoji: "📸",
    title: item.caption || "Фото",
    desc: item.tags?.join(", ") || "Запись в фотодневнике",
    date: formatDateLabel(item.timestamp),
    color: "--sleep",
    route: "/photos",
    keywords: `${item.caption ?? ""} ${item.tags?.join(" ") ?? ""} фото`.toLowerCase(),
  }));

  return [
    ...pages,
    ...eventItems,
    ...milestoneItems,
    ...vaccinationItems,
    ...temperatureItems,
    ...allergenItems,
    ...photoItems,
  ];
}

function Highlight({ text, query }: { text: string; query: string }) {
  if (!query) return <span>{text}</span>;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return <span>{text}</span>;
  return (
    <span>
      {text.slice(0, idx)}
      <mark className="bg-transparent font-bold" style={{ color: "hsl(var(--milestone))" }}>
        {text.slice(idx, idx + query.length)}
      </mark>
      {text.slice(idx + query.length)}
    </span>
  );
}

function ResultCard({
  item,
  query,
  index,
  onOpen,
}: {
  item: SearchItem;
  query: string;
  index: number;
  onOpen: (item: SearchItem) => void;
}) {
  return (
    <motion.button
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ delay: index * 0.04 }}
      className="w-full flex items-center gap-3 p-4 rounded-2xl cursor-pointer text-left"
      style={{ background: `hsl(var(${item.color}) / 0.08)`, border: `1px solid hsl(var(${item.color}) / 0.20)` }}
      whileTap={{ scale: 0.97 }}
      onClick={() => onOpen(item)}
    >
      <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-xl shrink-0" style={{ background: `hsl(var(${item.color}) / 0.15)` }}>
        {item.emoji}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground">
          <Highlight text={item.title} query={query} />
        </p>
        <p className="text-xs text-muted-foreground mt-0.5 truncate">{item.desc}</p>
      </div>
      <div className="flex flex-col items-end shrink-0 gap-1">
        <span className="text-[10px] text-muted-foreground">{item.date}</span>
        <ArrowUpRight className="w-3.5 h-3.5 text-muted-foreground/40" />
      </div>
    </motion.button>
  );
}

export default function SearchPage() {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [rawQuery, setRawQuery] = useState("");
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState<SearchCategory>("all");
  const [recents, setRecents] = useState(RECENT);
  const [refreshKey, setRefreshKey] = useState(0);

  const searchIndex = useMemo(() => {
    void refreshKey;
    return buildSearchIndex();
  }, [refreshKey]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => () => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
  }, []);

  useEffect(() => {
    const sync = () => setRefreshKey((value) => value + 1);
    window.addEventListener("storage", sync);
    window.addEventListener("focus", sync);
    document.addEventListener("visibilitychange", sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener("focus", sync);
      document.removeEventListener("visibilitychange", sync);
    };
  }, []);

  const handleSearch = useCallback((nextQuery: string) => {
    setRawQuery(nextQuery);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setQuery(nextQuery);
      if (nextQuery.trim() && !recents.includes(nextQuery.trim())) {
        setRecents((prev) => [nextQuery.trim(), ...prev].slice(0, 6));
      }
    }, 250);
  }, [recents]);

  const filtered = useMemo(() => searchIndex.filter((item) => {
    const matchCat = cat === "all" || item.type === cat;
    const normalizedQuery = query.trim().toLowerCase();
    const haystack = `${item.title} ${item.desc} ${item.keywords}`.toLowerCase();
    const matchQuery = !normalizedQuery || haystack.includes(normalizedQuery);
    return matchCat && matchQuery;
  }), [cat, query, searchIndex]);

  const accentVar = CATEGORIES.find((item) => item.id === cat)?.color ?? "--primary";

  const openResult = (item: SearchItem) => {
    if (!recents.includes(item.title)) {
      setRecents((prev) => [item.title, ...prev].slice(0, 6));
    }
    navigate(item.route);
  };

  return (
    <AppLayout>
      <div className="flex flex-col gap-4 pt-safe pb-10">
        <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="px-4 md:px-6 pt-4">
          <AnimatedGlowingSearchBar
            ref={inputRef}
            value={rawQuery}
            onValueChange={handleSearch}
            accentVar={accentVar}
            type="search"
            autoComplete="off"
            spellCheck={false}
            placeholder="Поиск по страницам и данным..."
            trailing={
              <AnimatePresence mode="wait" initial={false}>
                {rawQuery ? (
                  <motion.button
                    key="clear"
                    initial={{ opacity: 0, scale: 0.86, rotate: -12 }}
                    animate={{ opacity: 1, scale: 1, rotate: 0 }}
                    exit={{ opacity: 0, scale: 0.86, rotate: 10 }}
                    whileTap={{ scale: 0.92 }}
                    onClick={() => {
                      setRawQuery("");
                      setQuery("");
                    }}
                    className="relative flex h-11 w-11 items-center justify-center overflow-hidden rounded-[16px] border border-white/10 bg-black/25 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]"
                    aria-label="Очистить поиск"
                  >
                    <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,hsl(var(--health)/0.22),transparent_70%)]" />
                    <X className="relative z-[1] h-4.5 w-4.5 text-white/80" />
                  </motion.button>
                ) : (
                  <motion.button
                    key="mic"
                    initial={{ opacity: 0, scale: 0.86, rotate: 10 }}
                    animate={{ opacity: 1, scale: 1, rotate: 0 }}
                    exit={{ opacity: 0, scale: 0.86, rotate: -8 }}
                    whileTap={{ scale: 0.92 }}
                    onClick={() => handleSearch("Последние события")}
                    className="relative flex h-11 w-11 items-center justify-center overflow-hidden rounded-[16px] border border-white/10 bg-black/25 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]"
                    aria-label="Подставить запрос"
                  >
                    <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,hsl(var(--milestone)/0.25),transparent_70%)]" />
                    <Mic className="relative z-[1] h-4.5 w-4.5 text-white/80" />
                  </motion.button>
                )}
              </AnimatePresence>
            }
          />
        </motion.div>

        <div className="flex gap-2 px-4 overflow-x-auto scrollbar-hide pb-1">
          {CATEGORIES.map((item, index) => (
            <motion.button
              key={item.id}
              onClick={() => setCat(item.id)}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.04 }}
              whileTap={{ scale: 0.88 }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-2xl shrink-0 transition-all"
              style={cat === item.id
                ? { background: `hsl(var(${item.color}) / 0.16)`, border: `1.5px solid hsl(var(${item.color}))`, boxShadow: `0 0 10px hsl(var(${item.color}) / 0.20)` }
                : { background: "hsl(var(--card))", border: "1.5px solid transparent" }
              }
            >
              <span className="text-sm">{item.emoji}</span>
              <span className="text-xs font-semibold whitespace-nowrap" style={{ color: cat === item.id ? `hsl(var(${item.color}))` : "hsl(var(--muted-foreground))" }}>
                {item.label}
              </span>
            </motion.button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {!query ? (
            <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col gap-4">
              {recents.length > 0 && (
                <div className="px-4 md:px-6">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">🕐 Последние запросы</p>
                    <button onClick={() => setRecents([])} className="text-[10px] text-muted-foreground/60">Очистить</button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {recents.map((item, index) => (
                      <motion.button
                        key={index}
                        onClick={() => { setRawQuery(item); setQuery(item); }}
                        initial={{ opacity: 0, scale: 0.85 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.04 }}
                        whileTap={{ scale: 0.9 }}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-2xl text-sm"
                        style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}
                      >
                        <Clock className="w-3 h-3 text-muted-foreground" />
                        <span className="text-foreground/80">{item}</span>
                      </motion.button>
                    ))}
                  </div>
                </div>
              )}
              <div className="px-4 md:px-6">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2">✨ Попробуйте</p>
                <div className="flex flex-col gap-1.5">
                  {SUGGESTS.map((item, index) => (
                    <motion.button
                      key={index}
                      onClick={() => { setRawQuery(item); setQuery(item); }}
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.06 }}
                      whileTap={{ scale: 0.97 }}
                      className="flex items-center gap-3 px-4 py-3 rounded-2xl text-left"
                      style={{ background: "hsl(var(--muted))" }}
                    >
                      <Search className="w-4 h-4 text-muted-foreground/50" />
                      <span className="text-sm text-foreground/70">{item}</span>
                    </motion.button>
                  ))}
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div key="results" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="px-4 md:px-6">
              <p className="text-xs text-muted-foreground mb-3">
                Найдено: <span className="font-bold text-foreground">{filtered.length}</span>
              </p>
              <div className="flex flex-col gap-2">
                <AnimatePresence>
                  {filtered.map((item, index) => (
                    <ResultCard key={item.id} item={item} query={query} index={index} onOpen={openResult} />
                  ))}
                </AnimatePresence>
                {filtered.length === 0 && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16">
                    <span className="text-5xl">🔍</span>
                    <p className="text-muted-foreground mt-3 text-sm">Ничего не найдено по «{query}»</p>
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AppLayout>
  );
}
