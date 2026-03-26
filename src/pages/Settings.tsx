import { useEffect, useState, type ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LogOut, Download, Upload, ChevronRight, Cloud, CloudOff, Trash2, Edit3, Check,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { exportAllData, importAllData } from "@/lib/crud";
import { useTheme, ThemeMode } from "@/lib/theme";
import { useI18n, Lang } from "@/lib/i18n";
import { toast } from "@/hooks/use-toast";
import { AppLayout } from "@/components/layout/AppLayout";
import {
  clearSessionStorage,
  getBabyProfileState,
  getDisplaySettings,
  getMeasurementUnits,
  type MeasurementUnitsState,
  saveDisplaySettings,
  saveMeasurementUnits,
} from "@/lib/appStorage";
import { SK } from "@/lib/storageKeys";

// ─── Theme definitions with gradient previews ────────────────────────────────
const THEMES: {
  id: ThemeMode; label: string; emoji: string;
  gradient: string; accent: string;
}[] = [
  {
    id: "dark",   label: "Космос",    emoji: "🌌",
    gradient: "linear-gradient(135deg, #0f0c24 0%, #1a1040 40%, #2d1b69 70%, #1e3a5f 100%)",
    accent: "#a78bfa",
  },
  {
    id: "light",  label: "Аврора",   emoji: "☀️",
    gradient: "linear-gradient(135deg, #f0f4ff 0%, #e8eeff 40%, #ddd6fe 70%, #c7d2fe 100%)",
    accent: "#7c3aed",
  },
  {
    id: "pastel", label: "Сакура",   emoji: "🌸",
    gradient: "linear-gradient(135deg, #fff0f8 0%, #fce7f3 40%, #fbcfe8 70%, #e9d5ff 100%)",
    accent: "#ec4899",
  },
  {
    id: "spring", label: "Лес",      emoji: "🌿",
    gradient: "linear-gradient(135deg, #f0fdf4 0%, #dcfce7 40%, #bbf7d0 70%, #d1fae5 100%)",
    accent: "#16a34a",
  },
  {
    id: "winter", label: "Арктика",  emoji: "❄️",
    gradient: "linear-gradient(135deg, #0a1628 0%, #0f2040 40%, #0c3055 70%, #082040 100%)",
    accent: "#38bdf8",
  },
];

const LANGS: { id: Lang; flag: string; label: string }[] = [
  { id: "ru", flag: "🇷🇺", label: "Рус" },
  { id: "en", flag: "🇬🇧", label: "Eng" },
  { id: "uk", flag: "🇺🇦", label: "Укр" },
  { id: "ro", flag: "🇷🇴", label: "Rom" },
  { id: "el", flag: "🇬🇷", label: "Ελλ" },
];

function calcAge(birthDateStr: string): string {
  const birth = new Date(birthDateStr);
  const now   = new Date();
  const months =
    (now.getFullYear() - birth.getFullYear()) * 12 +
    (now.getMonth() - birth.getMonth());
  return months < 1
    ? `${Math.max(0, now.getDate() - birth.getDate())} дн`
    : `${months} мес`;
}

function Plate({ title, children, className }: { title: string; children: ReactNode; className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn("mx-4 md:mx-0 rounded-3xl p-4", className)}
      style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}
    >
      <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">{title}</p>
      {children}
    </motion.div>
  );
}

// ─── Baby card with gradient ──────────────────────────────────────────────────
function BabyCard({ onEdit }: { onEdit: () => void }) {
  const profile   = getBabyProfileState();
  const name      = profile.name;
  const birthDate = profile.birthDate;
  const age       = calcAge(birthDate);

  return (
    <motion.div
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-4 md:mx-0 rounded-3xl p-5 relative overflow-hidden"
      style={{
        background: "var(--primary-gradient, linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent))))",
        boxShadow: "var(--fab-shadow)",
      }}
    >
      {/* Decorative glow blobs */}
      <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full opacity-20"
        style={{ background: "radial-gradient(circle, white, transparent)" }} />
      <div className="absolute -bottom-6 -left-6 w-24 h-24 rounded-full opacity-10"
        style={{ background: "radial-gradient(circle, white, transparent)" }} />

      <div className="flex items-center gap-4 relative">
        <motion.div
          animate={{ rotate: [0, 5, -5, 0], scale: [1, 1.05, 1] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl shrink-0"
          style={{ background: "rgba(255,255,255,0.20)" }}
        >
          👶
        </motion.div>
        <div className="flex-1">
          <p className="text-xl font-bold text-white">{name}</p>
          <p className="text-sm text-white/65 mt-0.5">{age} · {birthDate}</p>
          <div className="flex gap-2 mt-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-white/15 text-white/80">Активен</span>
          </div>
        </div>
        <motion.button
          whileTap={{ scale: 0.85 }} onClick={onEdit}
          className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ background: "rgba(255,255,255,0.18)" }}
        >
          <Edit3 className="w-4 h-4 text-white/80" />
        </motion.button>
      </div>
    </motion.div>
  );
}

