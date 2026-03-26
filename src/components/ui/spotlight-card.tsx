import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type HTMLAttributes,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { cn } from "@/lib/utils";

type SpotlightTone =
  | "primary"
  | "sleep"
  | "feeding"
  | "diaper"
  | "activity"
  | "growth"
  | "health"
  | "mood"
  | "milestone";

type SpotlightSurface = "glass" | "ghost";
type SpotlightIntensity = "soft" | "medium" | "strong";

interface SpotlightCardProps extends HTMLAttributes<HTMLDivElement> {
  tone?: SpotlightTone;
  accent?: string;
  surface?: SpotlightSurface;
  intensity?: SpotlightIntensity;
  interactive?: boolean;
}

const TONE_MAP: Record<SpotlightTone, string> = {
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

const INTENSITY_MAP: Record<
  SpotlightIntensity,
  { spot: number; rim: number; halo: number; size: string }
> = {
  soft: { spot: 18, rim: 24, halo: 16, size: "28rem" },
  medium: { spot: 24, rim: 34, halo: 22, size: "32rem" },
  strong: { spot: 30, rim: 44, halo: 28, size: "36rem" },
};

export function SpotlightCard({
  tone = "primary",
  accent,
  surface = "glass",
  intensity = "medium",
  interactive = true,
  className,
  style,
  children,
  onPointerMove,
  onPointerLeave,
  ...props
}: SpotlightCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [finePointer, setFinePointer] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") return;

    const mediaQuery = window.matchMedia("(pointer: fine)");
    const sync = () => setFinePointer(mediaQuery.matches);

    sync();
    mediaQuery.addEventListener("change", sync);

    return () => mediaQuery.removeEventListener("change", sync);
  }, []);

  const toneColor = accent ?? TONE_MAP[tone];
  const level = INTENSITY_MAP[intensity];
  const shouldTrackPointer = interactive && finePointer;

  const setSpotlightPosition = (x: string, y: string) => {
    if (!cardRef.current) return;
    cardRef.current.style.setProperty("--spotlight-x", x);
    cardRef.current.style.setProperty("--spotlight-y", y);
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    onPointerMove?.(event);
    if (!shouldTrackPointer) return;

    const rect = event.currentTarget.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;

    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;

    setSpotlightPosition(`${x.toFixed(2)}%`, `${y.toFixed(2)}%`);
  };

  const handlePointerLeave = (event: ReactPointerEvent<HTMLDivElement>) => {
    onPointerLeave?.(event);
    setSpotlightPosition("50%", "28%");
  };

  const cardStyle = {
    ...style,
    "--spotlight-x": "50%",
    "--spotlight-y": "28%",
  } as CSSProperties;

  return (
    <div
      ref={cardRef}
      className={cn(
        "relative isolate overflow-hidden rounded-3xl",
        surface === "glass" &&
          "border border-white/10 bg-card/80 shadow-[0_24px_70px_-38px_rgba(0,0,0,0.95)] backdrop-blur-xl",
        surface === "ghost" && "bg-transparent border-transparent shadow-none",
        className,
      )}
      style={cardStyle}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      {...props}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 rounded-[inherit] opacity-95"
        style={{
          background: [
            `radial-gradient(${level.size} circle at var(--spotlight-x) var(--spotlight-y), color-mix(in srgb, ${toneColor} ${level.spot}%, transparent) 0%, transparent 54%)`,
            `linear-gradient(145deg, color-mix(in srgb, ${toneColor} 12%, hsl(var(--card-elevated))) 0%, transparent 72%)`,
          ].join(", "),
        }}
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-[1px] rounded-[inherit]"
        style={{
          border: `1px solid color-mix(in srgb, ${toneColor} ${level.rim}%, hsl(0 0% 100% / 0.07))`,
        }}
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute -inset-10 rounded-full blur-3xl opacity-80"
        style={{
          background: `radial-gradient(circle at var(--spotlight-x) var(--spotlight-y), color-mix(in srgb, ${toneColor} ${level.halo}%, transparent) 0%, transparent 58%)`,
        }}
      />

      <div className="relative z-10">{children}</div>
    </div>
  );
}

export default SpotlightCard;
