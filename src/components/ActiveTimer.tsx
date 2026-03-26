import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Play, Pause, Square, Moon, Baby, Footprints } from "lucide-react";
import { cn } from "@/lib/utils";
import { eventsDB, type BabyEvent } from "@/lib/crud";
import { toast } from "@/hooks/use-toast";

type TimerCategory = "sleep" | "feeding" | "activity";

const categoryConfig: Record<TimerCategory, { icon: typeof Moon; label: string; color: string; glow: string; eventType: BabyEvent['type'] }> = {
  sleep: { icon: Moon, label: "Сон", color: "text-[hsl(var(--sleep))]", glow: "hsl(var(--sleep) / 0.3)", eventType: "sleep" },
  feeding: { icon: Baby, label: "Кормление", color: "text-[hsl(var(--feeding))]", glow: "hsl(var(--feeding) / 0.3)", eventType: "feeding" },
  activity: { icon: Footprints, label: "Прогулка", color: "text-[hsl(var(--activity))]", glow: "hsl(var(--activity) / 0.3)", eventType: "activity" },
};

function formatTime(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${h > 0 ? `${h}:` : ""}${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

export function ActiveTimer() {
  const [active, setActive] = useState<TimerCategory | null>(() => {
    const saved = localStorage.getItem('babytrack_timer');
    if (saved) {
      const { category } = JSON.parse(saved);
      return category ?? null;
    }
    return null;
  });
  const [seconds, setSeconds] = useState(() => {
    const saved = localStorage.getItem('babytrack_timer');
    if (saved) {
      const { startTime, pausedAt, paused } = JSON.parse(saved);
      if (paused && pausedAt && startTime) return Math.floor((pausedAt - startTime) / 1000);
      if (startTime) return Math.floor((Date.now() - startTime) / 1000);
    }
    return 0;
  });
  const [paused, setPaused] = useState(() => {
    const saved = localStorage.getItem('babytrack_timer');
    if (saved) {
      const { paused } = JSON.parse(saved);
      return !!paused;
    }
    return false;
  });

  useEffect(() => {
    if (!active || paused) return;
    const interval = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(interval);
  }, [active, paused]);

  const start = useCallback((cat: TimerCategory) => {
    setActive(cat);
    setSeconds(0);
    setPaused(false);
    localStorage.setItem('babytrack_timer', JSON.stringify({ category: cat, startTime: Date.now(), paused: false }));
  }, []);

  const stop = useCallback(() => {
    setActive((currentActive) => {
      setSeconds((currentSeconds) => {
        if (currentActive && currentSeconds > 0) {
          const config = categoryConfig[currentActive];
          const durationMin = Math.max(1, Math.round(currentSeconds / 60));
          const startedAt = new Date(Date.now() - currentSeconds * 1000).toISOString();
          eventsDB.create({
            type: config.eventType,
            title: config.label,
            timestamp: startedAt,
            duration: durationMin,
            data: { source: 'timer' },
          });
          toast({ title: "✅ Записано", description: `${config.label} — ${formatTime(currentSeconds)}` });
        }
        return 0;
      });
      return null;
    });
    setPaused(false);
    localStorage.removeItem('babytrack_timer');
  }, []);

  if (!active) {
    return (
      <div className="px-4">
        <h2 className="text-sm font-medium text-muted-foreground mb-3 uppercase tracking-wide">
          Таймеры
        </h2>
        <motion.div
          className="grid grid-cols-3 gap-3"
          initial="hidden"
          animate="visible"
          variants={{ visible: { transition: { staggerChildren: 0.05 } } }}
        >
          {(Object.entries(categoryConfig) as [TimerCategory, typeof categoryConfig.sleep][]).map(([key, config]) => {
            const Icon = config.icon;
            return (
              <motion.button
                key={key}
                variants={{ hidden: { opacity: 0, scale: 0.9 }, visible: { opacity: 1, scale: 1 } }}
                whileTap={{ scale: 0.95 }}
                onClick={() => start(key)}
                className={cn("glass-card p-4 flex flex-col items-center gap-2", "hover:border-white/10 transition-colors")}
              >
                <Icon className={cn("w-6 h-6", config.color)} />
                <span className="text-xs font-medium text-muted-foreground">{config.label}</span>
                <Play className="w-4 h-4 text-muted-foreground" />
              </motion.button>
            );
          })}
        </motion.div>
      </div>
    );
  }

  const config = categoryConfig[active];
  const Icon = config.icon;

  return (
    <div className="px-4">
      <motion.div
        className="glass-card p-6 flex flex-col items-center gap-4 relative overflow-hidden"
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        style={{ boxShadow: `0 0 60px -15px ${config.glow}` }}
      >
        <motion.div
          className="absolute inset-0 rounded-2xl border-2"
          style={{ borderColor: config.glow }}
          animate={{ opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
        <div className="flex items-center gap-2">
          <Icon className={cn("w-5 h-5", config.color)} />
          <span className={cn("text-sm font-medium", config.color)}>Таймер: {config.label}</span>
        </div>
        <motion.span
          className="text-5xl font-bold text-foreground tabular-nums tracking-tight"
          key={seconds}
          initial={{ scale: 1.05 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.15 }}
        >
          {formatTime(seconds)}
        </motion.span>
        <div className="flex gap-3">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => setPaused(!paused)}
            className="w-12 h-12 rounded-full bg-muted flex items-center justify-center"
          >
            {paused ? <Play className="w-5 h-5 text-foreground" /> : <Pause className="w-5 h-5 text-foreground" />}
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={stop}
            className="w-12 h-12 rounded-full bg-destructive/20 flex items-center justify-center"
          >
            <Square className="w-5 h-5 text-destructive" />
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}