// ─── Units panel ─────────────────────────────────────────────────────────────
function UnitsPanel() {
  const [units, setUnits] = useState(() => getMeasurementUnits());
  type UnitKey = keyof MeasurementUnitsState;

  const updateUnit = (key: UnitKey, value: MeasurementUnitsState[UnitKey]) => {
    setUnits((current) => {
      const next = { ...current, [key]: value };
      saveMeasurementUnits({ [key]: value } as Partial<MeasurementUnitsState>);
      return next;
    });
  };

  const rows = [
    { key: "volume" as const, label: "Объём",      opts: ["мл",  "унц"]  },
    { key: "length" as const, label: "Длина",       opts: ["см",  "дюйм"] },
    { key: "weight" as const, label: "Вес",         opts: ["кг",  "фунт"] },
    { key: "temp"   as const, label: "Температура", opts: ["°C",  "°F"]   },
  ];

  useEffect(() => {
    const sync = () => setUnits(getMeasurementUnits());
    window.addEventListener("storage", sync);
    window.addEventListener("focus", sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener("focus", sync);
    };
  }, []);
  return (
    <Plate title="📐 Единицы измерения">
      <div className="flex flex-col gap-3">
        {rows.map((row) => (
          <div key={row.key} className="flex items-center justify-between">
            <span className="text-sm text-foreground font-medium">{row.label}</span>
            <div className="flex p-0.5 rounded-xl" style={{ background: "hsl(var(--muted))" }}>
              {row.opts.map((opt) => (
                <button key={opt} onClick={() => updateUnit(row.key, opt as typeof units[typeof row.key])}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold transition-all"
                  style={units[row.key] === opt
                    ? { background: "var(--primary-gradient, hsl(var(--primary)))", color: "hsl(var(--primary-foreground))" }
                    : { color: "hsl(var(--muted-foreground))" }
                  }
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Plate>
  );
}

// ─── Theme carousel (centered, big beautiful cards) ──────────────────────────
function ThemeCarousel() {
  const { theme, setTheme } = useTheme();

  return (
    <Plate title="🎨 Тема оформления">
      <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-1 -mx-1 px-1 justify-center flex-wrap">
        {THEMES.map((t, i) => {
          const isActive = theme === t.id;
          return (
            <motion.button
              key={t.id}
              onClick={() => setTheme(t.id)}
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.06, type: "spring", stiffness: 200, damping: 16 }}
              whileTap={{ scale: 0.92 }}
              className="flex flex-col items-center gap-2 shrink-0"
            >
              <motion.div
                className="w-20 h-20 rounded-2xl overflow-hidden relative"
                animate={isActive ? {
                  boxShadow: [`0 0 0 2px ${t.accent}, 0 4px 20px ${t.accent}55`,
                              `0 0 0 2.5px ${t.accent}, 0 6px 28px ${t.accent}70`,
                              `0 0 0 2px ${t.accent}, 0 4px 20px ${t.accent}55`],
                } : { boxShadow: "0 0 0 1.5px rgba(255,255,255,0.08)" }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <div className="w-full h-full" style={{ background: t.gradient }} />
                {/* Stars/dots for dark themes */}
                {(t.id === "dark" || t.id === "winter") && (
                  <div className="absolute inset-0">
                    {[...Array(6)].map((_, j) => (
                      <div key={j} className="absolute w-0.5 h-0.5 rounded-full bg-white/60"
                        style={{ left: `${15 + j * 14}%`, top: `${20 + (j % 3) * 25}%` }} />
                    ))}
                  </div>
                )}
                {isActive && (
                  <motion.div
                    initial={{ scale: 0 }} animate={{ scale: 1 }}
                    className="absolute inset-0 flex items-center justify-center"
                    style={{ background: `${t.accent}25` }}
                  >
                    <div className="w-7 h-7 rounded-full flex items-center justify-center"
                      style={{ background: t.accent }}>
                      <Check className="w-4 h-4 text-white" />
                    </div>
                  </motion.div>
                )}
              </motion.div>
              <div className="text-center">
                <p className="text-[11px] font-semibold text-foreground">{t.emoji} {t.label}</p>
                {isActive && (
                  <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="text-[9px] font-bold" style={{ color: t.accent }}>
                    Активна
                  </motion.p>
                )}
              </div>
            </motion.button>
          );
        })}
      </div>
    </Plate>
  );
}

// ─── Language grid ────────────────────────────────────────────────────────────
function LangGrid() {
  const { lang, setLang } = useI18n();
  return (
    <Plate title="🌍 Язык">
      <div className="flex gap-2 flex-wrap">
        {LANGS.map((l, i) => (
          <motion.button key={l.id} onClick={() => setLang(l.id)}
            initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.05 }} whileTap={{ scale: 0.88 }}
            className="flex flex-col items-center gap-1 px-4 py-3 rounded-2xl transition-all"
            style={lang === l.id
              ? {
                  background: "var(--primary-gradient, hsl(var(--primary)))",
                  boxShadow: "var(--fab-shadow)",
                }
              : { background: "hsl(var(--muted))", border: "1.5px solid transparent" }
            }
          >
            <span className="text-2xl">{l.flag}</span>
            <span className="text-xs font-semibold"
              style={{ color: lang === l.id ? "white" : "hsl(var(--muted-foreground))" }}>
              {l.label}
            </span>
          </motion.button>
        ))}
      </div>
    </Plate>
  );
}

// ─── Simple toggle ────────────────────────────────────────────────────────────
function SimpleToggle({
  emoji, label, sub, value, onChange,
}: {
  emoji: string; label: string; sub: string; value: boolean; onChange: (v: boolean) => void;
}) {
  return (
    <button
      onClick={() => onChange(!value)}
      className="w-full flex items-center gap-3"
      role="switch"
      aria-checked={value}
    >
      <span className="text-xl shrink-0">{emoji}</span>
      <div className="flex-1 text-left">
        <p className="text-sm font-semibold text-foreground">{label}</p>
        <p className="text-xs text-muted-foreground">{sub}</p>
      </div>
      <div
        className="w-11 h-6 rounded-full relative shrink-0 transition-all"
        style={{
          background: value
            ? "var(--primary-gradient, hsl(var(--primary)))"
            : "hsl(var(--muted))",
        }}
      >
        <motion.div
          className="absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm"
          animate={{ left: value ? 22 : 4 }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
        />
      </div>
    </button>
  );
}

// ─── Display toggles ──────────────────────────────────────────────────────────
function DisplayPanel() {
  const profile = getBabyProfileState();
  const displaySettings = getDisplaySettings();
  const birthDate = profile.birthDate || "2024-01-01";
  const ageMonths = (() => {
    const b = new Date(birthDate), n = new Date();
    return (n.getFullYear() - b.getFullYear()) * 12 + (n.getMonth() - b.getMonth());
  })();

  const [solidMode, setSolidModeState] = useState<"auto"|"on"|"off">(displaySettings.solidMode);
  const [showWalk, setShowWalkRaw] = useState(displaySettings.showWalk);
  const [showMood, setShowMoodRaw] = useState(displaySettings.showMood);

  const setSolid = (val: "auto"|"on"|"off") => {
    setSolidModeState(val);
    saveDisplaySettings({ solidMode: val });
  };
  const setWalk = (val: boolean) => {
    setShowWalkRaw(val);
    saveDisplaySettings({ showWalk: val });
  };
  const setMood = (val: boolean) => {
    setShowMoodRaw(val);
    saveDisplaySettings({ showMood: val });
  };

  useEffect(() => {
    const sync = () => {
      const next = getDisplaySettings();
      setSolidModeState(next.solidMode);
      setShowWalkRaw(next.showWalk);
      setShowMoodRaw(next.showMood);
    };
    window.addEventListener("storage", sync);
    window.addEventListener("focus", sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener("focus", sync);
    };
  }, []);

  const solidAutoLabel = ageMonths < 4 ? "скрыт (до 4 мес)" : "показан (≥ 4 мес)";

  return (
    <Plate title="👁 Отображение разделов">
      <div className="flex flex-col gap-4">
        <div>
          <div className="flex items-center justify-between mb-2">
            <div>
              <p className="text-sm font-semibold text-foreground">🥣 Прикорм</p>
              <p className="text-xs text-muted-foreground mt-0.5">Авто: {solidAutoLabel}</p>
            </div>
          </div>
          <div className="flex gap-1 p-0.5 rounded-xl" style={{ background: "hsl(var(--muted))" }}>
            {(["auto","on","off"] as const).map((val) => (
              <button key={val} onClick={() => setSolid(val)}
                className="flex-1 py-1.5 rounded-xl text-xs font-semibold transition-all"
                style={solidMode === val
                  ? { background: "var(--primary-gradient, hsl(var(--primary)))", color: "hsl(var(--primary-foreground))" }
                  : { color: "hsl(var(--muted-foreground))" }
                }
              >
                {val === "auto" ? "Авто" : val === "on" ? "Всегда" : "Скрыть"}
              </button>
            ))}
          </div>
        </div>
        <SimpleToggle emoji="🚶" label="Прогулка" sub="Показывать в разделе Активность" value={showWalk} onChange={setWalk} />
        <SimpleToggle emoji="😊" label="Настроение" sub="Показывать раздел Настроение" value={showMood} onChange={setMood} />
      </div>
    </Plate>
  );
}

// ─── Sync toggle ─────────────────────────────────────────────────────────────
function SyncToggle() {
  const [enabled, setEnabled] = useState(getDisplaySettings().syncEnabled);

  useEffect(() => {
    const sync = () => setEnabled(getDisplaySettings().syncEnabled);
    window.addEventListener("storage", sync);
    window.addEventListener("focus", sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener("focus", sync);
    };
  }, []);

  return (
    <Plate title="☁️ Синхронизация">
      <motion.button whileTap={{ scale: 0.97 }} onClick={() => setEnabled((v) => {
        const next = !v;
        saveDisplaySettings({ syncEnabled: next });
        return next;
      })}
        className="w-full flex items-center gap-4 p-4 rounded-2xl transition-all"
        role="switch"
        aria-checked={enabled}
        style={{
          background: enabled
            ? "var(--primary-gradient, hsl(var(--primary) / 0.15))"
            : "hsl(var(--muted))",
          border: `1.5px solid ${enabled ? "hsl(var(--primary))" : "transparent"}`,
        }}
      >
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
          style={{ background: enabled ? "hsl(var(--primary) / 0.25)" : "hsl(var(--accent))" }}>
          {enabled
            ? <Cloud className="w-6 h-6" style={{ color: "hsl(var(--primary))" }} />
            : <CloudOff className="w-6 h-6 text-muted-foreground" />
          }
        </div>
        <div className="flex-1 text-left">
          <p className="text-sm font-semibold text-foreground">
            {enabled ? "Синхронизация включена" : "Синхронизация выключена"}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {enabled ? "Данные сохраняются в облако" : "Данные только на устройстве"}
          </p>
        </div>
        <div className="w-12 h-6 rounded-full relative transition-all"
          style={{ background: enabled ? "var(--primary-gradient, hsl(var(--primary)))" : "hsl(var(--muted))" }}>
          <motion.div className="absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm"
            animate={{ left: enabled ? 26 : 4 }}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
          />
        </div>
      </motion.button>
      <AnimatePresence>
        {enabled && (
          <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="text-xs text-muted-foreground mt-2 text-center">
            Последняя синхронизация: сегодня, 09:15
          </motion.p>
        )}
      </AnimatePresence>
    </Plate>
  );
}

// ─── Data section ─────────────────────────────────────────────────────────────
function DataSection() {
  const handleExport = () => {
    const data = exportAllData();
    const blob = new Blob([data], { type: "application/json" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = `babytrack-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast({ title: "✅ Экспорт", description: "Данные сохранены в файл" });
  };

  const handleImport = () => {
    const input    = document.createElement("input");
    input.type     = "file";
    input.accept   = ".json";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        const ok = importAllData(ev.target?.result as string);
        toast({
          title: ok ? "✅ Импорт выполнен" : "❌ Ошибка импорта",
          description: ok ? "Все данные восстановлены" : "Проверьте формат файла",
        });
        if (ok) {
          window.dispatchEvent(new Event("storage"));
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  return (
    <Plate title="💾 Данные">
      <div className="flex gap-3">
        <motion.button whileTap={{ scale: 0.95 }} onClick={handleExport}
          className="flex-1 flex flex-col items-center gap-2 py-4 rounded-2xl"
          style={{
            background: "linear-gradient(135deg, hsl(152 55% 11%), hsl(152 45% 9%))",
            border: "1px solid hsl(152 55% 22%)",
          }}
        >
          <div className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, hsl(152 68% 40%), hsl(152 60% 32%))" }}>
            <Download className="w-5 h-5 text-white" />
          </div>
          <span className="text-xs font-semibold" style={{ color: "hsl(152 68% 52%)" }}>Экспорт</span>
          <span className="text-[10px] text-muted-foreground">JSON файл</span>
        </motion.button>
        <motion.button whileTap={{ scale: 0.95 }} onClick={handleImport}
          className="flex-1 flex flex-col items-center gap-2 py-4 rounded-2xl"
          style={{
            background: "linear-gradient(135deg, hsl(199 65% 11%), hsl(199 55% 9%))",
            border: "1px solid hsl(199 65% 20%)",
          }}
        >
          <div className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, hsl(199 90% 48%), hsl(199 80% 38%))" }}>
            <Upload className="w-5 h-5 text-white" />
          </div>
          <span className="text-xs font-semibold" style={{ color: "hsl(199 90% 60%)" }}>Импорт</span>
          <span className="text-[10px] text-muted-foreground">Из файла</span>
        </motion.button>
      </div>
    </Plate>
  );
}

// ─── Danger zone ──────────────────────────────────────────────────────────────
function DangerZone({ onLogout }: { onLogout: () => void }) {
  const [confirm, setConfirm] = useState(false);

  const handleDeleteAll = () => {
    const preservedKeys = [
      SK.THEME,
      SK.LANGUAGE,
      SK.UNIT_VOLUME,
      SK.UNIT_LENGTH,
      SK.UNIT_WEIGHT,
      SK.UNIT_TEMPERATURE,
      SK.SHOW_SOLID,
      SK.SHOW_WALK,
      SK.SHOW_MOOD,
      SK.SYNC_ENABLED,
    ];
    const preserved = preservedKeys.flatMap((key) => {
      const value = localStorage.getItem(key);
      return value === null ? [] : [[key, value] as [string, string]];
    });
    localStorage.clear();
    preserved.forEach(([key, value]) => localStorage.setItem(key, value));
    localStorage.setItem(SK.SEED_MARK, "cleared");
    toast({ title: "🗑 Данные удалены", description: "Все записи очищены" });
    setConfirm(false);
    setTimeout(() => { window.location.href = "/welcome"; }, 800);
  };

  return (
    <div className="mx-4 md:mx-0 rounded-3xl p-4"
      style={{ background: "hsl(0 40% 9%)", border: "1px solid hsl(0 40% 18%)" }}>
      <p className="text-xs font-bold text-red-400/70 uppercase tracking-widest mb-3">⚠️ Опасная зона</p>
      <div className="flex flex-col gap-2">
        <motion.button whileTap={{ scale: 0.97 }} onClick={onLogout}
          className="flex items-center gap-3 p-3 rounded-2xl transition-all hover:bg-red-900/20"
          style={{ background: "hsl(0 40% 13%)" }}
        >
          <div className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background: "hsl(0 60% 20%)" }}>
            <LogOut className="w-4 h-4 text-red-400" />
          </div>
          <span className="text-sm font-semibold text-red-400">Выйти из аккаунта</span>
        </motion.button>

        <AnimatePresence mode="wait">
          {!confirm ? (
            <motion.button key="ask" whileTap={{ scale: 0.97 }} onClick={() => setConfirm(true)}
              className="flex items-center gap-3 p-3 rounded-2xl transition-all hover:bg-red-900/10"
              style={{ background: "hsl(0 40% 13%)" }}
            >
              <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                style={{ background: "hsl(0 30% 18%)" }}>
                <Trash2 className="w-4 h-4 text-red-400/60" />
              </div>
              <span className="text-sm font-semibold text-red-400/60">Удалить все данные</span>
            </motion.button>
          ) : (
            <motion.div key="confirm"
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
              className="flex flex-col gap-2"
            >
              <p className="text-xs text-red-400/80 text-center px-2 py-2">
                Это удалит ВСЕ записи о ребёнке навсегда. Продолжить?
              </p>
              <div className="flex gap-2">
                <button onClick={() => setConfirm(false)}
                  className="flex-1 py-3 rounded-2xl text-sm font-semibold text-muted-foreground"
                  style={{ background: "hsl(var(--muted))" }}>
                  Отмена
                </button>
                <button onClick={handleDeleteAll}
                  className="flex-1 py-3 rounded-2xl text-sm font-bold text-white"
                  style={{ background: "linear-gradient(135deg, hsl(0 75% 48%), hsl(0 65% 38%))" }}>
                  Удалить
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ─── Tool links ───────────────────────────────────────────────────────────────
function ToolLinks() {
  const navigate = useNavigate();
  const tools = [
    { label: "Календарь",   emoji: "📅", path: "/calendar",       color: "hsl(var(--activity))" },
    { label: "Лекарства",   emoji: "💊", path: "/medications",    color: "hsl(var(--feeding))"  },
    { label: "Напоминания", emoji: "🔔", path: "/reminders",      color: "hsl(var(--diaper))"   },
    { label: "Рост ВОЗ",    emoji: "📏", path: "/growth",         color: "hsl(var(--growth))"   },
    { label: "PDF отчёт",   emoji: "📄", path: "/report",         color: "hsl(var(--health))"   },
    { label: "Итог года",   emoji: "✨", path: "/recap",          color: "hsl(var(--mood))"     },
    { label: "Достижения",  emoji: "🏆", path: "/milestones",     color: "hsl(var(--milestone))"},
    { label: "Фотодневник", emoji: "📸", path: "/photos",         color: "hsl(var(--sleep))"    },
  ];
  return (
    <Plate title="🛠 Инструменты">
      <div className="grid grid-cols-4 gap-2">
        {tools.map((t, i) => (
          <motion.button key={t.path} onClick={() => navigate(t.path)}
            initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.04 }} whileTap={{ scale: 0.88 }}
            className="flex flex-col items-center gap-1.5 py-3 rounded-2xl transition-all"
            style={{ background: `${t.color.replace(")", " / 0.12)")}`, border: `1px solid ${t.color.replace(")", " / 0.22)")}` }}
          >
            <span className="text-xl">{t.emoji}</span>
            <span className="text-[9px] font-semibold text-muted-foreground text-center leading-tight">{t.label}</span>
          </motion.button>
        ))}
      </div>
    </Plate>
  );
}

// ─── Main Settings page ───────────────────────────────────────────────────────
export default function Settings() {
  const navigate = useNavigate();

  const handleLogout = () => {
    clearSessionStorage();
    navigate("/welcome");
  };

  return (
    <AppLayout>
      <div className="flex flex-col gap-4 pt-safe pb-10">
        <motion.header initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}
          className="px-4 md:px-6 pt-4">
          <h1 className="text-2xl font-bold text-foreground">Настройки</h1>
          <p className="text-sm text-muted-foreground mt-0.5">BabyTrack v2.1.0</p>
        </motion.header>

        {/* Baby card — full width */}
        <div className="px-0 md:px-6">
          <BabyCard onEdit={() => navigate("/baby-profile")} />
        </div>

        {/* Tool links — full width */}
        <div className="px-0 md:px-6">
          <ToolLinks />
        </div>

        {/* Theme carousel — CENTERED full width */}
        <div className="px-0 md:px-6">
          <ThemeCarousel />
        </div>

        {/* 2-col grid on md+ */}
        <div className="px-0 md:px-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <UnitsPanel />
          <LangGrid />
          <DisplayPanel />
          <SyncToggle />
          <DataSection />

          <div className="md:col-span-2">
            <Plate title="ℹ️ Прочее">
              <div className="flex flex-col gap-1">
                {[
                  { label: "Конфиденциальность", emoji: "🔒", color: "hsl(var(--muted-foreground))" },
                  { label: "Помощь",             emoji: "❓", color: "hsl(var(--muted-foreground))" },
                  { label: "Оценить приложение", emoji: "⭐", color: "hsl(var(--milestone))"       },
                ].map((item) => (
                  <motion.button key={item.label} whileTap={{ scale: 0.97 }}
                    className="flex items-center gap-3 p-3 rounded-2xl transition-all"
                    style={{ background: "hsl(var(--muted))" }}
                    onClick={() => toast({ title: item.emoji + " " + item.label, description: "Раздел в разработке" })}
                  >
                    <span className="text-base">{item.emoji}</span>
                    <span className="flex-1 text-sm font-medium text-foreground text-left">{item.label}</span>
                    <ChevronRight className="w-4 h-4 text-muted-foreground/40" />
                  </motion.button>
                ))}
              </div>
            </Plate>
          </div>

          <div className="md:col-span-2">
            <DangerZone onLogout={handleLogout} />
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
