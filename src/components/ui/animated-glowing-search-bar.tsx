import * as React from "react";
import { Search, SlidersHorizontal } from "lucide-react";

import { cn } from "@/lib/utils";

const toHsl = (colorVar: string) => `hsl(var(${colorVar}))`;
const toHslAlpha = (colorVar: string, alpha: number) => `hsl(var(${colorVar}) / ${alpha})`;

export interface AnimatedGlowingSearchBarProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange"> {
  value: string;
  onValueChange: (value: string) => void;
  accentVar?: string;
  trailing?: React.ReactNode;
  shellClassName?: string;
}

const AnimatedGlowingSearchBar = React.forwardRef<HTMLInputElement, AnimatedGlowingSearchBarProps>(
  (
    {
      value,
      onValueChange,
      accentVar = "--milestone",
      trailing,
      shellClassName,
      className,
      placeholder = "Search...",
      style,
      ...props
    },
    ref,
  ) => {
    const secondaryVar = accentVar === "--milestone" ? "--sleep" : "--milestone";

    const rootStyle = {
      "--search-glow-primary": toHsl(accentVar),
      "--search-glow-primary-soft": toHslAlpha(accentVar, 0.42),
      "--search-glow-secondary": toHsl(secondaryVar),
      "--search-glow-secondary-soft": toHslAlpha(secondaryVar, 0.26),
      "--search-surface-top": "color-mix(in srgb, hsl(var(--card)) 84%, black 16%)",
      "--search-surface-bottom": "color-mix(in srgb, hsl(var(--background)) 88%, black 12%)",
      "--search-border": toHslAlpha(accentVar, 0.36),
      ...style,
    } as React.CSSProperties;

    return (
      <div className={cn("group relative isolate w-full", shellClassName)} style={rootStyle}>
        <div className="pointer-events-none absolute -inset-2 z-0 overflow-hidden rounded-[28px] opacity-75 blur-xl transition-opacity duration-500 group-hover:opacity-100 group-focus-within:opacity-100">
          <div
            className="absolute left-1/2 top-1/2 h-[260%] w-[260%] -translate-x-1/2 -translate-y-1/2 animate-[spin_10s_linear_infinite] group-hover:animate-[spin_5.5s_linear_infinite] group-focus-within:animate-[spin_3.8s_linear_infinite]"
            style={{
              background:
                "conic-gradient(from 92deg, transparent 0deg, var(--search-glow-primary) 18deg, transparent 74deg, transparent 210deg, var(--search-glow-secondary) 252deg, transparent 318deg)",
            }}
          />
        </div>

        <div className="relative z-[1] overflow-hidden rounded-[24px] p-[1.5px]">
          <div
            className="pointer-events-none absolute inset-0 overflow-hidden rounded-[24px]"
            aria-hidden="true"
          >
            <div
              className="absolute left-1/2 top-1/2 h-[240%] w-[240%] -translate-x-1/2 -translate-y-1/2 animate-[spin_8s_linear_infinite] group-hover:animate-[spin_4.5s_linear_infinite] group-focus-within:animate-[spin_3s_linear_infinite]"
              style={{
                background:
                  "conic-gradient(from 96deg, rgba(255,255,255,0.02) 0deg, var(--search-glow-primary-soft) 26deg, transparent 84deg, transparent 204deg, var(--search-glow-secondary-soft) 248deg, transparent 322deg)",
              }}
            />
          </div>

          <div
            className="relative flex min-h-[58px] w-full items-center gap-3 overflow-hidden rounded-[22px] border px-4 py-1.5 shadow-[0_18px_42px_-28px_rgba(0,0,0,0.95)] transition-all duration-300"
            style={{
              background: "linear-gradient(180deg, var(--search-surface-top), var(--search-surface-bottom))",
              borderColor: "color-mix(in srgb, var(--search-border) 78%, rgba(255,255,255,0.08))",
              boxShadow:
                "0 18px 42px -28px rgba(0,0,0,0.95), inset 0 1px 0 rgba(255,255,255,0.05), inset 0 0 18px rgba(255,255,255,0.02)",
            }}
          >
            <div className="pointer-events-none absolute inset-0 rounded-[22px] bg-[linear-gradient(135deg,rgba(255,255,255,0.045),transparent_34%,transparent_68%,rgba(255,255,255,0.03))]" />
            <div className="pointer-events-none absolute inset-y-2 left-14 w-20 rounded-full bg-[radial-gradient(circle_at_center,var(--search-glow-primary-soft),transparent_72%)] opacity-80 blur-xl transition-opacity duration-500 group-focus-within:opacity-100" />
            <div className="pointer-events-none absolute inset-x-10 bottom-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-80" />

            <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-[16px] border border-white/8 bg-black/20 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
              <Search className="h-5 w-5 text-white/80" strokeWidth={2.1} />
            </div>

            <div className="min-w-0 flex-1">
              <input
                ref={ref}
                value={value}
                onChange={(event) => onValueChange(event.target.value)}
                placeholder={placeholder}
                className={cn(
                  "h-12 w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground/70 focus:outline-none md:text-[15px]",
                  className,
                )}
                {...props}
              />
            </div>

            <div className="flex shrink-0 items-center gap-2">
              {trailing ? (
                trailing
              ) : (
                <div className="relative flex h-11 w-11 items-center justify-center overflow-hidden rounded-[16px] border border-white/10 bg-black/25 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
                  <div
                    className="pointer-events-none absolute left-1/2 top-1/2 h-[180%] w-[180%] -translate-x-1/2 -translate-y-1/2 animate-[spin_12s_linear_infinite]"
                    style={{
                      background:
                        "conic-gradient(from 90deg, transparent 0deg, rgba(255,255,255,0.08) 22deg, transparent 92deg, transparent 220deg, rgba(255,255,255,0.14) 260deg, transparent 320deg)",
                    }}
                  />
                  <div className="relative z-[1] flex h-full w-full items-center justify-center rounded-[15px] bg-[linear-gradient(180deg,rgba(14,16,24,0.92),rgba(3,4,8,0.96))]">
                    <SlidersHorizontal className="h-4.5 w-4.5 text-white/75" strokeWidth={2.1} />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  },
);

AnimatedGlowingSearchBar.displayName = "AnimatedGlowingSearchBar";

export default AnimatedGlowingSearchBar;
