import { Home, BarChart3, Plus, MessageCircle, Settings } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";
import { LiquidSurface } from "@/components/ui/liquid-radio";

const NAV_ITEMS = [
  { icon: Home,          labelKey: "home",     path: "/",         isMain: false },
  { icon: BarChart3,     labelKey: "stats",    path: "/stats",    isMain: false },
  { icon: Plus,          labelKey: "addEvent", path: "/add",      isMain: true  },
  { icon: MessageCircle, labelKey: "chat",     path: "/chat",     isMain: false },
  { icon: Settings,      labelKey: "settings", path: "/settings", isMain: false },
];

function calcAge(birthDateStr: string): string {
  const birth  = new Date(birthDateStr);
  const now    = new Date();
  const months =
    (now.getFullYear() - birth.getFullYear()) * 12 +
    (now.getMonth() - birth.getMonth());
  if (months < 1) return `${Math.max(0, now.getDate() - birth.getDate())} дн`;
  return `${months} мес`;
}

export function Sidebar() {
  const location = useLocation();
  const { t }    = useI18n();

  const name  = localStorage.getItem("babyName")  || "Малыш";
  const birth = localStorage.getItem("birthDate") || "2024-09-15";
  const age   = calcAge(birth);

  return (
    <aside
      className="hidden md:flex flex-col w-56 xl:w-64 min-h-screen sticky top-0 shrink-0"
      style={{
        background:  "var(--sidebar-gradient, hsl(var(--card)))",
        borderRight: "1px solid hsl(var(--border))",
      }}
    >
      {/* Baby profile card */}
      <div
        className="p-4 m-3 mb-1 rounded-2xl"
        style={{
          background: "var(--primary-gradient, hsl(var(--primary)))",
          opacity: 0.95,
        }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0"
            style={{ background: "rgba(255,255,255,0.18)" }}
          >
            👶
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-white truncate">{name}</p>
            <p className="text-xs text-white/65">{age}</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex flex-col gap-0.5 p-3 flex-1 pt-2">
        {NAV_ITEMS.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon     = item.icon;

          if (item.isMain) {
            return (
              <Link key={item.path} to={item.path} className="my-1 block">
                <motion.div
                  whileTap={{ scale: 0.96 }}
                  whileHover={{ scale: 1.02 }}
                >
                  <LiquidSurface
                    tone="primary"
                    active={isActive}
                    className="rounded-2xl"
                    ambientDelay={1.2}
                    contentClassName="flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold text-white"
                    style={{
                      background: "var(--primary-gradient, hsl(var(--primary)))",
                      boxShadow: "var(--fab-shadow, 0 4px 16px rgba(0,0,0,0.25))",
                    }}
                  >
                    <Icon className="w-5 h-5 shrink-0" />
                    <span>{t(item.labelKey)}</span>
                  </LiquidSurface>
                </motion.div>
              </Link>
            );
          }

          return (
            <Link key={item.path} to={item.path} className="group block">
              <motion.div
                whileTap={{ scale: 0.97 }}
                whileHover={{ scale: 1.01 }}
              >
                <LiquidSurface
                  tone={isActive ? "primary" : "neutral"}
                  active={isActive}
                  className="rounded-xl"
                  ambientDelay={item.path === "/" ? 0.2 : item.path === "/stats" ? 0.8 : item.path === "/chat" ? 1.4 : 2}
                  contentClassName={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
                    isActive ? "text-foreground" : "text-muted-foreground hover:text-foreground/80",
                  )}
                  contentStyle={isActive ? { paddingLeft: 10 } : undefined}
                  style={isActive ? {
                    background: "hsl(var(--accent))",
                    borderLeft: "2.5px solid hsl(var(--primary))",
                  } : undefined}
                >
                  <Icon
                    className={cn(
                      "w-5 h-5 shrink-0 transition-colors",
                      isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground/80",
                    )}
                    strokeWidth={isActive ? 2.2 : 1.7}
                  />
                  <span className={cn(isActive ? "text-foreground" : "text-muted-foreground group-hover:text-foreground/80")}>
                    {t(item.labelKey)}
                  </span>
                </LiquidSurface>
              </motion.div>
            </Link>
          );
        })}
      </nav>

      {/* Version footer */}
      <div className="p-4 text-center" style={{ borderTop: "1px solid hsl(var(--border))" }}>
        <p className="text-[10px] text-muted-foreground/40">BabyTrack v2.1.0</p>
      </div>
    </aside>
  );
}
