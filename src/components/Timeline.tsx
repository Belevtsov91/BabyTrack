import { useEffect, useState } from "react";
import { Moon, Baby, Droplets, Footprints, Thermometer, Smile, Star, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { BabyEvent, eventsDB } from "@/lib/crud";

const typeConfig: Record<string, { icon: LucideIcon; color: string; bg: string }> = {
  sleep: { icon: Moon, color: "text-[hsl(var(--sleep))]", bg: "bg-[hsl(var(--sleep-soft))]" },
  feeding: { icon: Baby, color: "text-[hsl(var(--feeding))]", bg: "bg-[hsl(var(--feeding-soft))]" },
  diaper: { icon: Droplets, color: "text-[hsl(var(--diaper))]", bg: "bg-[hsl(var(--diaper-soft))]" },
  activity: { icon: Footprints, color: "text-[hsl(var(--activity))]", bg: "bg-[hsl(var(--activity-soft))]" },
  temperature: { icon: Thermometer, color: "text-[hsl(var(--health))]", bg: "bg-[hsl(var(--health-soft))]" },
  mood: { icon: Smile, color: "text-[hsl(var(--mood))]", bg: "bg-[hsl(var(--mood-soft))]" },
  milestone: { icon: Star, color: "text-[hsl(var(--milestone))]", bg: "bg-[hsl(var(--milestone-soft))]" },
};

function formatRelativeTime(timestamp: string): string {
  const diffMinutes = Math.max(0, Math.floor((Date.now() - new Date(timestamp).getTime()) / 60000));
  if (diffMinutes < 1) return "только что";
  if (diffMinutes < 60) return `${diffMinutes}м назад`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}ч назад`;
  return `${Math.floor(diffHours / 24)}д назад`;
}

function getEventDetail(event: BabyEvent): string | undefined {
  if (event.duration) return `${event.duration} мин`;
  if (event.data?.amount) return `${event.data.amount} ${event.data.unit || "мл"}`;
  if (event.data?.diaperType) {
    const types: Record<string, string> = { wet: "Мокрый", dirty: "Грязный", mixed: "Смешанный" };
    return types[event.data.diaperType] || event.data.diaperType;
  }
  if (event.description) return event.description;
  return undefined;
}

function getEventRoute(event: BabyEvent): string {
  const subType = event.data?.eventSubType ?? event.data?.subType;
  if (subType) return `/event/${subType}`;
  if (event.type === "temperature") return "/event/temperature";
  if (event.type === "sleep") return "/event/sleep";
  if (event.type === "feeding") return "/event/bottle";
  if (event.type === "diaper") return "/event/diaper";
  if (event.type === "activity") return "/event/walk";
  return "/add";
}

export function Timeline() {
  const navigate = useNavigate();
  const [events, setEvents] = useState<BabyEvent[]>([]);

  useEffect(() => {
    const sync = () => {
      const allEvents = eventsDB.getAll().sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      const today = new Date().toISOString().slice(0, 10);
      const todayEvents = allEvents.filter((e) => e.timestamp.slice(0, 10) === today);
      setEvents(todayEvents.length > 0 ? todayEvents.slice(0, 8) : allEvents.slice(0, 5));
    };

    sync();
    const timer = window.setInterval(sync, 2500);
    const handleRefresh = () => sync();

    window.addEventListener("focus", handleRefresh);
    document.addEventListener("visibilitychange", handleRefresh);

    return () => {
      window.clearInterval(timer);
      window.removeEventListener("focus", handleRefresh);
      document.removeEventListener("visibilitychange", handleRefresh);
    };
  }, []);

  const isEmpty = events.length === 0;

  return (
    <div className="px-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Сегодня</h2>
        <button onClick={() => navigate("/calendar")} className="text-sm text-primary font-medium active:opacity-70">
          Все
        </button>
      </div>

      <div className="glass-card divide-y divide-border overflow-hidden">
        {isEmpty ? (
          <button
            onClick={() => navigate("/add")}
            className="flex flex-col items-center gap-2 p-8 w-full text-center"
          >
            <span className="text-3xl">📝</span>
            <p className="text-sm text-muted-foreground">Пока нет записей</p>
            <p className="text-xs text-primary font-medium">Нажмите чтобы добавить</p>
          </button>
        ) : (
          events.map((event, index) => {
            const config = typeConfig[event.type] || typeConfig.activity;
            const Icon = config.icon;
            const detail = getEventDetail(event);

            return (
              <button
                key={event.id}
                onClick={() => navigate(getEventRoute(event))}
                className={cn(
                  "flex items-center gap-3 p-4 active:bg-muted/50 transition-colors cursor-pointer w-full text-left",
                  "animate-fade-in"
                )}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", config.bg)}>
                  <Icon className={cn("w-5 h-5", config.color)} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">{event.title}</p>
                  {detail && <p className="text-xs text-muted-foreground">{detail}</p>}
                </div>
                <span className="text-xs text-muted-foreground">{formatRelativeTime(event.timestamp)}</span>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
