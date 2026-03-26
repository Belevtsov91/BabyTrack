import { useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Baby,
  CalendarDays,
  Camera,
  Clock3,
  Flag,
  Footprints,
  HeartPulse,
  Milk,
  MoonStar,
  ShieldPlus,
  Sparkles,
} from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";

import { Button } from "@/components/ui/button";
import SpotlightCard from "@/components/ui/spotlight-card";
import StickyScrollCardsSection from "@/components/ui/sticky-scroll-cards-section";
import {
  getSessionRecapDismissedContext,
  setLastAppVisitAt,
  setSessionRecapDismissedContext,
} from "@/lib/appStorage";
import {
  buildSessionRecapSummary,
  markSessionEntryHandled,
  type RecapHighlightKind,
  type RecapTone,
} from "@/lib/sessionRecap";

function sanitizeNextPath(nextPath: string | null): string {
  if (!nextPath || !nextPath.startsWith("/") || nextPath.startsWith("/session-recap")) {
    return "/";
  }
  return nextPath;
}

function getHighlightIcon(kind: RecapHighlightKind) {
  switch (kind) {
    case "sleep":
      return MoonStar;
    case "feeding":
      return Milk;
    case "health":
      return ShieldPlus;
    case "milestone":
      return Flag;
    case "photo":
      return Camera;
    case "activity":
      return Footprints;
    case "sparkles":
    default:
      return Sparkles;
  }
}

function getTimelineIcon(tone: RecapTone, kind: string) {
  if (kind === "photo") return Camera;
  if (kind === "milestone") return Flag;
  if (kind === "temperature") return HeartPulse;

  switch (tone) {
    case "sleep":
      return MoonStar;
    case "feeding":
      return Milk;
    case "health":
      return ShieldPlus;
    case "activity":
      return Footprints;
    case "milestone":
      return Flag;
    default:
      return Baby;
  }
}

