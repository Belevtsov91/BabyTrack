/**
 * ФАЙЛ: src/pages/media/PdfReport.tsx
 */

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Download, Check, Loader2, Share2 } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { toast } from "@/hooks/use-toast";
import {
  allergensDB,
  eventsDB,
  getEventSubType,
  milestonesDB,
  photosDB,
  temperatureDB,
  vaccinationsDB,
} from "@/lib/crud";
import type {
  AllergenRecord,
  BabyEvent,
  Milestone,
  PhotoRecord,
  TemperatureRecord,
  VaccinationRecord,
} from "@/lib/crud";

const hca = (c: string, a: number) => c.replace(/\)$/, ` / ${a})`);

type Period = "week" | "month" | "all";
type Format = "pdf" | "csv";
type ReportSection = "sleep" | "feeding" | "diaper" | "growth" | "health" | "vaccines";

interface Section {
  id: ReportSection;
  emoji: string;
  label: string;
  desc: string;
  color: string;
  enabled: boolean;
  rows: number;
}

interface ReportRow {
  section: ReportSection;
  type: string;
  title: string;
  timestamp: string;
  duration: string;
  details: string;
}

const BASE_SECTIONS: Omit<Section, "enabled" | "rows">[] = [
  { id:"sleep",    emoji:"🌙", label:"Сон",        desc:"Все периоды сна и бодрствования",  color:"hsl(var(--sleep))" },
  { id:"feeding",  emoji:"🍼", label:"Кормление",  desc:"Грудь, бутылочка, прикорм",        color:"hsl(var(--feeding))" },
  { id:"diaper",   emoji:"👶", label:"Подгузники", desc:"Типы и частота",                   color:"hsl(var(--diaper))" },
  { id:"growth",   emoji:"📏", label:"Рост и вес", desc:"Антропометрия, фото и достижения", color:"hsl(var(--activity))" },
  { id:"health",   emoji:"🏥", label:"Здоровье",   desc:"Температура, лекарства, врачи",    color:"hsl(var(--health))" },
  { id:"vaccines", emoji:"💉", label:"Прививки",   desc:"Календарь вакцинации",             color:"hsl(var(--feeding))" },
];

const PERIOD_LABELS: Record<Period, string> = {
  week: "Неделя",
  month: "Месяц",
  all: "Всё время",
};

const FORMAT_CONFIG: Record<Format, { label: string; icon: string; color: string; desc: string }> = {
  pdf: { label: "PDF", icon: "📄", color: "hsl(var(--health))", desc: "Для врача" },
  csv: { label: "CSV", icon: "📊", color: "hsl(var(--feeding))", desc: "Таблица" },
};

function isWithinPeriod(timestamp: string, period: Period): boolean {
  if (period === "all") return true;
  const createdAt = new Date(timestamp);
  if (Number.isNaN(createdAt.getTime())) return false;
  const cutoff = new Date();
  if (period === "week") cutoff.setDate(cutoff.getDate() - 7);
  if (period === "month") cutoff.setMonth(cutoff.getMonth() - 1);
  return createdAt >= cutoff;
}

function toTime(value: string): number {
  const time = new Date(value).getTime();
  return Number.isNaN(time) ? 0 : time;
}

function serializeDetails(details: Record<string, unknown>): string {
  return Object.entries(details)
    .filter(([, value]) => value !== undefined && value !== null && value !== "")
    .map(([key, value]) => `${key}: ${String(value)}`)
    .join(" · ");
}

