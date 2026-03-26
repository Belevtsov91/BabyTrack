import { useEffect, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { GripVertical, Moon, Baby, Milk, Droplets, Heart, Timer, Check, Footprints, Bath } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface FavoriteItem {
  id: string;
  icon: React.ReactNode;
  label: string;
  category: 'sleep' | 'feeding' | 'diaper' | 'activity';
  enabled: boolean;
}

const defaultFavorites: FavoriteItem[] = [
  { id: 'sleep', icon: <Moon className="w-5 h-5" />, label: 'Сон', category: 'sleep', enabled: true },
  { id: 'bottle', icon: <Baby className="w-5 h-5" />, label: 'Бутылочка', category: 'feeding', enabled: true },
  { id: 'breast', icon: <Heart className="w-5 h-5" />, label: 'Грудь', category: 'feeding', enabled: true },
  { id: 'diaper', icon: <Droplets className="w-5 h-5" />, label: 'Подгузник', category: 'diaper', enabled: true },
  { id: 'pump', icon: <Milk className="w-5 h-5" />, label: 'Сцеживание', category: 'feeding', enabled: true },
  { id: 'walk', icon: <Footprints className="w-5 h-5" />, label: 'Прогулка', category: 'activity', enabled: false },
  { id: 'bath', icon: <Bath className="w-5 h-5" />, label: 'Купание', category: 'activity', enabled: false },
  { id: 'timer', icon: <Timer className="w-5 h-5" />, label: 'Таймер', category: 'activity', enabled: false },
];

const categoryColors: Record<string, string> = {
  sleep: 'bg-[hsl(var(--sleep-soft))] text-[hsl(var(--sleep))]',
  feeding: 'bg-[hsl(var(--feeding-soft))] text-[hsl(var(--feeding))]',
  diaper: 'bg-[hsl(var(--diaper-soft))] text-[hsl(var(--diaper))]',
  activity: 'bg-[hsl(var(--activity-soft))] text-[hsl(var(--activity))]',
};

const STORAGE_KEY = "babytrack_favorites";

function readFavorites(): FavoriteItem[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return defaultFavorites;
    const enabledIds = new Set(JSON.parse(saved) as string[]);
    return defaultFavorites.map((item) => ({
      ...item,
      enabled: enabledIds.has(item.id),
    }));
  } catch {
    return defaultFavorites;
  }
}

export default function Favorites() {
  const [favorites, setFavorites] = useState<FavoriteItem[]>(() => readFavorites());

  const toggleFavorite = (id: string) => {
    setFavorites(prev => prev.map(f => f.id === id ? { ...f, enabled: !f.enabled } : f));
  };

  useEffect(() => {
    try {
      const enabledIds = favorites.filter((f) => f.enabled).map((f) => f.id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(enabledIds));
    } catch {}
  }, [favorites]);

  const enabledCount = favorites.filter(f => f.enabled).length;

  return (
    <AppLayout>
      <div className="flex flex-col gap-6 pt-safe pb-6">
        <header className="px-4 pt-4">
          <h1 className="text-2xl font-bold text-foreground">Быстрые действия</h1>
          <p className="text-sm text-muted-foreground mt-1">Настройте ярлыки на главном экране</p>
        </header>

        <div className="px-4">
          <div className="glass-card p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
              <GripVertical className="w-5 h-5 text-primary" />
            </div>
            <p className="text-sm text-muted-foreground flex-1">
              Включено {enabledCount} из {favorites.length} действий
            </p>
          </div>
        </div>

        <div className="px-4">
          <h2 className="text-sm font-medium text-muted-foreground mb-3 uppercase tracking-wide">
            Действия
          </h2>
          <div className="glass-card divide-y divide-border overflow-hidden">
            {favorites.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className={cn("flex items-center gap-3 p-4 transition-opacity", !item.enabled && "opacity-50")}
              >
                <GripVertical className="w-5 h-5 text-muted-foreground cursor-grab" />
                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", categoryColors[item.category])}>
                  {item.icon}
                </div>
                <span className="flex-1 font-medium text-foreground">{item.label}</span>
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={() => toggleFavorite(item.id)}
                  className={cn(
                    "w-7 h-7 rounded-lg flex items-center justify-center transition-colors",
                    item.enabled ? "bg-primary text-primary-foreground" : "bg-muted text-transparent"
                  )}
                >
                  <Check className="w-4 h-4" />
                </motion.button>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