export default function SessionRecap() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const nextPath = sanitizeNextPath(searchParams.get("next"));
  const previewMode = searchParams.get("preview") === "1";
  const seenAt = useMemo(() => new Date().toISOString(), []);
  const summary = useMemo(() => buildSessionRecapSummary(), []);
  const dismissedContext = getSessionRecapDismissedContext();
  const shouldAutoSkip = !summary || (!previewMode && dismissedContext === summary.contextKey);

  useEffect(() => {
    if (!shouldAutoSkip) return;
    markSessionEntryHandled();
    setLastAppVisitAt(seenAt);
    navigate(nextPath, { replace: true });
  }, [navigate, nextPath, seenAt, shouldAutoSkip]);

  if (!summary || shouldAutoSkip) return null;

  const handleContinue = () => {
    if (!previewMode) {
      setSessionRecapDismissedContext(summary.contextKey);
      setLastAppVisitAt(seenAt);
      markSessionEntryHandled();
    }
    navigate(nextPath, { replace: true });
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      <div className="pointer-events-none absolute inset-0">
        {[
          { color: "hsl(var(--sleep))", left: "-8%", top: "-4%" },
          { color: "hsl(var(--activity))", left: "72%", top: "12%" },
          { color: "hsl(var(--milestone))", left: "12%", top: "74%" },
        ].map((orb, index) => (
          <motion.div
            key={index}
            className="absolute h-56 w-56 rounded-full blur-3xl opacity-20"
            style={{ background: orb.color, left: orb.left, top: orb.top }}
            animate={{ scale: [1, 1.12, 1], opacity: [0.14, 0.22, 0.14] }}
            transition={{ duration: 6 + index, repeat: Infinity, ease: "easeInOut" }}
          />
        ))}
      </div>

      <div className="relative mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 py-6 md:px-6 md:py-8">
        <div className="mx-auto flex w-full max-w-md flex-1 flex-col gap-5 md:max-w-none">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-5"
          >
            <SpotlightCard tone="primary" intensity="strong" className="overflow-hidden rounded-[32px] p-6 md:p-8">
              <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                <div className="max-w-2xl space-y-4">
                  <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.22em] text-white/70">
                    <Sparkles className="h-3.5 w-3.5 text-[hsl(var(--primary))]" />
                    {previewMode ? "Предпросмотр" : summary.badgeLabel}
                  </div>
                  <div>
                    <h1 className="text-3xl font-semibold tracking-tight text-white md:text-4xl">
                      {summary.title}
                    </h1>
                    <p className="mt-3 max-w-xl text-sm leading-6 text-white/65 md:text-base">
                      {summary.subtitle}
                    </p>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-3xl border border-white/10 bg-black/20 px-4 py-4">
                    <p className="text-[11px] uppercase tracking-[0.2em] text-white/45">Окно</p>
                    <p className="mt-2 text-sm font-semibold text-white">{summary.windowLabel}</p>
                  </div>
                  <div className="rounded-3xl border border-white/10 bg-black/20 px-4 py-4">
                    <p className="text-[11px] uppercase tracking-[0.2em] text-white/45">Новых моментов</p>
                    <p className="mt-2 text-2xl font-semibold text-white">{summary.totalItems}</p>
                  </div>
                </div>
              </div>
            </SpotlightCard>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {summary.metrics.map((metric, index) => (
                <motion.div
                  key={metric.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.08 + index * 0.05 }}
                >
                  <SpotlightCard tone={metric.tone} intensity="soft" className="rounded-3xl p-4">
                    <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">{metric.label}</p>
                    <p className="mt-3 text-2xl font-semibold text-foreground">{metric.value}</p>
                    <p className="mt-2 text-sm text-muted-foreground">{metric.note}</p>
                  </SpotlightCard>
                </motion.div>
              ))}
            </div>

            <StickyScrollCardsSection
              eyebrow={summary.mode === "since-last-visit" ? "История окна" : "История вчера"}
              title={
                summary.mode === "since-last-visit"
                  ? "Как складывался этот промежуток"
                  : "Как выглядел вчерашний день"
              }
              subtitle={
                summary.mode === "since-last-visit"
                  ? "Прокрутите вниз, чтобы увидеть, какие моменты, записи и ритуалы накопились с прошлого визита."
                  : "Собрали короткую вертикальную историю вчерашнего дня, чтобы быстро вернуться в контекст."
              }
              items={summary.stories}
              stickyFrom="base"
              stickyTop="clamp(0.75rem, 6svh, 6rem)"
            />
          </motion.div>

          <div className="grid flex-1 gap-5 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="space-y-4"
            >
              <div className="flex items-center gap-2 px-1 text-xs font-bold uppercase tracking-[0.22em] text-muted-foreground">
                <CalendarDays className="h-4 w-4" />
                Коротко о главном
              </div>

              <div className="grid gap-3">
                {summary.highlights.map((highlight) => {
                  const Icon = getHighlightIcon(highlight.kind);

                  return (
                    <SpotlightCard
                      key={highlight.id}
                      tone={highlight.tone}
                      intensity="soft"
                      className="rounded-3xl p-5"
                    >
                      <div className="flex items-start gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
                          <Icon className="h-5 w-5 text-white/85" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-lg font-semibold text-foreground">{highlight.title}</p>
                          <p className="mt-2 text-sm leading-6 text-muted-foreground">{highlight.description}</p>
                        </div>
                      </div>
                    </SpotlightCard>
                  );
                })}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.28 }}
              className="space-y-4"
            >
              <div className="flex items-center gap-2 px-1 text-xs font-bold uppercase tracking-[0.22em] text-muted-foreground">
                <Clock3 className="h-4 w-4" />
                Последние записи
              </div>

              <SpotlightCard tone="activity" intensity="soft" className="rounded-[32px] p-4">
                <div className="space-y-3">
                  {summary.timeline.map((item, index) => {
                    const Icon = getTimelineIcon(item.tone, item.kind);

                    return (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, x: 12 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.36 + index * 0.06 }}
                        className="rounded-3xl border border-white/10 bg-black/10 px-4 py-4"
                      >
                        <div className="flex items-start gap-3">
                          <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
                            <Icon className="h-[18px] w-[18px] text-white/80" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <p className="font-semibold text-foreground">{item.title}</p>
                              <span className="text-xs text-muted-foreground">{item.timeLabel}</span>
                            </div>
                            <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.description}</p>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </SpotlightCard>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.34 }}
            className="sticky bottom-0 mt-auto pb-2 pt-2"
          >
            <SpotlightCard tone="primary" intensity="soft" className="rounded-[28px] p-3">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div className="px-2 py-1">
                  <p className="text-sm font-semibold text-foreground">Всё просмотрено</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Продолжим работу с приложением и обновим сводку на следующем входе.
                  </p>
                </div>

                <Button
                  type="button"
                  size="lg"
                  className="h-12 rounded-2xl px-6"
                  onClick={handleContinue}
                >
                  Далее
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </SpotlightCard>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
