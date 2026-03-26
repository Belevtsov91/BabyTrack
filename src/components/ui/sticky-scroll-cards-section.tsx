import React, {
  useEffect,
  useRef,
  useState,
  type HTMLAttributes,
  type ImgHTMLAttributes,
} from "react";
import {
  Baby,
  Camera,
  ChevronRight,
  Footprints,
  Heart,
  Milk,
  MoonStar,
  Ruler,
  ShieldPlus,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import SpotlightCard from "@/components/ui/spotlight-card";

export type StickyScrollTone =
  | "primary"
  | "sleep"
  | "feeding"
  | "diaper"
  | "activity"
  | "growth"
  | "health"
  | "mood"
  | "milestone";

export interface StickyScrollCardItem {
  id: string;
  eyebrow?: string;
  title: string;
  description: string;
  meta?: string;
  imageUrl?: string;
  imageAlt?: string;
  emoji?: string;
  icon?: LucideIcon;
  tone?: StickyScrollTone;
  accent?: string;
  actionLabel?: string;
}

interface StickyScrollCardsSectionProps extends HTMLAttributes<HTMLDivElement> {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  items: StickyScrollCardItem[];
  stickyTop?: number | string;
  stickyFrom?: "base" | "sm" | "md" | "lg";
}

const TONE_TO_ACCENT: Record<StickyScrollTone, string> = {
  primary: "hsl(var(--primary))",
  sleep: "hsl(var(--sleep))",
  feeding: "hsl(var(--feeding))",
  diaper: "hsl(var(--diaper))",
  activity: "hsl(var(--activity))",
  growth: "hsl(var(--growth))",
  health: "hsl(var(--health))",
  mood: "hsl(var(--mood))",
  milestone: "hsl(var(--milestone))",
};

const TONE_TO_ICON: Record<StickyScrollTone, LucideIcon> = {
  primary: Sparkles,
  sleep: MoonStar,
  feeding: Milk,
  diaper: Baby,
  activity: Footprints,
  growth: Ruler,
  health: ShieldPlus,
  mood: Heart,
  milestone: Camera,
};

const STICKY_CLASS_MAP: Record<NonNullable<StickyScrollCardsSectionProps["stickyFrom"]>, string> = {
  base: "sticky",
  sm: "sm:sticky",
  md: "md:sticky",
  lg: "lg:sticky",
};

function useReveal<T extends HTMLElement>() {
  const [inView, setInView] = useState(false);
  const ref = useRef<T | null>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setInView(true);
      },
      {
        threshold: 0.16,
        rootMargin: "0px 0px -8% 0px",
      },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return [ref, inView] as const;
}

function isRenderableImageUrl(src?: string): src is string {
  if (!src) return false;
  return /^(https?:|data:|blob:)/i.test(src);
}

function StoryImage({
  item,
  accent,
}: {
  item: StickyScrollCardItem;
  accent: string;
}) {
  const [failed, setFailed] = useState(false);
  const Icon = item.icon ?? TONE_TO_ICON[item.tone ?? "primary"];
  const canShowImage = isRenderableImageUrl(item.imageUrl) && !failed;

  const imageProps: ImgHTMLAttributes<HTMLImageElement> = canShowImage
    ? {
        src: item.imageUrl,
        alt: item.imageAlt ?? item.title,
        loading: "lazy",
        onError: () => setFailed(true),
      }
    : {};

  return (
    <div className="relative min-h-[200px] overflow-hidden rounded-[24px] border border-white/10 bg-black/10 sm:min-h-[220px] md:min-h-[240px] md:rounded-[28px]">
      <div
        aria-hidden="true"
        className="absolute inset-0 opacity-90"
        style={{
          background: [
            `radial-gradient(circle at 18% 24%, color-mix(in srgb, ${accent} 34%, transparent) 0%, transparent 48%)`,
            `linear-gradient(155deg, color-mix(in srgb, ${accent} 16%, hsl(var(--card-elevated))) 0%, hsl(var(--card)) 54%, color-mix(in srgb, ${accent} 10%, hsl(var(--background))) 100%)`,
          ].join(", "),
        }}
      />

      {canShowImage ? (
        <img
          {...imageProps}
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center">
          <div
            className="flex h-28 w-28 items-center justify-center rounded-[32px] border border-white/12 bg-black/15 shadow-[0_18px_48px_-24px_rgba(0,0,0,0.8)] backdrop-blur-sm"
            style={{
              boxShadow: `0 24px 60px -30px color-mix(in srgb, ${accent} 55%, rgba(0,0,0,0.5))`,
            }}
          >
            {item.emoji ? (
              <span className="text-6xl">{item.emoji}</span>
            ) : (
              <Icon className="h-12 w-12 text-white" />
            )}
          </div>
        </div>
      )}

      <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/55 via-black/15 to-transparent" />
      <div className="absolute right-4 top-4 rounded-full border border-white/10 bg-black/20 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/70 backdrop-blur-sm">
        {item.meta ?? "История"}
      </div>
    </div>
  );
}

