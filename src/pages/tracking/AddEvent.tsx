import { useState, useMemo, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Search, Star, Clock, ChevronRight, ChevronDown } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { SidebarLayout } from "@/components/layout/SidebarLayout";
import { getBabyProfileState, getDisplaySettings } from "@/lib/appStorage";

interface EventCategory {
  id: string;
  emoji: string;
  label: string;
  sublabel: string;
  color: string;
  lastTime?: string;
  todayCount?: number;
  route: string;
  pinned?: boolean;
}

interface Section {
  id: string;
  emoji: string;
  title: string;
  items: EventCategory[];
}

const SECTIONS: Section[] = [
  {
    id: "feeding",
    emoji: "🍼",
    title: "Питание",
    items: [
      { id: "breast",  emoji: "🤱", label: "Кормление грудью", sublabel: "Левая · Правая · Обе",      color: "--feeding", lastTime: "45м назад", todayCount: 4, route: "/event/breast",  pinned: true  },
      { id: "bottle",  emoji: "🍼", label: "Бутылочка",        sublabel: "Смесь или сцеженное молоко", color: "--feeding", lastTime: "—",         todayCount: 1, route: "/event/bottle"              },
      { id: "solid",   emoji: "🥣", label: "Прикорм",          sublabel: "Пюре, каша, фрукты",         color: "--feeding", lastTime: "вчера",     todayCount: 0, route: "/event/solid"               },
      { id: "pump",    emoji: "🥛", label: "Сцеживание",       sublabel: "Объём и сторона",            color: "--feeding", lastTime: "2ч назад",  todayCount: 2, route: "/event/pump"                },
    ],
  },
  {
    id: "activity",
    emoji: "🌙",
    title: "Активность",
    items: [
      { id: "sleep",   emoji: "🌙", label: "Сон",       sublabel: "Дневной или ночной",  color: "--sleep",    lastTime: "2ч назад", todayCount: 2, route: "/event/sleep",  pinned: true  },
      { id: "diaper",  emoji: "👶", label: "Подгузник", sublabel: "Мокрый / Грязный",    color: "--diaper",   lastTime: "1ч назад", todayCount: 6, route: "/event/diaper", pinned: true  },
      { id: "walk",    emoji: "🚶", label: "Прогулка",  sublabel: "Длительность и место", color: "--activity", lastTime: "3ч назад", todayCount: 1, route: "/event/walk"                },
      { id: "bath",    emoji: "🛁", label: "Купание",   sublabel: "Время и заметка",      color: "--activity", lastTime: "вчера",    todayCount: 0, route: "/event/bath"                },
    ],
  },
  {
    id: "growth",
    emoji: "📏",
    title: "Рост и развитие",
    items: [
      { id: "weight",  emoji: "⚖️",  label: "Вес",              sublabel: "кг · фунты",   color: "--growth", lastTime: "3 дня назад", todayCount: 0, route: "/event/weight"  },
      { id: "height",  emoji: "📏", label: "Рост",              sublabel: "см · дюймы",   color: "--growth", lastTime: "3 дня назад", todayCount: 0, route: "/event/height"  },
      { id: "head",    emoji: "🔵", label: "Обхват головы",     sublabel: "см",            color: "--growth", lastTime: "неделю назад",todayCount: 0, route: "/event/head"    },
    ],
  },
  {
    id: "health",
    emoji: "🏥",
    title: "Здоровье",
    items: [
      { id: "temperature", emoji: "🌡️", label: "Температура",    sublabel: "°C · °F",              color: "--health", lastTime: "вчера",   todayCount: 0, route: "/event/temperature" },
      { id: "doctor",      emoji: "👨‍⚕️", label: "Визит к врачу",  sublabel: "Специалист и заметка", color: "--health", lastTime: "2 нед",   todayCount: 0, route: "/event/doctor"      },
      { id: "vaccine",     emoji: "💉", label: "Прививка",        sublabel: "Название вакцины",     color: "--health", lastTime: "1 мес",   todayCount: 0, route: "/event/vaccine"     },
      { id: "medication",  emoji: "💊", label: "Лекарство",       sublabel: "Доза и название",      color: "--health", lastTime: "вчера",   todayCount: 0, route: "/event/medication"  },
    ],
  },
  {
    id: "mood",
    emoji: "😊",
    title: "Настроение",
    items: [
      { id: "happy",   emoji: "😄", label: "Весёлый",   sublabel: "Отличное настроение",  color: "--mood", lastTime: "сегодня", todayCount: 1, route: "/event/mood" },
      { id: "calm",    emoji: "😌", label: "Спокойный", sublabel: "Обычный день",         color: "--mood", lastTime: "—",       todayCount: 0, route: "/event/mood" },
      { id: "fussy",   emoji: "😢", label: "Капризный", sublabel: "Плохое самочувствие",  color: "--mood", lastTime: "вчера",   todayCount: 0, route: "/event/mood" },
    ],
  },
  {
    id: "milestone",
    emoji: "⭐",
    title: "Важное событие",
    items: [
      { id: "milestone", emoji: "🏆", label: "Достижение",    sublabel: "Первый шаг, слово...", color: "--milestone", lastTime: "2 нед", todayCount: 0, route: "/milestones" },
      { id: "photo",     emoji: "📸", label: "Фото",           sublabel: "Добавить в дневник",  color: "--sleep",     lastTime: "вчера", todayCount: 0, route: "/photos"     },
    ],
  },
];

