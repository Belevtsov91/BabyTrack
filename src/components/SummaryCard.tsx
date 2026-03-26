import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";

type CategoryType = 'sleep' | 'feeding' | 'diaper' | 'activity' | 'growth' | 'health' | 'mood';

interface SummaryCardProps {
  category: CategoryType;
  icon: ReactNode;
  title: string;
  value: string;
  subtitle?: string;
  lastTime?: string;
  onClick?: () => void;
}

const categoryStyles: Record<CategoryType, { bg: string; text: string; icon: string }> = {
  sleep: { bg: 'bg-sleep-soft', text: 'text-sleep', icon: 'bg-sleep/20' },
  feeding: { bg: 'bg-feeding-soft', text: 'text-feeding', icon: 'bg-feeding/20' },
  diaper: { bg: 'bg-diaper-soft', text: 'text-diaper', icon: 'bg-diaper/20' },
  activity: { bg: 'bg-activity-soft', text: 'text-activity', icon: 'bg-activity/20' },
  growth: { bg: 'bg-growth-soft', text: 'text-growth', icon: 'bg-growth/20' },
  health: { bg: 'bg-health-soft', text: 'text-health', icon: 'bg-health/20' },
  mood: { bg: 'bg-mood-soft', text: 'text-mood', icon: 'bg-mood/20' },
};

const categoryPaths: Record<CategoryType, string> = {
  sleep: '/event/sleep',
  feeding: '/event/bottle',
  diaper: '/event/diaper',
  activity: '/event/walk',
  growth: '/growth',
  health: '/temperature',
  mood: '/event/mood',
};

export function SummaryCard({ category, icon, title, value, subtitle, lastTime, onClick }: SummaryCardProps) {
  const navigate = useNavigate();
  const styles = categoryStyles[category];

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      navigate(categoryPaths[category] || '/add');
    }
  };

  return (
    <button
      onClick={handleClick}
      className={cn(
        "glass-card p-4 flex flex-col gap-3 animate-fade-in text-left w-full",
        "active:scale-[0.98] transition-transform cursor-pointer"
      )}
    >
      <div className="flex items-center justify-between">
        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", styles.icon)}>
          <span className={styles.text}>{icon}</span>
        </div>
        {lastTime && (
          <span className="text-xs text-muted-foreground">{lastTime}</span>
        )}
      </div>

      <div className="flex flex-col gap-0.5">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          {title}
        </span>
        <span className={cn("text-2xl font-semibold", styles.text)}>
          {value}
        </span>
        {subtitle && (
          <span className="text-sm text-muted-foreground">{subtitle}</span>
        )}
      </div>
    </button>
  );
}