function collectReportRows(
  events: BabyEvent[],
  milestones: Milestone[],
  vaccinations: VaccinationRecord[],
  temperatures: TemperatureRecord[],
  allergens: AllergenRecord[],
  photos: PhotoRecord[],
): ReportRow[] {
  const rows: ReportRow[] = [];

  events.forEach((event) => {
    const subType = getEventSubType(event);
    const section =
      event.type === "sleep" ? "sleep" :
      event.type === "feeding" ? "feeding" :
      event.type === "diaper" ? "diaper" :
      event.type === "temperature" ? "health" :
      event.type === "mood" ? "growth" :
      ["weight", "height", "head", "milestone"].includes(subType) ? "growth" :
      ["doctor", "vaccine", "medication", "temperature"].includes(subType) ? "health" :
      ["breast", "bottle", "solid", "pump"].includes(subType) ? "feeding" :
      "sleep";

    rows.push({
      section,
      type: event.type,
      title: event.title,
      timestamp: event.timestamp,
      duration: String(event.duration ?? ""),
      details: serializeDetails({
        description: event.description,
        favorite: event.favorite ? "Да" : undefined,
        data: event.data ? JSON.stringify(event.data) : undefined,
      }),
    });
  });

  milestones.forEach((milestone) => {
    rows.push({
      section: "growth",
      type: "milestone",
      title: milestone.title,
      timestamp: milestone.date ? `${milestone.date}T12:00:00.000Z` : new Date().toISOString(),
      duration: "",
      details: serializeDetails({
        emoji: milestone.emoji,
        category: milestone.category,
        completed: milestone.completed ? "Да" : "Нет",
        photoUrl: milestone.photoUrl,
      }),
    });
  });

  vaccinations.forEach((vaccination) => {
    rows.push({
      section: "vaccines",
      type: "vaccination",
      title: vaccination.name,
      timestamp: vaccination.completedDate ?? vaccination.scheduledDate,
      duration: "",
      details: serializeDetails({
        status: vaccination.status,
        scheduledDate: vaccination.scheduledDate,
        completedDate: vaccination.completedDate,
        notes: vaccination.notes,
      }),
    });
  });

  temperatures.forEach((temperature) => {
    rows.push({
      section: "health",
      type: "temperature",
      title: `Температура ${temperature.value.toFixed(1)}°`,
      timestamp: temperature.timestamp,
      duration: "",
      details: serializeDetails({
        notes: temperature.notes,
      }),
    });
  });

  allergens.forEach((allergen) => {
    rows.push({
      section: "health",
      type: "allergen",
      title: allergen.food,
      timestamp: allergen.date,
      duration: "",
      details: serializeDetails({
        reaction: allergen.reaction,
        notes: allergen.notes,
      }),
    });
  });

  photos.forEach((photo) => {
    rows.push({
      section: "growth",
      type: "photo",
      title: photo.caption ?? "Фото",
      timestamp: photo.timestamp,
      duration: "",
      details: serializeDetails({
        url: photo.url,
        tags: photo.tags?.join(", "),
      }),
    });
  });

  return rows.sort((a, b) => toTime(b.timestamp) - toTime(a.timestamp));
}

function sectionForRow(row: ReportRow): ReportSection {
  return row.section;
}

