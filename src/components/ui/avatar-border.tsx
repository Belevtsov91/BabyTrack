"use client";

import { CheckIcon } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

export type AvatarBorderBadge = "none" | "online" | "verified";
export type AvatarBorderSize = "xs" | "sm" | "md" | "lg";

export interface AvatarBorderProps {
  name: string;
  src?: string;
  emoji?: string;
  accentVar?: string;
  badge?: AvatarBorderBadge;
  size?: AvatarBorderSize;
  className?: string;
}

const SIZE_MAP: Record<
  AvatarBorderSize,
  {
    avatar: string;
    fallback: string;
    wrapper: string;
    badge: string;
    badgeIcon: string;
    offset: string;
  }
> = {
  xs: {
    avatar: "h-8 w-8",
    fallback: "text-sm",
    wrapper: "p-[1.5px]",
    badge: "size-3",
    badgeIcon: "size-2",
    offset: "-bottom-0.5 -right-0.5",
  },
  sm: {
    avatar: "h-9 w-9",
    fallback: "text-base",
    wrapper: "p-[1.5px]",
    badge: "size-3.5",
    badgeIcon: "size-2.5",
    offset: "-bottom-0.5 -right-0.5",
  },
  md: {
    avatar: "h-10 w-10",
    fallback: "text-lg",
    wrapper: "p-[2px]",
    badge: "size-4",
    badgeIcon: "size-2.5",
    offset: "-bottom-1 -right-1",
  },
  lg: {
    avatar: "h-11 w-11",
    fallback: "text-xl",
    wrapper: "p-[2px]",
    badge: "size-4.5",
    badgeIcon: "size-3",
    offset: "-bottom-1 -right-1",
  },
};

function initialsFromName(name: string) {
  const compact = name.trim();
  if (!compact) return "?";
  const parts = compact.split(/\s+/).slice(0, 2);
  return parts.map((part) => part[0]?.toUpperCase() ?? "").join("") || compact.slice(0, 2).toUpperCase();
}

export default function AvatarBorder({
  name,
  src,
  emoji,
  accentVar = "--primary",
  badge = "none",
  size = "md",
  className,
}: AvatarBorderProps) {
  const sizeStyle = SIZE_MAP[size];
  const accent = `hsl(var(${accentVar}))`;
  const accentSoft = `hsl(var(${accentVar}) / 0.2)`;
  const badgeColor = badge === "online" ? "hsl(var(--feeding))" : accent;

  return (
    <div className={cn("relative inline-flex shrink-0", className)}>
      <div
        className={cn("rounded-full", sizeStyle.wrapper)}
        style={{
          background: `linear-gradient(145deg, ${accent}, ${accentSoft})`,
          boxShadow: `0 12px 24px -18px ${accent}`,
        }}
      >
        <Avatar className={cn("rounded-full border border-white/10 bg-card", sizeStyle.avatar)}>
          {src ? <AvatarImage src={src} alt={name} /> : null}
          <AvatarFallback
            className={cn("rounded-full text-white", sizeStyle.fallback)}
            style={{
              background: `linear-gradient(180deg, hsl(var(--card-elevated)), color-mix(in srgb, ${accentSoft} 60%, hsl(var(--card))))`,
            }}
          >
            {emoji ?? initialsFromName(name)}
          </AvatarFallback>
        </Avatar>
      </div>

      {badge !== "none" ? (
        <span
          className={cn(
            "absolute inline-flex items-center justify-center rounded-full border-2 border-background shadow-[0_6px_14px_-8px_rgba(0,0,0,0.9)]",
            sizeStyle.badge,
            sizeStyle.offset,
          )}
          style={{ background: badgeColor }}
        >
          {badge === "verified" ? (
            <CheckIcon className={cn("text-white", sizeStyle.badgeIcon)} strokeWidth={3} />
          ) : (
            <span className="size-1.5 rounded-full bg-white" />
          )}
        </span>
      ) : null}
    </div>
  );
}
