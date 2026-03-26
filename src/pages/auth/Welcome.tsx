import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { getAuthToken, isOnboarded } from "@/lib/appStorage";
import { GlassFilter, LiquidSurface } from "@/components/ui/liquid-radio";

const BUBBLES = [
  { size: 240, x: -60,  y: -60,  color: "hsl(var(--sleep))",    delay: 0   },
  { size: 180, x: "65%",y: -40,  color: "hsl(var(--health))",   delay: 0.4 },
  { size: 160, x: "10%",y: "55%",color: "hsl(var(--activity))", delay: 0.8 },
  { size: 200, x: "70%",y: "60%",color: "hsl(var(--feeding))",  delay: 0.6 },
  { size: 100, x: "40%",y: "35%",color: "hsl(var(--diaper))",   delay: 1.0 },
];

const ORBIT = ["🌙","🍼","👶","💊","📏","❤️"];

export default function Welcome() {
  const navigate = useNavigate();
  const [phase, setPhase] = useState<"logo" | "tagline" | "out">("logo");

  useEffect(() => {
    const t1 = setTimeout(() => setPhase("tagline"), 1000);
    const t2 = setTimeout(() => setPhase("out"),     2200);
    const t3 = setTimeout(() => {
      const token = getAuthToken();
      const onboarded = isOnboarded();
      if (!token)          navigate("/login");
      else if (!onboarded) navigate("/onboarding");
      else                 navigate("/");
    }, 2800);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [navigate]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center max-w-md mx-auto relative overflow-hidden bg-background">
      <GlassFilter />
      {BUBBLES.map((b, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full blur-3xl pointer-events-none"
          style={{ width: b.size, height: b.size, left: b.x, top: b.y, background: b.color }}
          animate={{ x:[0,20,-10,15,0], y:[0,-15,20,-10,0], scale:[1,1.1,0.95,1.05,1] }}
          transition={{ duration: 6+i, repeat: Infinity, delay: b.delay, ease: "easeInOut" }}
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 0.35 }}
        />
      ))}

      <AnimatePresence>
        {phase !== "out" && (
          <motion.div
            exit={{ opacity: 0, scale: 0.85 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col items-center gap-6 relative z-10"
          >
            <div className="relative w-36 h-36">
              {ORBIT.map((emoji, i) => {
                const angle = (i / ORBIT.length) * 360;
                const rad   = (angle - 90) * (Math.PI / 180);
                const r     = 62;
                return (
                  <motion.div
                    key={i}
                    className="absolute w-10 h-10 rounded-2xl flex items-center justify-center text-lg"
                    style={{
                      left: 68 + r * Math.cos(rad) - 20,
                      top:  68 + r * Math.sin(rad) - 20,
                      background: "hsl(var(--sleep-soft))",
                      border: "1px solid hsl(var(--sleep) / 0.30)",
                    }}
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.15 + i * 0.08, type: "spring", stiffness: 220 }}
                  >
                    {emoji}
                  </motion.div>
                );
              })}

              <motion.div
                style={{ width: 72, height: 72, position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)" }}
                initial={{ scale: 0, rotate: -30 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 180, damping: 14 }}
              >
                <LiquidSurface
                  tone="primary"
                  active
                  ambientDelay={0.6}
                  className="w-full h-full rounded-[24px]"
                  contentClassName="w-full h-full rounded-[24px] flex items-center justify-center"
                  style={{
                    background: "var(--primary-gradient, hsl(var(--primary)))",
                    boxShadow: "var(--fab-shadow, 0 0 40px hsl(var(--primary) / 0.4))",
                  }}
                >
                  <span className="text-4xl">👶</span>
                </LiquidSurface>
              </motion.div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="text-center"
            >
              <h1 className="text-3xl font-bold text-white tracking-tight">BabyTrack</h1>
            </motion.div>

            <AnimatePresence>
              {phase === "tagline" && (
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="text-sm text-white/50 text-center"
                >
                  Каждый момент важен 💙
                </motion.p>
              )}
            </AnimatePresence>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="flex gap-1.5 mt-2"
            >
              {[0,1,2].map((i) => (
                <motion.div
                  key={i}
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ background: "hsl(var(--primary))" }}
                  animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.2, 0.8] }}
                  transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                />
              ))}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
