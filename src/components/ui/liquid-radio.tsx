import * as React from "react";

import { cn } from "@/lib/utils";

export type LiquidTone =
  | "neutral"
  | "primary"
  | "sleep"
  | "feeding"
  | "diaper"
  | "activity"
  | "growth"
  | "health"
  | "mood"
  | "milestone";

type LiquidVars = React.CSSProperties & {
  "--liquid-fill"?: string;
  "--liquid-fill-soft"?: string;
  "--liquid-highlight"?: string;
  "--liquid-outline"?: string;
  "--liquid-delay"?: string;
};

const TONE_VARS: Record<LiquidTone, LiquidVars> = {
  neutral: {
    "--liquid-fill": "hsl(0 0% 100% / 0.16)",
    "--liquid-fill-soft": "hsl(0 0% 100% / 0.08)",
    "--liquid-highlight": "hsl(0 0% 100% / 0.18)",
    "--liquid-outline": "hsl(0 0% 100% / 0.16)",
  },
  primary: {
    "--liquid-fill": "hsl(var(--primary) / 0.26)",
    "--liquid-fill-soft": "hsl(var(--primary) / 0.14)",
    "--liquid-highlight": "hsl(0 0% 100% / 0.2)",
    "--liquid-outline": "hsl(var(--primary) / 0.34)",
  },
  sleep: {
    "--liquid-fill": "hsl(var(--sleep) / 0.28)",
    "--liquid-fill-soft": "hsl(var(--sleep) / 0.12)",
    "--liquid-highlight": "hsl(0 0% 100% / 0.18)",
    "--liquid-outline": "hsl(var(--sleep) / 0.34)",
  },
  feeding: {
    "--liquid-fill": "hsl(var(--feeding) / 0.28)",
    "--liquid-fill-soft": "hsl(var(--feeding) / 0.12)",
    "--liquid-highlight": "hsl(0 0% 100% / 0.18)",
    "--liquid-outline": "hsl(var(--feeding) / 0.34)",
  },
  diaper: {
    "--liquid-fill": "hsl(var(--diaper) / 0.3)",
    "--liquid-fill-soft": "hsl(var(--diaper) / 0.12)",
    "--liquid-highlight": "hsl(0 0% 100% / 0.18)",
    "--liquid-outline": "hsl(var(--diaper) / 0.34)",
  },
  activity: {
    "--liquid-fill": "hsl(var(--activity) / 0.28)",
    "--liquid-fill-soft": "hsl(var(--activity) / 0.12)",
    "--liquid-highlight": "hsl(0 0% 100% / 0.18)",
    "--liquid-outline": "hsl(var(--activity) / 0.34)",
  },
  growth: {
    "--liquid-fill": "hsl(var(--growth) / 0.28)",
    "--liquid-fill-soft": "hsl(var(--growth) / 0.12)",
    "--liquid-highlight": "hsl(0 0% 100% / 0.18)",
    "--liquid-outline": "hsl(var(--growth) / 0.34)",
  },
  health: {
    "--liquid-fill": "hsl(var(--health) / 0.28)",
    "--liquid-fill-soft": "hsl(var(--health) / 0.12)",
    "--liquid-highlight": "hsl(0 0% 100% / 0.18)",
    "--liquid-outline": "hsl(var(--health) / 0.34)",
  },
  mood: {
    "--liquid-fill": "hsl(var(--mood) / 0.28)",
    "--liquid-fill-soft": "hsl(var(--mood) / 0.12)",
    "--liquid-highlight": "hsl(0 0% 100% / 0.18)",
    "--liquid-outline": "hsl(var(--mood) / 0.34)",
  },
  milestone: {
    "--liquid-fill": "hsl(var(--milestone) / 0.3)",
    "--liquid-fill-soft": "hsl(var(--milestone) / 0.12)",
    "--liquid-highlight": "hsl(0 0% 100% / 0.18)",
    "--liquid-outline": "hsl(var(--milestone) / 0.34)",
  },
};

export const LIQUID_TONE_BY_COLOR_VAR: Record<string, LiquidTone> = {
  "--primary": "primary",
  "--sleep": "sleep",
  "--feeding": "feeding",
  "--diaper": "diaper",
  "--activity": "activity",
  "--growth": "growth",
  "--health": "health",
  "--mood": "mood",
  "--milestone": "milestone",
};

export function GlassFilter() {
  return (
    <svg aria-hidden="true" className="pointer-events-none absolute h-0 w-0 overflow-hidden opacity-0">
      <defs>
        <filter id="radio-glass" x="0%" y="0%" width="100%" height="100%" colorInterpolationFilters="sRGB">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.05 0.05"
            numOctaves="1"
            seed="1"
            result="turbulence"
          />
          <feGaussianBlur in="turbulence" stdDeviation="2" result="blurredNoise" />
          <feDisplacementMap
            in="SourceGraphic"
            in2="blurredNoise"
            scale="30"
            xChannelSelector="R"
            yChannelSelector="B"
            result="displaced"
          />
          <feGaussianBlur in="displaced" stdDeviation="2" result="finalBlur" />
          <feComposite in="finalBlur" in2="finalBlur" operator="over" />
        </filter>
      </defs>
    </svg>
  );
}

interface LiquidSurfaceProps extends React.HTMLAttributes<HTMLDivElement> {
  active?: boolean;
  tone?: LiquidTone;
  contentClassName?: string;
  contentStyle?: React.CSSProperties;
  ambient?: boolean;
  ambientDelay?: number;
}

export function LiquidSurface({
  active = false,
  tone = "neutral",
  className,
  contentClassName,
  contentStyle,
  ambient = true,
  ambientDelay = 0,
  style,
  children,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onPointerLeave,
  onPointerCancel,
  ...props
}: LiquidSurfaceProps) {
  const rootRef = React.useRef<HTMLDivElement>(null);
  const [pressed, setPressed] = React.useState(false);

  const updatePointerVars = React.useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    const rect = rootRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;

    rootRef.current?.style.setProperty("--liquid-x", `${Math.max(0, Math.min(100, x))}%`);
    rootRef.current?.style.setProperty("--liquid-y", `${Math.max(0, Math.min(100, y))}%`);
  }, []);

  return (
    <div
      ref={rootRef}
      data-active={active ? "true" : "false"}
      data-ambient={ambient ? "true" : "false"}
      data-pressed={pressed ? "true" : "false"}
      className={cn("liquid-surface", className)}
      style={{ ...TONE_VARS[tone], "--liquid-delay": `${ambientDelay}s`, ...style } as React.CSSProperties}
      onPointerDown={(event) => {
        updatePointerVars(event);
        setPressed(true);
        onPointerDown?.(event);
      }}
      onPointerMove={(event) => {
        updatePointerVars(event);
        onPointerMove?.(event);
      }}
      onPointerUp={(event) => {
        setPressed(false);
        onPointerUp?.(event);
      }}
      onPointerLeave={(event) => {
        setPressed(false);
        onPointerLeave?.(event);
      }}
      onPointerCancel={(event) => {
        setPressed(false);
        onPointerCancel?.(event);
      }}
      {...props}
    >
      <div aria-hidden="true" className="liquid-surface__ambient" />
      <div aria-hidden="true" className="liquid-surface__wave" style={{ filter: 'url("#radio-glass")' }} />
      <div className={cn("relative z-[1]", contentClassName)} style={contentStyle}>
        {children}
      </div>
    </div>
  );
}
