import { Home, Plus, BarChart3, MessageCircle, Settings } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";
import { LiquidSurface } from "@/components/ui/liquid-radio";

const tabs = [
  { icon: Home, labelKey: "home", path: "/" },
  { icon: BarChart3, labelKey: "stats", path: "/stats" },
  { icon: Plus, labelKey: "addEvent", path: "/add", isMain: true },
  { icon: MessageCircle, labelKey: "chat", path: "/chat" },
  { icon: Settings, labelKey: "settings", path: "/settings" },
];

export function TabBar() {
  const location = useLocation();
  const { t } = useI18n();

  return (
    <nav className="tab-bar md:hidden">
      {tabs.map((tab) => {
        const isActive = location.pathname === tab.path;
        const Icon = tab.icon;

        if (tab.isMain) {
          return (
            <Link key={tab.path} to={tab.path} className="relative -mt-8">
              <motion.div
                whileTap={{ scale: 0.9 }}
                whileHover={{ scale: 1.05 }}
              >
                <LiquidSurface
                  tone="primary"
                  active={isActive}
                  ambientDelay={1.4}
                  className="w-14 h-14 rounded-full"
                  contentClassName="w-full h-full rounded-full flex items-center justify-center"
                  style={{
                    background: "var(--primary-gradient, hsl(var(--primary)))",
                    boxShadow: "var(--fab-shadow, 0 8px 32px -4px hsl(var(--primary) / 0.4))",
                  }}
                >
                  <Icon className="w-6 h-6 text-primary-foreground" strokeWidth={2.5} />
                </LiquidSurface>
              </motion.div>
            </Link>
          );
        }

        return (
          <Link
            key={tab.path}
            to={tab.path}
            className="flex-1 flex justify-center"
          >
            <motion.div whileTap={{ scale: 0.94 }} whileHover={{ scale: 1.03 }}>
              <LiquidSurface
                tone={isActive ? "primary" : "neutral"}
                active={isActive}
                className="rounded-2xl"
                ambientDelay={tab.path === "/" ? 0.2 : tab.path === "/stats" ? 0.8 : tab.path === "/chat" ? 1.4 : 2}
                contentClassName={cn("tab-item relative px-2.5 py-2", isActive && "tab-item-active")}
              >
                <Icon className="w-6 h-6" strokeWidth={isActive ? 2 : 1.6} />
                <span className="text-2xs font-medium">{t(tab.labelKey)}</span>
                {isActive && (
                  <motion.div
                    layoutId="tab-indicator"
                    className="absolute -top-1.5 w-1 h-1 rounded-full bg-primary"
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                )}
              </LiquidSurface>
            </motion.div>
          </Link>
        );
      })}
    </nav>
  );
}
