import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Mail, Send, Check, Eye, EyeOff } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import { findUserByEmail, resetUserPassword } from "@/lib/appStorage";
import { GlassFilter, LiquidSurface } from "@/components/ui/liquid-radio";

const hc  = (v: string) => `hsl(var(${v}))`;
const hca = (v: string, a: number) => `hsl(var(${v}) / ${a})`;

const accentVar = "--primary";

function AnimatedBackground() {
  const bubbles = [
    { size: 200, x: "65%", y: -60,  colorVar: "--sleep",    delay: 0   },
    { size: 140, x: -40,   y: "40%",colorVar: "--activity", delay: 0.7 },
    { size: 110, x: "30%", y: "75%",colorVar: "--mood",     delay: 1.3 },
  ];

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none">
      {bubbles.map((b, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full blur-3xl opacity-25"
          style={{ width: b.size, height: b.size, left: b.x, top: b.y, background: hc(b.colorVar) }}
          animate={{ x: [0, 18, -12, 10, 0], y: [0, -14, 20, -8, 0], scale: [1, 1.07, 0.96, 1.03, 1] }}
          transition={{ duration: 10 + i * 2, repeat: Infinity, delay: b.delay, ease: "easeInOut" }}
        />
      ))}
    </div>
  );
}

export default function ForgotPassword() {
  const navigate  = useNavigate();
  const [email,       setEmail]       = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showPass,    setShowPass]    = useState(false);
  const [focused,     setFocused]     = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [step,        setStep]        = useState<"email" | "password" | "done">("email");
  const [loading,     setLoading]     = useState(false);

  const raised    = focused || email.length > 0;
  const canSubmit = step === "email"
    ? email.includes("@")
    : newPassword.length >= 6;

  const handleSubmit = () => {
    if (!canSubmit) return;

    if (step === "email") {
      setLoading(true);
      setTimeout(() => {
        setLoading(false);
        const user = findUserByEmail(email.trim());
        if (!user) {
          toast({ title: "Пользователь с таким email не найден", variant: "destructive" });
          return;
        }
        setStep("password");
      }, 800);
      return;
    }

    if (step === "password") {
      setLoading(true);
      setTimeout(() => {
        setLoading(false);
        resetUserPassword(email.trim(), newPassword);
        setStep("done");
      }, 800);
    }
  };

  return (
    <div className="min-h-screen flex flex-col max-w-md mx-auto relative overflow-hidden bg-background">
      <GlassFilter />
      <AnimatedBackground />

      <div className="flex-1 flex flex-col px-6 py-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 mb-10"
        >
          <Link
            to="/login"
            className="w-9 h-9"
          >
            <LiquidSurface
              tone="neutral"
              ambientDelay={0.2}
              className="w-9 h-9 rounded-full"
              contentClassName="w-full h-full rounded-full bg-white/8 flex items-center justify-center active:scale-90 transition-transform hover:bg-white/14"
            >
              <ArrowLeft className="w-5 h-5 text-muted-foreground" />
            </LiquidSurface>
          </Link>
          <h1 className="text-xl font-bold text-foreground">Восстановление пароля</h1>
        </motion.div>

        <AnimatePresence mode="wait">
          {step === "email" && (
            <motion.div
              key="email"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ delay: 0.1 }}
              className="flex flex-col gap-6"
            >
              <p className="text-sm text-muted-foreground leading-relaxed">
                Введите email, указанный при регистрации.
              </p>

              <LiquidSurface
                tone="primary"
                active={focused}
                ambientDelay={0.45}
                className="rounded-2xl"
                contentClassName="relative"
                style={{
                  background: "hsl(var(--card))",
                  border: `1.5px solid ${focused ? hc(accentVar) : "hsl(var(--border))"}`,
                  boxShadow: focused ? `0 0 0 3px ${hca(accentVar, 0.10)}` : "none",
                }}
              >
                <div className="absolute left-4 top-1/2 -translate-y-1/2">
                  <Mail className="w-4 h-4" style={{ color: focused ? hc(accentVar) : "hsl(var(--muted-foreground))" }} />
                </div>
                <motion.label
                  animate={{
                    top:      raised ? 8 : "50%",
                    fontSize: raised ? 10 : 14,
                    y:        raised ? 0 : "-50%",
                    color:    raised ? hc(accentVar) : "hsl(var(--muted-foreground))",
                  }}
                  transition={{ duration: 0.18 }}
                  className="absolute left-11 font-medium pointer-events-none"
                >
                  Email
                </motion.label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={() => setFocused(true)}
                  onBlur={() => setFocused(false)}
                  onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                  className="w-full bg-transparent text-foreground text-sm focus:outline-none"
                  style={{ paddingLeft: 44, paddingRight: 16, paddingTop: raised ? 22 : 14, paddingBottom: 10 }}
                />
              </LiquidSurface>

              <motion.button
                whileTap={canSubmit ? { scale: 0.96 } : {}}
                onClick={handleSubmit}
                disabled={!canSubmit || loading}
                className="w-full"
              >
                <LiquidSurface
                  tone="primary"
                  active={loading}
                  ambientDelay={0.7}
                  className="rounded-2xl"
                  contentClassName="w-full h-14 rounded-2xl font-bold text-base flex items-center justify-center gap-2"
                  style={{
                    background: canSubmit ? `linear-gradient(135deg, ${hc(accentVar)}, ${hc("--milestone")})` : "hsl(var(--muted))",
                    boxShadow: canSubmit ? `0 8px 24px ${hca(accentVar, 0.28)}` : "none",
                    color: canSubmit ? "white" : "hsl(var(--muted-foreground))",
                  }}
                >
                  {loading ? (
                    <motion.div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full" animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }} />
                  ) : (
                    <>Продолжить <Send className="w-4 h-4" /></>
                  )}
                </LiquidSurface>
              </motion.button>

              <p className="text-center text-sm text-muted-foreground">
                Вспомнили пароль?{" "}
                <Link to="/login" className="font-bold" style={{ color: hc(accentVar) }}>Войти</Link>
              </p>
            </motion.div>
          )}

          {step === "password" && (
            <motion.div
              key="password"
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              className="flex flex-col gap-6"
            >
              <p className="text-sm text-muted-foreground leading-relaxed">
                Аккаунт найден. Введите новый пароль для{" "}
                <span className="font-semibold text-foreground">{email}</span>.
              </p>

              <LiquidSurface
                tone="primary"
                active={passwordFocused}
                ambientDelay={0.45}
                className="rounded-2xl"
                contentClassName="relative"
                style={{
                  background: "hsl(var(--card))",
                  border: `1.5px solid ${passwordFocused ? hc(accentVar) : "hsl(var(--border))"}`,
                  boxShadow: passwordFocused ? `0 0 0 3px ${hca(accentVar, 0.10)}` : "none",
                }}
              >
                <motion.label
                  animate={{
                    top: newPassword.length > 0 ? 8 : "50%",
                    fontSize: newPassword.length > 0 ? 10 : 14,
                    y: newPassword.length > 0 ? 0 : "-50%",
                    color: "hsl(var(--muted-foreground))",
                  }}
                  transition={{ duration: 0.18 }}
                  className="absolute left-4 font-medium pointer-events-none"
                >
                  Новый пароль (мин. 6 символов)
                </motion.label>
                <input
                  type={showPass ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  onFocus={() => setPasswordFocused(true)}
                  onBlur={() => setPasswordFocused(false)}
                  onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                  className="w-full bg-transparent text-foreground text-sm focus:outline-none"
                  style={{ paddingLeft: 16, paddingRight: 48, paddingTop: newPassword.length > 0 ? 22 : 14, paddingBottom: 10 }}
                />
                <button type="button" onClick={() => setShowPass((v) => !v)} className="absolute right-4 top-1/2 -translate-y-1/2">
                  {showPass ? <EyeOff className="w-4 h-4 text-muted-foreground" /> : <Eye className="w-4 h-4 text-muted-foreground" />}
                </button>
              </LiquidSurface>

              <motion.button
                whileTap={canSubmit ? { scale: 0.96 } : {}}
                onClick={handleSubmit}
                disabled={!canSubmit || loading}
                className="w-full"
              >
                <LiquidSurface
                  tone="primary"
                  active={loading}
                  ambientDelay={0.7}
                  className="rounded-2xl"
                  contentClassName="w-full h-14 rounded-2xl font-bold text-base flex items-center justify-center gap-2"
                  style={{
                    background: canSubmit ? `linear-gradient(135deg, ${hc(accentVar)}, ${hc("--milestone")})` : "hsl(var(--muted))",
                    boxShadow: canSubmit ? `0 8px 24px ${hca(accentVar, 0.28)}` : "none",
                    color: canSubmit ? "white" : "hsl(var(--muted-foreground))",
                  }}
                >
                  {loading ? (
                    <motion.div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full" animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }} />
                  ) : (
                    <>Сохранить пароль <Check className="w-4 h-4" /></>
                  )}
                </LiquidSurface>
              </motion.button>
            </motion.div>
          )}

          {step === "done" && (
            <motion.div
              key="done"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: "spring", stiffness: 200 }}
              className="flex flex-col items-center gap-6 pt-8"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 240, damping: 18, delay: 0.1 }}
                className="w-24 h-24 rounded-full flex items-center justify-center"
                style={{
                  background: `linear-gradient(135deg, ${hca(accentVar, 0.25)}, ${hca("--milestone", 0.18)})`,
                  border: `2px solid ${hca(accentVar, 0.38)}`,
                  boxShadow: `0 0 32px ${hca(accentVar, 0.18)}`,
                }}
              >
                <Check className="w-12 h-12" style={{ color: hc(accentVar) }} />
              </motion.div>

              <div className="text-center flex flex-col gap-2">
                <h2 className="text-xl font-bold text-foreground">Пароль обновлён!</h2>
                <p className="text-sm text-muted-foreground">Теперь войдите с новым паролем.</p>
              </div>

              <button onClick={() => navigate("/login")} className="w-full">
                <LiquidSurface
                  tone="primary"
                  active
                  ambientDelay={0.6}
                  className="rounded-2xl"
                  contentClassName="w-full h-14 rounded-2xl font-bold text-base flex items-center justify-center gap-2 text-white"
                  style={{
                    background: `linear-gradient(135deg, ${hc(accentVar)}, ${hc("--milestone")})`,
                    boxShadow: `0 8px 24px ${hca(accentVar, 0.28)}`,
                  }}
                >
                  Войти
                </LiquidSurface>
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