export default function PdfReport() {
  const [period, setPeriod] = useState<Period>("month");
  const [format, setFormat] = useState<Format>("pdf");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [enabledMap, setEnabledMap] = useState<Record<ReportSection, boolean>>({
    sleep: true,
    feeding: true,
    diaper: true,
    growth: true,
    health: true,
    vaccines: false,
  });
  const [lastExportSummary, setLastExportSummary] = useState("");

  const babyName = localStorage.getItem("babyName") || "Малыш";

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

  const reportRows = useMemo(() => collectReportRows(
    eventsDB.getAll(),
    milestonesDB.getAll(),
    vaccinationsDB.getAll(),
    temperatureDB.getAll(),
    allergensDB.getAll(),
    photosDB.getAll(),
  ), [refreshKey]);

  const filteredRows = useMemo(
    () => reportRows.filter((row) => isWithinPeriod(row.timestamp, period)),
    [period, reportRows],
  );

  const sectionCounts = useMemo(() => filteredRows.reduce<Record<ReportSection, number>>((acc, row) => {
    acc[row.section] = (acc[row.section] ?? 0) + 1;
    return acc;
  }, { sleep: 0, feeding: 0, diaper: 0, growth: 0, health: 0, vaccines: 0 }), [filteredRows]);

  const sections: Section[] = useMemo(() => BASE_SECTIONS.map((section) => ({
    ...section,
    enabled: enabledMap[section.id],
    rows: sectionCounts[section.id] ?? 0,
  })), [enabledMap, sectionCounts]);

  const enabledSections = sections.filter((section) => section.enabled);
  const totalRows = enabledSections.reduce((total, section) => total + section.rows, 0);

  const toggleSection = (id: ReportSection) => {
    setEnabledMap((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const buildExportRows = (): ReportRow[] => filteredRows.filter((row) => enabledMap[sectionForRow(row)]);

  const handleGenerate = () => {
    if (enabledSections.length === 0) return;
    setLoading(true);
    setDone(false);

    const rows = buildExportRows();
    const enabledIds = new Set(enabledSections.map((section) => section.id));

    if (format === "csv") {
      const header = ["Раздел", "Тип", "Название", "Дата/Время", "Длительность (мин)", "Данные"];
      const csvRows = rows
        .filter((row) => enabledIds.has(row.section))
        .map((row) => [
          row.section,
          row.type,
          row.title,
          row.timestamp,
          row.duration,
          row.details,
        ]);

      const csv = [header, ...csvRows]
        .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
        .join("\n");

      const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `babytrack_${babyName}_${period}_${Date.now()}.csv`;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      URL.revokeObjectURL(url);

      setLoading(false);
      setDone(true);
      setLastExportSummary(`${rows.length} записей из локальных хранилищ`);
      toast({ title: "✅ CSV скачан", description: `${rows.length} записей` });
      setTimeout(() => setDone(false), 3000);
      return;
    }

    setTimeout(() => {
      setLoading(false);
      setDone(true);
      setLastExportSummary(`${rows.length} записей из локальных хранилищ`);
      toast({ title: "✅ Открыта печать", description: "Выберите «Сохранить как PDF» в браузере" });
      setTimeout(() => {
        setDone(false);
        window.print();
      }, 300);
    }, 400);
  };

  const handleShare = async () => {
    const text = lastExportSummary
      ? `Отчет ${babyName}: ${lastExportSummary}`
      : `Отчет ${babyName} готов к генерации`;
    try {
      if (navigator.share) {
        await navigator.share({ title: "Отчет BabyTracker", text });
        toast({ title: "✅ Отправлено", description: "Текст отчета передан через системный share" });
      } else {
        await navigator.clipboard.writeText(text);
        toast({ title: "✅ Ссылка скопирована", description: "Текст отчета в буфере обмена" });
      }
    } catch {
      try {
        await navigator.clipboard.writeText(text);
        toast({ title: "✅ Ссылка скопирована", description: "Текст отчета в буфере обмена" });
      } catch {
        toast({ title: "Не удалось поделиться", description: "Попробуйте еще раз" });
      }
    }
  };

  return (
    <AppLayout>
      <div className="flex flex-col gap-4 pt-safe pb-10">

        <motion.header
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          className="px-4 md:px-6 pt-4"
        >
          <h1 className="text-2xl font-bold text-foreground">Отчёт</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Для педиатра или личного архива</p>
        </motion.header>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mx-4 rounded-3xl p-5 relative overflow-hidden"
          style={{
            background: "linear-gradient(135deg, hsl(var(--muted)), hsl(var(--card)))",
            border: "1px solid hsl(var(--border))",
          }}
        >
          <div className="absolute -right-3 -top-3 w-20 h-24 rounded-xl opacity-10 rotate-6"
            style={{ background: "white" }} />
          <div className="absolute -right-1 -top-1 w-20 h-24 rounded-xl opacity-[0.06] rotate-3"
            style={{ background: "white" }} />

          <div className="flex items-start gap-4 relative">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shrink-0"
              style={{ background: "hsl(var(--health) / 0.15)" }}
            >
              📄
            </div>
            <div>
              <p className="text-sm font-bold text-foreground">
                Медицинский отчёт — {babyName}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Период: {PERIOD_LABELS[period]}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Разделов: {enabledSections.length} · Записей: ~{totalRows}
              </p>
              <div className="flex gap-1 mt-2 flex-wrap">
                {enabledSections.slice(0, 4).map((section) => (
                  <span
                    key={section.id}
                    className="text-[9px] px-1.5 py-0.5 rounded-lg font-semibold"
                    style={{ background: hca(section.color, 0.12), color: section.color }}
                  >
                    {section.emoji} {section.label}
                  </span>
                ))}
                {enabledSections.length > 4 && (
                  <span className="text-[9px] px-1.5 py-0.5 rounded-lg bg-white/10 text-muted-foreground">
                    +{enabledSections.length - 4}
                  </span>
                )}
              </div>
            </div>
          </div>
        </motion.div>

        <div className="px-4 md:px-6">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2">
            📅 Период
          </p>
          <div
            className="flex p-1 rounded-2xl"
            style={{ background: "hsl(var(--background))", border: "1px solid hsl(var(--border))" }}
          >
            {(["week", "month", "all"] as Period[]).map((value) => (
              <button
                key={value}
                onClick={() => setPeriod(value)}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all"
                style={period === value
                  ? { background: "linear-gradient(135deg, hsl(var(--sleep)), hsl(var(--milestone) / 0.28))", color: "white" }
                  : { color: "hsl(var(--muted-foreground))" }
                }
              >
                {PERIOD_LABELS[value]}
              </button>
            ))}
          </div>
        </div>

        <div className="px-4 md:px-6">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2">
            📦 Формат
          </p>
          <div className="flex gap-2">
            {(Object.entries(FORMAT_CONFIG) as [Format, typeof FORMAT_CONFIG[Format]][]).map(([value, config]) => (
              <motion.button
                key={value}
                onClick={() => setFormat(value)}
                whileTap={{ scale: 0.9 }}
                className="flex-1 flex flex-col items-center gap-1.5 py-3 rounded-2xl transition-all"
                style={format === value
                  ? { background: hca(config.color, 0.12), border: `1.5px solid ${config.color}` }
                  : { background: "hsl(var(--card))", border: "1.5px solid transparent" }
                }
              >
                <span className="text-xl">{config.icon}</span>
                <span className="text-xs font-bold" style={{ color: format === value ? config.color : "hsl(var(--muted-foreground))" }}>
                  {config.label}
                </span>
                <span className="text-[9px] text-muted-foreground">{config.desc}</span>
              </motion.button>
            ))}
          </div>
        </div>

        <div className="px-4 md:px-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
              📋 Разделы
            </p>
            <button
              onClick={() => setEnabledMap({
                sleep: true,
                feeding: true,
                diaper: true,
                growth: true,
                health: true,
                vaccines: true,
              })}
              className="text-[10px] font-semibold text-purple-400"
            >
              Выбрать все
            </button>
          </div>
          <div className="flex flex-col gap-2">
            {sections.map((section, index) => (
              <motion.button
                key={section.id}
                onClick={() => toggleSection(section.id)}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.04 }}
                whileTap={{ scale: 0.97 }}
                className="flex items-center gap-3 p-3.5 rounded-2xl transition-all"
                style={section.enabled
                  ? { background: hca(section.color, 0.07), border: `1px solid ${hca(section.color, 0.19)}` }
                  : { background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }
                }
              >
                <span className="text-xl">{section.emoji}</span>
                <div className="flex-1 text-left">
                  <p className="text-sm font-semibold text-foreground">{section.label}</p>
                  <p className="text-[10px] text-muted-foreground">{section.desc}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {section.enabled && (
                    <span className="text-[9px] text-muted-foreground">~{section.rows}</span>
                  )}
                  <motion.div
                    className="w-5 h-5 rounded-full flex items-center justify-center"
                    animate={{
                      background: section.enabled ? section.color : "hsl(var(--border))",
                      scale: section.enabled ? 1 : 0.8,
                    }}
                  >
                    {section.enabled && <Check className="w-3 h-3 text-white" />}
                  </motion.div>
                </div>
              </motion.button>
            ))}
          </div>
        </div>

        <div className="px-4 md:px-6">
          <motion.button
            whileTap={!loading ? { scale: 0.96 } : {}}
            onClick={handleGenerate}
            disabled={loading || enabledSections.length === 0}
            className="w-full h-14 rounded-2xl font-bold text-base text-white flex items-center justify-center gap-3 transition-all"
            style={{
              background: done
                ? "linear-gradient(135deg, hsl(var(--feeding) / 0.60), hsl(var(--feeding) / 0.40))"
                : loading
                ? "hsl(var(--border))"
                : enabledSections.length === 0
                ? "hsl(var(--muted))"
                : "linear-gradient(135deg, hsl(var(--sleep)), hsl(var(--milestone) / 0.50))",
              boxShadow: !loading && !done && enabledSections.length > 0
                ? "0 8px 24px hsl(var(--sleep) / 0.25)"
                : "none",
            }}
          >
            <AnimatePresence mode="wait">
              {loading ? (
                <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="flex items-center gap-2">
                  <motion.div animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}>
                    <Loader2 className="w-5 h-5" />
                  </motion.div>
                  Формируем отчёт...
                </motion.div>
              ) : done ? (
                <motion.div key="done" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                  className="flex items-center gap-2">
                  <Check className="w-5 h-5" /> Готово! Скачать
                </motion.div>
              ) : (
                <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="flex items-center gap-2">
                  <Download className="w-5 h-5" />
                  Сформировать {format.toUpperCase()}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.button>

          {done && (
            <motion.button
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={handleShare}
              className="w-full h-12 mt-2 rounded-2xl font-semibold text-sm flex items-center justify-center gap-2"
              style={{ background: "hsl(var(--muted))", color: "hsl(var(--muted-foreground))" }}
            >
              <Share2 className="w-4 h-4" /> Поделиться с врачом
            </motion.button>
          )}
        </div>

      </div>
    </AppLayout>
  );
}