function StickyStoryCard({
  item,
  index,
  total,
  stickyClass,
  stickyTop,
}: {
  item: StickyScrollCardItem;
  index: number;
  total: number;
  stickyClass: string;
  stickyTop: number | string;
}) {
  const [ref, inView] = useReveal<HTMLDivElement>();
  const accent = item.accent ?? TONE_TO_ACCENT[item.tone ?? "primary"];

  return (
    <div
      ref={ref}
      className={cn("mb-5 md:mb-8 lg:mb-12", stickyClass)}
      style={{ top: stickyTop, zIndex: total - index }}
    >
      <motion.div
        initial={false}
        animate={{
          opacity: inView ? 1 : 0.45,
          y: inView ? 0 : 26,
          scale: inView ? 1 : 0.985,
        }}
        transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
      >
        <SpotlightCard
          tone={item.tone ?? "primary"}
          accent={accent}
          intensity={index === 0 ? "strong" : "medium"}
          interactive={false}
          className="rounded-[28px] p-4 md:rounded-[32px] md:p-5 lg:p-6"
        >
          <div className="grid items-stretch gap-5 md:grid-cols-[minmax(0,1fr)_minmax(220px,0.82fr)] lg:grid-cols-[minmax(0,1fr)_minmax(280px,0.9fr)]">
            <div className="flex min-w-0 flex-col justify-between gap-6">
              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-3">
                  <span
                    className="inline-flex h-8 min-w-8 items-center justify-center rounded-full border border-white/10 px-2 text-[11px] font-bold text-white/80"
                    style={{ background: "rgba(255,255,255,0.04)" }}
                  >
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  {item.eyebrow ? (
                    <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-muted-foreground">
                      {item.eyebrow}
                    </p>
                  ) : null}
                </div>

                <div>
                  <h3 className="max-w-2xl text-xl font-semibold tracking-tight text-foreground sm:text-2xl md:text-[1.7rem]">
                    {item.title}
                  </h3>
                  <p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground md:text-base">
                    {item.description}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {item.meta ? (
                  <div className="rounded-full border border-white/10 bg-black/15 px-3 py-1.5 text-xs font-medium text-white/70">
                    {item.meta}
                  </div>
                ) : null}
                {item.actionLabel ? (
                  <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white/80">
                    {item.actionLabel}
                    <ChevronRight className="h-3.5 w-3.5" />
                  </div>
                ) : null}
              </div>
            </div>

            <StoryImage item={item} accent={accent} />
          </div>
        </SpotlightCard>
      </motion.div>
    </div>
  );
}

export function StickyScrollCardsSection({
  eyebrow,
  title,
  subtitle,
  items,
  stickyTop = 112,
  stickyFrom = "md",
  className,
  ...props
}: StickyScrollCardsSectionProps) {
  const [headerRef, headerInView] = useReveal<HTMLDivElement>();
  const stickyClass = STICKY_CLASS_MAP[stickyFrom];

  if (items.length === 0) return null;

  return (
    <section className={cn("w-full", className)} {...props}>
      <div ref={headerRef} className="mx-auto mb-8 max-w-3xl text-center md:mb-12">
        {eyebrow ? (
          <motion.p
            initial={false}
            animate={{
              opacity: headerInView ? 1 : 0,
              y: headerInView ? 0 : 20,
            }}
            transition={{ duration: 0.45 }}
            className="text-[11px] font-bold uppercase tracking-[0.24em] text-muted-foreground"
          >
            {eyebrow}
          </motion.p>
        ) : null}

        <motion.h2
          initial={false}
          animate={{
            opacity: headerInView ? 1 : 0,
            y: headerInView ? 0 : 22,
          }}
          transition={{ duration: 0.55, delay: 0.04 }}
          className="mt-3 text-3xl font-semibold tracking-tight text-foreground md:text-5xl"
        >
          {title}
        </motion.h2>

        {subtitle ? (
          <motion.p
            initial={false}
            animate={{
              opacity: headerInView ? 1 : 0,
              y: headerInView ? 0 : 18,
            }}
            transition={{ duration: 0.55, delay: 0.1 }}
            className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-muted-foreground md:text-base"
          >
            {subtitle}
          </motion.p>
        ) : null}
      </div>

      <div className="w-full pb-6">
        {items.map((item, index) => (
          <StickyStoryCard
            key={item.id}
            item={item}
            index={index}
            total={items.length}
            stickyClass={stickyClass}
            stickyTop={stickyTop}
          />
        ))}
      </div>
    </section>
  );
}

export default StickyScrollCardsSection;