const ALL_ITEMS = SECTIONS.flatMap((s) => s.items);

function PinnedRow({ onPress }: { onPress: (route: string) => void }) {
  const pinned = ALL_ITEMS.filter((i) => i.pinned);

  return (
    <div className="flex gap-3 px-4 overflow-x-auto scrollbar-hide pb-1">
      {pinned.map((item, i) => (
        <motion.button
          key={item.id}
          onClick={() => onPress(item.route)}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: i * 0.07, type: "spring", stiffness: 200 }}
          whileTap={{ scale: 0.88 }}
          className="flex flex-col items-center gap-1.5 shrink-0"
        >
          <motion.div
            className="w-16 h-16 rounded-2xl flex items-center justify-center relative"
            style={{
              backgroundColor: `hsl(var(${item.color}) / 0.13)`,
              border: `1.5px solid hsl(var(${item.color}) / 0.30)`,
            }}
            animate={{
              boxShadow: [
                `0 0 0px hsl(var(${item.color}) / 0)`,
                `0 0 16px hsl(var(${item.color}) / 0.28)`,
                `0 0 0px hsl(var(${item.color}) / 0)`,
              ],
            }}
            transition={{ duration: 2.5, repeat: Infinity, delay: i * 0.4 }}
          >
            <span className="text-2xl">{item.emoji}</span>
            {!!item.todayCount && (
              <div
                className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
                style={{ backgroundColor: `hsl(var(${item.color}))` }}
              >
                {item.todayCount}
              </div>
            )}
          </motion.div>
          <span className="text-[10px] text-muted-foreground font-medium whitespace-nowrap">
            {item.label}
          </span>
        </motion.button>
      ))}
    </div>
  );
}

function EventCard({
  item,
  index,
  onPress,
}: {
  item: EventCategory;
  index: number;
  onPress: () => void;
}) {
  return (
    <motion.button
      onClick={onPress}
      className="w-full flex items-center gap-4 p-4 rounded-2xl text-left active:scale-[0.97] transition-transform"
      style={{
        backgroundColor: `hsl(var(${item.color}) / 0.08)`,
        border: `1px solid hsl(var(${item.color}) / 0.20)`,
      }}
      initial={{ opacity: 0, x: -24 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -16 }}
      transition={{ delay: index * 0.04, type: "spring", stiffness: 160 }}
      whileTap={{ scale: 0.96 }}
    >
      <div
        className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 text-2xl"
        style={{ backgroundColor: `hsl(var(${item.color}) / 0.15)` }}
      >
        {item.emoji}
      </div>

      <div className="flex-1 min-w-0">
        <p className="font-semibold text-foreground text-sm">{item.label}</p>
        <p className="text-xs text-muted-foreground mt-0.5 truncate">{item.sublabel}</p>
        {item.lastTime && (
          <div className="flex items-center gap-1 mt-1.5">
            <Clock className="w-3 h-3 text-muted-foreground/50" />
            <span className="text-[10px] text-muted-foreground/70">{item.lastTime}</span>
            {!!item.todayCount && (
              <span
                className="ml-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold"
                style={{ backgroundColor: `hsl(var(${item.color}) / 0.18)`, color: `hsl(var(${item.color}))` }}
              >
                ×{item.todayCount} сегодня
              </span>
            )}
          </div>
        )}
      </div>

      <ChevronRight
        className="w-4 h-4 shrink-0 opacity-60"
        style={{ color: `hsl(var(${item.color}))` }}
      />
    </motion.button>
  );
}

