import { useEffect, useMemo, useRef, useState, type ElementType } from "react";
import { ArrowRight, Link2, Pause, Play, Sparkles, Zap } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

export interface RadialTimelineItem {
  id: number;
  title: string;
  date: string;
  content: string;
  category: string;
  icon: ElementType;
  relatedIds: number[];
  status: "completed" | "in-progress" | "pending";
  energy: number;
  accent?: string;
}

interface RadialOrbitalTimelineProps {
  timelineData: RadialTimelineItem[];
  title?: string;
  subtitle?: string;
  className?: string;
}

const SURFACE = "hsl(var(--card) / 0.78)";
const BORDER = "hsl(0 0% 100% / 0.08)";

function tint(color: string, opacity: number): string {
  return color.replace(/\)$/, ` / ${opacity})`);
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function getStatusMeta(status: RadialTimelineItem["status"]) {
  switch (status) {
    case "completed":
      return {
        label: "Готово",
        color: "hsl(var(--feeding))",
      };
    case "in-progress":
      return {
        label: "В процессе",
        color: "hsl(var(--activity))",
      };
    case "pending":
    default:
      return {
        label: "Впереди",
        color: "hsl(var(--milestone))",
      };
  }
}

export default function RadialOrbitalTimeline({
  timelineData,
  title = "Орбитальная лента роста",
  subtitle = "Коснитесь узла, чтобы открыть связанный момент и посмотреть, как события соединяются между собой.",
  className,
}: RadialOrbitalTimelineProps) {
  const [activeNodeId, setActiveNodeId] = useState<number | null>(timelineData[0]?.id ?? null);
  const [rotationAngle, setRotationAngle] = useState(0);
  const [autoRotate, setAutoRotate] = useState(true);
  const [orbitRadius, setOrbitRadius] = useState(132);
  const orbitViewportRef = useRef<HTMLDivElement>(null);
  const nodeRefs = useRef<Record<number, HTMLButtonElement | null>>({});

  const itemsById = useMemo(
    () => new Map(timelineData.map((item) => [item.id, item])),
    [timelineData],
  );

  const activeItem = activeNodeId === null ? null : itemsById.get(activeNodeId) ?? null;

  useEffect(() => {
    if (timelineData.length === 0) {
      setActiveNodeId(null);
      return;
    }

    if (activeNodeId === null) return;
    if (itemsById.has(activeNodeId)) return;
    setActiveNodeId(timelineData[0].id);
  }, [activeNodeId, itemsById, timelineData]);

  useEffect(() => {
    if (!activeItem) return;
    nodeRefs.current[activeItem.id]?.focus();
  }, [activeItem]);

  useEffect(() => {
    const viewport = orbitViewportRef.current;
    if (!viewport) return;

    const updateRadius = () => {
      const rect = viewport.getBoundingClientRect();
      const next = clamp(Math.min(rect.width, rect.height) * 0.34, 92, 186);
      setOrbitRadius(next);
    };

    updateRadius();

    if (typeof ResizeObserver !== "undefined") {
      const observer = new ResizeObserver(updateRadius);
      observer.observe(viewport);
      return () => observer.disconnect();
    }

    window.addEventListener("resize", updateRadius);
    return () => window.removeEventListener("resize", updateRadius);
  }, []);

  useEffect(() => {
    if (!autoRotate || timelineData.length <= 1) return;

    const timer = window.setInterval(() => {
      setRotationAngle((prev) => (prev + 0.28) % 360);
    }, 36);

    return () => window.clearInterval(timer);
  }, [autoRotate, timelineData.length]);

  const getRelatedIds = (itemId: number) => itemsById.get(itemId)?.relatedIds ?? [];

  const isRelatedToActive = (itemId: number) =>
    activeNodeId !== null && getRelatedIds(activeNodeId).includes(itemId);

  const centerOrbitOnNode = (nodeId: number) => {
    const index = timelineData.findIndex((item) => item.id === nodeId);
    if (index === -1 || timelineData.length === 0) return;

    const baseAngle = (index / timelineData.length) * 360;
    setRotationAngle(-baseAngle);
  };

  const toggleNode = (nodeId: number) => {
    if (activeNodeId === nodeId) {
      setActiveNodeId(null);
      setAutoRotate(true);
      return;
    }

    setActiveNodeId(nodeId);
    setAutoRotate(false);
    centerOrbitOnNode(nodeId);
  };

  const calculatePosition = (index: number, total: number) => {
    const baseAngle = (index / total) * 360;
    const angle = baseAngle + rotationAngle - 90;
    const radian = (angle * Math.PI) / 180;
    const x = orbitRadius * Math.cos(radian);
    const y = orbitRadius * Math.sin(radian);
    const frontness = (1 - Math.sin(radian)) / 2;

    return {
      angle,
      x,
      y,
      opacity: 0.42 + frontness * 0.58,
      scale: 0.78 + frontness * 0.32,
      zIndex: Math.round(30 + frontness * 60),
    };
  };

  if (timelineData.length === 0) {
    return (
      <Card className={cn("border-white/10 bg-card/80 backdrop-blur-xl", className)}>
        <CardHeader>
          <CardTitle className="text-lg">Созвездие пока пусто</CardTitle>
          <CardDescription>
            Добавь несколько событий или достижений, и здесь появится орбитальная история роста.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <section
      className={cn("rounded-[32px] border overflow-hidden", className)}
      style={{
        background: "linear-gradient(180deg, hsl(var(--card) / 0.92), hsl(var(--background) / 0.95))",
        borderColor: "hsl(var(--border))",
        boxShadow: "0 30px 80px -55px rgba(0, 0, 0, 0.85)",
      }}
    >
      <div
        className="flex flex-col gap-4 border-b px-5 py-5 md:flex-row md:items-start md:justify-between md:px-6"
        style={{ borderColor: BORDER }}
      >
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-[0.24em] text-white/65"
            style={{ borderColor: "hsl(var(--sleep) / 0.18)", background: "hsl(var(--sleep) / 0.08)" }}>
            <Sparkles className="h-3.5 w-3.5 text-[hsl(var(--sleep))]" />
            Космос развития
          </div>
          <div>
            <h3 className="text-xl font-semibold text-foreground md:text-2xl">{title}</h3>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">{subtitle}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="border-white/10 bg-white/5 text-white/80 hover:bg-white/10 hover:text-white"
            onClick={() => setAutoRotate((value) => !value)}
          >
            {autoRotate ? <Pause className="mr-1.5 h-4 w-4" /> : <Play className="mr-1.5 h-4 w-4" />}
            {autoRotate ? "Пауза" : "Авто"}
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-white"
            onClick={() => {
              setActiveNodeId(null);
              setAutoRotate(true);
            }}
          >
            Сброс
          </Button>
        </div>
      </div>

      <div className="grid gap-5 p-4 md:p-6 xl:grid-cols-[minmax(0,1.2fr)_320px]">
        <div
          ref={orbitViewportRef}
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              setActiveNodeId(null);
              setAutoRotate(true);
            }
          }}
          className="relative min-h-[390px] overflow-hidden rounded-[30px] border md:min-h-[460px]"
          style={{
            background:
              "radial-gradient(circle at 50% 50%, hsl(var(--sleep) / 0.16) 0%, transparent 33%)," +
              "radial-gradient(circle at 24% 18%, hsl(var(--activity) / 0.14) 0%, transparent 30%)," +
              "radial-gradient(circle at 78% 78%, hsl(var(--milestone) / 0.14) 0%, transparent 28%)," +
              "linear-gradient(180deg, hsl(var(--background) / 0.98), hsl(var(--card) / 0.92))",
            borderColor: BORDER,
          }}
        >
          <div className="absolute inset-0 opacity-60">
            {[0, 1].map((ring) => (
              <div
                key={ring}
                className="absolute left-1/2 top-1/2 rounded-full border"
                style={{
                  width: orbitRadius * (ring === 0 ? 2.15 : 2.8),
                  height: orbitRadius * (ring === 0 ? 2.15 : 2.8),
                  transform: "translate(-50%, -50%)",
                  borderColor: ring === 0 ? "hsl(0 0% 100% / 0.08)" : "hsl(0 0% 100% / 0.04)",
                }}
              />
            ))}
          </div>

          <div className="absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2">
            <div className="absolute inset-0 rounded-full blur-2xl"
              style={{ background: "radial-gradient(circle, hsl(var(--sleep) / 0.38) 0%, transparent 70%)", transform: "scale(1.45)" }} />
            <div
              className="relative flex h-20 w-20 flex-col items-center justify-center rounded-full border text-center md:h-24 md:w-24"
              style={{
                borderColor: "hsl(var(--sleep) / 0.24)",
                background:
                  "linear-gradient(135deg, hsl(var(--sleep) / 0.18), hsl(var(--milestone) / 0.12), hsl(var(--activity) / 0.14))",
                boxShadow: "0 0 40px hsl(var(--sleep) / 0.14)",
              }}
            >
              <Sparkles className="h-5 w-5 text-[hsl(var(--sleep))]" />
              <span className="mt-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/60">
                {timelineData.length} узлов
              </span>
            </div>
          </div>

          <div className="absolute inset-0">
            {timelineData.map((item, index) => {
              const accent = item.accent ?? "hsl(var(--sleep))";
              const related = isRelatedToActive(item.id);
              const isActive = activeNodeId === item.id;
              const pos = calculatePosition(index, timelineData.length);
              const shouldDim = activeNodeId !== null && !isActive && !related;
              const Icon = item.icon;

              return (
                <div key={item.id}>
                  <div
                    className="absolute left-1/2 top-1/2 h-px origin-left"
                    style={{
                      width: orbitRadius,
                      transform: `translate(-50%, -50%) rotate(${pos.angle}deg)`,
                      background: isActive
                        ? `linear-gradient(90deg, ${tint(accent, 0.6)}, transparent)`
                        : related
                        ? `linear-gradient(90deg, ${tint(accent, 0.32)}, transparent)`
                        : "linear-gradient(90deg, rgba(255,255,255,0.08), transparent)",
                      opacity: shouldDim ? 0.18 : 0.92,
                    }}
                  />

                  <button
                    type="button"
                    ref={(node) => {
                      nodeRefs.current[item.id] = node;
                    }}
                    className="absolute left-1/2 top-1/2 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--sleep))] focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                    style={{
                      transform: `translate(-50%, -50%) translate(${pos.x}px, ${pos.y}px) scale(${isActive ? pos.scale + 0.12 : pos.scale})`,
                      opacity: shouldDim ? pos.opacity * 0.34 : pos.opacity,
                      zIndex: isActive ? 200 : pos.zIndex,
                    }}
                    onClick={() => toggleNode(item.id)}
                    aria-pressed={isActive}
                    aria-label={item.title}
                  >
                    <div
                      className="absolute inset-0 rounded-full blur-xl"
                      style={{
                        transform: `scale(${0.95 + item.energy / 150})`,
                        background: `radial-gradient(circle, ${tint(accent, isActive ? 0.46 : related ? 0.26 : 0.15)} 0%, transparent 72%)`,
                      }}
                    />

                    <div
                      className="relative flex h-12 w-12 items-center justify-center rounded-full border transition-all duration-500 md:h-14 md:w-14"
                      style={{
                        color: isActive ? "white" : shouldDim ? "hsl(var(--muted-foreground))" : "hsl(var(--foreground))",
                        background: isActive
                          ? `linear-gradient(135deg, ${tint(accent, 0.9)}, hsl(var(--card)))`
                          : related
                          ? tint(accent, 0.18)
                          : SURFACE,
                        borderColor: isActive
                          ? tint(accent, 0.75)
                          : related
                          ? tint(accent, 0.38)
                          : "hsl(0 0% 100% / 0.12)",
                        boxShadow: isActive
                          ? `0 0 28px ${tint(accent, 0.22)}`
                          : related
                          ? `0 0 18px ${tint(accent, 0.16)}`
                          : "0 20px 40px -28px rgba(0, 0, 0, 0.9)",
                      }}
                    >
                      <Icon className="h-[18px] w-[18px] md:h-5 md:w-5" />
                    </div>

                    <div className="absolute left-1/2 top-full mt-2 w-20 -translate-x-1/2 text-center md:w-24">
                      <p
                        className="text-[10px] font-semibold leading-tight transition-all md:text-[11px]"
                        style={{
                          color: isActive ? "white" : shouldDim ? "hsl(var(--muted-foreground) / 0.55)" : "hsl(0 0% 100% / 0.72)",
                        }}
                      >
                        {item.title}
                      </p>
                    </div>
                  </button>
                </div>
              );
            })}
          </div>

          <div className="absolute inset-x-0 bottom-3 z-10 px-4 text-center">
            <p className="text-[11px] leading-5 text-white/55 md:text-xs">
              Нажми на узел, чтобы зафиксировать историю роста. Связанные моменты подсветятся автоматически.
            </p>
          </div>
        </div>

        <Card
          className="overflow-hidden border-white/10 bg-card/80 backdrop-blur-xl"
          style={{ boxShadow: "0 24px 60px -45px rgba(0, 0, 0, 0.9)" }}
        >
          {activeItem ? (
            <>
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between gap-3">
                  <Badge
                    className="border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.22em]"
                    style={{
                      background: tint(getStatusMeta(activeItem.status).color, 0.12),
                      borderColor: tint(getStatusMeta(activeItem.status).color, 0.24),
                      color: getStatusMeta(activeItem.status).color,
                    }}
                  >
                    {getStatusMeta(activeItem.status).label}
                  </Badge>
                  <span className="pt-1 text-xs text-muted-foreground">{activeItem.date}</span>
                </div>

                <div className="mt-2 flex items-start gap-3">
                  <div
                    className="flex h-12 w-12 items-center justify-center rounded-2xl border"
                    style={{
                      background: tint(activeItem.accent ?? "hsl(var(--sleep))", 0.14),
                      borderColor: tint(activeItem.accent ?? "hsl(var(--sleep))", 0.26),
                      color: activeItem.accent ?? "hsl(var(--sleep))",
                    }}
                  >
                    <activeItem.icon className="h-5 w-5" />
                  </div>
                  <div className="space-y-1">
                    <CardTitle className="text-lg leading-tight">{activeItem.title}</CardTitle>
                    <CardDescription>{activeItem.category}</CardDescription>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <p className="text-sm leading-6 text-muted-foreground">{activeItem.content}</p>

                <div
                  className="rounded-2xl border p-4"
                  style={{
                    background: tint(activeItem.accent ?? "hsl(var(--sleep))", 0.08),
                    borderColor: tint(activeItem.accent ?? "hsl(var(--sleep))", 0.16),
                  }}
                >
                  <div className="mb-2 flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1.5 text-white/72">
                      <Zap className="h-3.5 w-3.5" />
                      Энергия момента
                    </span>
                    <span className="font-semibold text-white">{activeItem.energy}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-white/8">
                    <div
                      className="h-2 rounded-full transition-all duration-700"
                      style={{
                        width: `${activeItem.energy}%`,
                        background: `linear-gradient(90deg, ${activeItem.accent ?? "hsl(var(--sleep))"}, hsl(var(--milestone)))`,
                      }}
                    />
                  </div>
                </div>

                {activeItem.relatedIds.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-white/56">
                      <Link2 className="h-3.5 w-3.5" />
                      Связанные узлы
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {activeItem.relatedIds.map((relatedId) => {
                        const relatedItem = itemsById.get(relatedId);
                        if (!relatedItem) return null;

                        return (
                          <Button
                            key={relatedId}
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-auto gap-1 rounded-full border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/80 hover:bg-white/10 hover:text-white"
                            onClick={() => toggleNode(relatedId)}
                          >
                            {relatedItem.title}
                            <ArrowRight className="h-3.5 w-3.5 text-white/50" />
                          </Button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </CardContent>
            </>
          ) : (
            <>
              <CardHeader>
                <CardTitle className="text-lg">Обзор орбиты</CardTitle>
                <CardDescription>
                  Здесь собраны самые заметные вехи и живые моменты года. Выбери узел слева, чтобы увидеть детали.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {timelineData.slice(0, 4).map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className="flex w-full items-center gap-3 rounded-2xl border px-3 py-3 text-left transition-colors hover:bg-white/5"
                    style={{ borderColor: tint(item.accent ?? "hsl(var(--sleep))", 0.12) }}
                    onClick={() => toggleNode(item.id)}
                  >
                    <div
                      className="flex h-10 w-10 items-center justify-center rounded-2xl border"
                      style={{
                        background: tint(item.accent ?? "hsl(var(--sleep))", 0.12),
                        borderColor: tint(item.accent ?? "hsl(var(--sleep))", 0.2),
                        color: item.accent ?? "hsl(var(--sleep))",
                      }}
                    >
                      <item.icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-foreground">{item.title}</p>
                      <p className="truncate text-xs text-muted-foreground">{item.date}</p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-white/35" />
                  </button>
                ))}
              </CardContent>
            </>
          )}
        </Card>
      </div>
    </section>
  );
}