function SectionBlock({
  section,
  searchQuery,
  onPress,
  sectionIndex,
  isOpen,
  onToggle,
}: {
  section: Section;
  searchQuery: string;
  onPress: (route: string) => void;
  sectionIndex: number;
  isOpen: boolean;
  onToggle: () => void;
}) {
  const filtered = searchQuery
    ? section.items.filter(
        (i) =>
          i.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
          i.sublabel.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : section.items;

  if (filtered.length === 0) return null;

  // When searching, always show all results expanded
  const expanded = searchQuery ? true : isOpen;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8, transition: { duration: 0.15 } }}
      transition={{ delay: sectionIndex * 0.08 }}
      className="px-4 md:px-6"
    >
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-2 mb-2 mt-1 py-1"
        disabled={!!searchQuery}
      >
        <span className="text-base">{section.emoji}</span>
        <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex-1 text-left">
          {section.title}
        </h2>
        {!searchQuery && (
          <motion.div
            animate={{ rotate: expanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronDown className="w-4 h-4 text-muted-foreground/50" />
          </motion.div>
        )}
        <div className="w-4" />
      </button>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            style={{ overflow: "hidden" }}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pb-1">
              {filtered.map((item, i) => (
                <EventCard
                  key={item.id}
                  item={item}
                  index={i}
                  onPress={() => onPress(item.route)}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function AddEvent() {
  const navigate       = useNavigate();
  const debounceRef    = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [rawQuery, setRawQuery] = useState("");   // immediate input value
  const [query,    setQuery]    = useState("");   // debounced, used for filtering

  const handleQueryChange = useCallback((val: string) => {
    setRawQuery(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setQuery(val), 200);
  }, []);

  // Питание (feeding) and Активность (activity) open by default
  const [openSections, setOpenSections] = useState<Set<string>>(new Set(["feeding", "activity"]));

  const toggleSection = (id: string) => {
    setOpenSections((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const displaySettings = getDisplaySettings();
  const babyProfile = getBabyProfileState();
  const solidMode = displaySettings.solidMode;
  const showWalk = displaySettings.showWalk;
  const showMood = displaySettings.showMood;

  const solidVisible = (() => {
    if (solidMode === "on")  return true;
    if (solidMode === "off") return false;
    // auto: show if child >= 4 months
    const birth = new Date(babyProfile.birthDate || "2024-01-01");
    const now   = new Date();
    const ageMonths = (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth());
    return ageMonths >= 4;
  })();

  const filteredSections = useMemo(() => {
    // Apply display-setting filters first
    let base = SECTIONS.map((s) => ({
      ...s,
      items: s.items.filter((i) => {
        if (i.id === "solid" && !solidVisible) return false;
        if (i.id === "walk"  && !showWalk)     return false;
        return true;
      }),
    })).filter((s) => {
      if (s.id === "mood" && !showMood) return false;
      return s.items.length > 0;
    });

    if (!query) return base;
    const q = query.toLowerCase();
    return base.map((s) => ({
      ...s,
      // Match section title OR any item label/sublabel
      items: s.title.toLowerCase().includes(q)
        ? s.items  // whole section matches — show all its items
        : s.items.filter(
            (i) =>
              i.label.toLowerCase().includes(q) ||
              i.sublabel.toLowerCase().includes(q)
          ),
    })).filter((s) => s.items.length > 0);
  }, [query, solidVisible, showWalk, showMood]);

  return (
    <SidebarLayout>
      <div className="min-h-screen bg-background">

        <motion.header
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="sticky top-0 z-10 bg-background/90 backdrop-blur-xl border-b border-white/[0.06] px-4 md:px-6 py-3"
        >
          <div className="flex items-center gap-3 mb-3 max-w-4xl mx-auto">
            <button
              onClick={() => navigate(-1)}
              className="w-9 h-9 rounded-full bg-muted flex items-center justify-center"
            >
              <ArrowLeft className="w-5 h-5 text-muted-foreground" />
            </button>
            <h1 className="text-lg font-bold text-foreground flex-1">Добавить запись</h1>
          </div>

          <div className="relative max-w-4xl mx-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              value={rawQuery}
              onChange={(e) => handleQueryChange(e.target.value)}
              placeholder="Поиск категории..."
              className="w-full h-10 pl-10 pr-4 rounded-xl bg-muted text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
        </motion.header>

        <div className="flex flex-col gap-6 py-4 pb-10 max-w-4xl mx-auto">

          <AnimatePresence>
            {!rawQuery && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <div className="px-4 md:px-6 mb-2 flex items-center gap-2">
                  <Star className="w-3.5 h-3.5 text-yellow-400" />
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                    Избранное
                  </p>
                </div>
                <PinnedRow onPress={(route) => navigate(route)} />
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence mode="popLayout">
            {filteredSections.map((section, i) => (
              <SectionBlock
                key={section.id}
                section={section}
                searchQuery={query}
                onPress={(route) => navigate(route)}
                sectionIndex={i}
                isOpen={openSections.has(section.id)}
                onToggle={() => toggleSection(section.id)}
              />
            ))}
          </AnimatePresence>

          {filteredSections.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-16"
            >
              <span className="text-5xl">🔍</span>
              <p className="text-muted-foreground mt-3 text-sm">Категория не найдена</p>
            </motion.div>
          )}

        </div>
      </div>
    </SidebarLayout>
  );
}
