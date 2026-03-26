import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, ArrowRight, ArrowLeft, Check, X } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { saveBabyProfileState, setAuthToken, registerUser, generateToken } from "@/lib/appStorage";
import { GlassFilter, LiquidSurface, LIQUID_TONE_BY_COLOR_VAR, type LiquidTone } from "@/components/ui/liquid-radio";

const hc  = (v: string) => `hsl(var(${v}))`;
const hca = (v: string, a: number) => `hsl(var(${v}) / ${a})`;
const toneFromVar = (v: string): LiquidTone => LIQUID_TONE_BY_COLOR_VAR[v] ?? (v === "--foreground" ? "neutral" : "primary");

function AnimatedBackground() {
  const bubbles = [
    { size: 220, x: "60%",  y: -80,  colorVar: "--health",   delay: 0   },
    { size: 160, x: -50,    y: "30%",colorVar: "--activity", delay: 0.6 },
    { size: 130, x: "75%",  y: "60%",colorVar: "--sleep",    delay: 1.2 },
    { size: 100, x: "25%",  y: "80%",colorVar: "--mood",     delay: 0.3 },
  ];

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none">
      {bubbles.map((b, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full blur-3xl opacity-25"
          style={{ width: b.size, height: b.size, left: b.x, top: b.y, background: hc(b.colorVar) }}
          animate={{ x: [0, 15, -10, 12, 0], y: [0, -12, 18, -8, 0], scale: [1, 1.08, 0.96, 1.04, 1] }}
          transition={{ duration: 9 + i * 2, repeat: Infinity, delay: b.delay, ease: "easeInOut" }}
        />
      ))}
    </div>
  );
}

function FloatingInput({
  label, value, onChange, type = "text", colorVar = "--primary", hint,
}: {
  label: string; value: string; onChange: (v: string) => void;
  type?: string; colorVar?: string; hint?: string;
}) {
  const [focused, setFocused] = useState(false);
  const [show,    setShow]    = useState(false);
  const isPassword = type === "password";
  const raised     = focused || value.length > 0;

  return (
    <div className="flex flex-col gap-1">
      <LiquidSurface
        tone={toneFromVar(colorVar)}
        active={focused}
        ambientDelay={0.5}
        className="rounded-2xl"
        contentClassName="relative"
        style={{
          background: "hsl(var(--card))",
          border: `1.5px solid ${focused ? hc(colorVar) : "hsl(var(--border))"}`,
          boxShadow: focused ? `0 0 0 3px ${hca(colorVar, 0.10)}` : "none",
        }}
      >
        <motion.label
          animate={{
            top:      raised ? 8 : "50%",
            fontSize: raised ? 10 : 14,
            y:        raised ? 0 : "-50%",
            color:    raised ? hc(colorVar) : "hsl(var(--muted-foreground))",
          }}
          transition={{ duration: 0.18 }}
          className="absolute left-4 font-medium pointer-events-none"
        >
          {label}
        </motion.label>
        <input
          type={isPassword ? (show ? "text" : "password") : type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          className="w-full bg-transparent text-foreground text-sm focus:outline-none"
          style={{ paddingLeft: 16, paddingRight: isPassword ? 48 : 16, paddingTop: raised ? 22 : 14, paddingBottom: 10 }}
        />
        {isPassword && (
          <button type="button" onClick={() => setShow(v => !v)}
            className="absolute right-4 top-1/2 -translate-y-1/2">
            {show
              ? <EyeOff className="w-4 h-4 text-muted-foreground" />
              : <Eye    className="w-4 h-4 text-muted-foreground" />
            }
          </button>
        )}
      </LiquidSurface>
      {hint && <p className="text-[10px] text-muted-foreground px-1">{hint}</p>}
    </div>
  );
}

function PasswordStrength({ password }: { password: string }) {
  const checks = [
    { label: "8+ символов",      ok: password.length >= 8 },
    { label: "Заглавная буква",  ok: /[A-ZА-Я]/.test(password) },
    { label: "Строчная буква",   ok: /[a-zа-я]/.test(password) },
    { label: "Цифра или символ", ok: /[0-9!@#$%^&*]/.test(password) },
  ];

  const score    = checks.filter((c) => c.ok).length;
  const colorVars = ["--health", "--health", "--diaper", "--diaper", "--feeding"];
  const labels    = ["", "Слабый", "Слабый", "Средний", "Сильный"];
  const cv        = colorVars[score];

  if (!password) return null;

  return (
    <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-2">
      <div className="flex gap-1">
        {[0,1,2,3].map((i) => (
          <motion.div
            key={i}
            className="flex-1 h-1.5 rounded-full"
            animate={{ backgroundColor: i < score ? hc(cv) : "hsl(var(--muted))" }}
            transition={{ duration: 0.3 }}
          />
        ))}
      </div>
      {score > 0 && (
        <p className="text-[11px] font-semibold" style={{ color: hc(cv) }}>{labels[score]}</p>
      )}
      <div className="grid grid-cols-2 gap-1">
        {checks.map((c, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            className="flex items-center gap-1.5"
          >
            <div
              className="w-4 h-4 rounded-full flex items-center justify-center shrink-0"
              style={{ background: c.ok ? hca("--feeding", 0.60) : "hsl(var(--muted))" }}
            >
              {c.ok
                ? <Check className="w-2.5 h-2.5 text-white" />
                : <X     className="w-2.5 h-2.5 text-muted-foreground" />
              }
            </div>
            <span className={cn("text-[10px]", c.ok ? "text-foreground" : "text-muted-foreground")}>
              {c.label}
            </span>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

const ROLES = [
  { id: "mom",   label: "Мама",    emoji: "👩",  colorVar: "--mood"      },
  { id: "dad",   label: "Папа",    emoji: "👨",  colorVar: "--activity"  },
  { id: "gma",   label: "Бабушка", emoji: "👵",  colorVar: "--feeding"   },
  { id: "other", label: "Другой",  emoji: "🧑",  colorVar: "--sleep"     },
];

function RoleSelector({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm font-semibold text-muted-foreground">Ваша роль</p>
      <div className="grid grid-cols-2 gap-2">
        {ROLES.map((r, i) => (
          <motion.button
            key={r.id}
            onClick={() => onChange(r.id)}
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.07, type: "spring" }}
            whileTap={{ scale: 0.92 }}
            className="text-left"
          >
            <LiquidSurface
              tone={toneFromVar(r.colorVar)}
              active={value === r.id}
              ambientDelay={i * 0.45}
              className="rounded-2xl"
              contentClassName="flex items-center gap-3 p-4 rounded-2xl transition-all"
              style={value === r.id
                ? { background: hca(r.colorVar, 0.13), border: `1.5px solid ${hc(r.colorVar)}` }
                : { background: "hsl(var(--muted))", border: "1.5px solid transparent" }
              }
            >
              <motion.span className="text-2xl" animate={{ scale: value === r.id ? 1.15 : 1 }} transition={{ type: "spring", stiffness: 300 }}>
                {r.emoji}
              </motion.span>
              <span className="text-sm font-semibold" style={{ color: value === r.id ? hc(r.colorVar) : "hsl(var(--muted-foreground))" }}>
                {r.label}
              </span>
              {value === r.id && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="ml-auto w-5 h-5 rounded-full flex items-center justify-center"
                  style={{ background: hc(r.colorVar) }}
                >
                  <Check className="w-3 h-3 text-white" />
                </motion.div>
              )}
            </LiquidSurface>
          </motion.button>
        ))}
      </div>
    </div>
  );
}

const AVATARS = ["🧑","👩","👨","👧","🧒","👶","🦸","🧙"];

function AvatarPicker({ value, onChange, colorVar }: { value: string; onChange: (v: string) => void; colorVar: string }) {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm font-semibold text-muted-foreground">Аватар</p>
      <div className="flex gap-2 flex-wrap">
        {AVATARS.map((a, i) => (
          <motion.button
            key={a}
            onClick={() => onChange(a)}
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.04 }}
            whileTap={{ scale: 0.85 }}
            className="w-12 h-12"
          >
            <LiquidSurface
              tone={toneFromVar(colorVar)}
              active={value === a}
              ambientDelay={i * 0.18}
              className="w-12 h-12 rounded-2xl"
              contentClassName="w-full h-full rounded-2xl flex items-center justify-center text-2xl"
              style={value === a
                ? { background: hca(colorVar, 0.15), border: `2px solid ${hc(colorVar)}`, boxShadow: `0 0 12px ${hca(colorVar, 0.18)}` }
                : { background: "hsl(var(--muted))", border: "2px solid transparent" }
              }
            >
              {a}
            </LiquidSurface>
          </motion.button>
        ))}
      </div>
    </div>
  );
}

const accentVar = "--health";

export default function Register() {
  const navigate = useNavigate();

  const [step,     setStep]     = useState(0);
  const [name,     setName]     = useState("");
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [role,     setRole]     = useState("mom");
  const [avatar,   setAvatar]   = useState("🧑");
  const [loading,  setLoading]  = useState(false);

  const roleColorVar    = ROLES.find((r) => r.id === role)?.colorVar ?? accentVar;
  const canProceedStep0 = name.trim().length > 0 && email.includes("@") && password.length >= 6;

  const handleRegister = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      const result = registerUser({ name, email, password, role, avatar });
      if ("error" in result) {
        toast({ title: result.error, variant: "destructive" });
        return;
      }
      setAuthToken(generateToken(result.user.id));
      saveBabyProfileState({ userName: name, userEmail: email, avatar, userRole: role });
      toast({ title: `Добро пожаловать, ${name}! 🎉` });
      navigate("/onboarding");
    }, 1200);
  };

  const slideVariants = {
    enter:  (d: number) => ({ x: d > 0 ? 200 : -200, opacity: 0 }),
    center: { x: 0, opacity: 1, transition: { duration: 0.3 } },
    exit:   (d: number) => ({ x: d > 0 ? -200 : 200, opacity: 0, transition: { duration: 0.2 } }),
  };

  return (
    <div className="min-h-screen flex flex-col max-w-md mx-auto relative overflow-hidden bg-background">
      <GlassFilter />
      <AnimatedBackground />

      <div className="flex-1 flex flex-col px-6 py-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 mb-8"
        >
          {step > 0 && (
            <motion.button
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              whileTap={{ scale: 0.85 }}
              onClick={() => setStep(0)}
              className="w-9 h-9"
            >
              <LiquidSurface
                tone="neutral"
                ambientDelay={0.2}
                className="w-9 h-9 rounded-full"
                contentClassName="w-full h-full rounded-full bg-muted flex items-center justify-center"
              >
                <ArrowLeft className="w-5 h-5 text-muted-foreground" />
              </LiquidSurface>
            </motion.button>
          )}
          <div className="flex-1">
            <h1 className="text-xl font-bold text-foreground">
              {step === 0 ? "Создать аккаунт" : "Немного о вас"}
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">Шаг {step + 1} из 2</p>
          </div>
          <div className="flex gap-1.5">
            {[0,1].map((i) => (
              <motion.div
                key={i}
                className="h-1.5 rounded-full"
                animate={{
                  width:           i <= step ? 24 : 8,
                  backgroundColor: i <= step ? hc(accentVar) : "hsl(var(--border))",
                }}
                transition={{ duration: 0.3 }}
              />
            ))}
          </div>
        </motion.div>

        <div className="flex flex-col">
          <AnimatePresence mode="wait" custom={step}>
            {step === 0 ? (
              <motion.div
                key="step0"
                custom={1}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                className="flex flex-col gap-4"
              >
                <FloatingInput label="Ваше имя" value={name} onChange={setName} colorVar={accentVar} />
                <FloatingInput label="Email" value={email} onChange={setEmail} type="email" colorVar={accentVar} />
                <FloatingInput label="Пароль" value={password} onChange={setPassword} type="password" colorVar={accentVar} />
                <AnimatePresence>
                  {password && <PasswordStrength password={password} />}
                </AnimatePresence>
              </motion.div>
            ) : (
              <motion.div
                key="step1"
                custom={1}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                className="flex flex-col gap-5"
              >
                <AvatarPicker value={avatar} onChange={setAvatar} colorVar={roleColorVar} />
                <RoleSelector value={role} onChange={setRole} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="flex flex-col gap-4 mt-6">
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={step === 0 ? () => setStep(1) : handleRegister}
            disabled={step === 0 ? !canProceedStep0 : loading}
            className="w-full"
          >
            <LiquidSurface
              tone={toneFromVar(accentVar)}
              active={loading}
              ambientDelay={0.5}
              className="rounded-2xl"
              contentClassName="w-full h-14 rounded-2xl font-bold text-base flex items-center justify-center gap-2"
              style={{
                background: canProceedStep0 || step === 1
                  ? `linear-gradient(135deg, ${hc(accentVar)}, ${hca(accentVar, 0.65)})`
                  : "hsl(var(--muted))",
                boxShadow: canProceedStep0 || step === 1 ? `0 8px 24px ${hca(accentVar, 0.28)}` : "none",
                color: canProceedStep0 || step === 1 ? "white" : "hsl(var(--muted-foreground))",
              }}
            >
              {loading ? (
                <motion.div
                  className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                />
              ) : step === 0 ? (
                <>Продолжить <ArrowRight className="w-5 h-5" /></>
              ) : (
                <>Создать аккаунт <ArrowRight className="w-5 h-5" /></>
              )}
            </LiquidSurface>
          </motion.button>

          <p className="text-center text-sm text-muted-foreground">
            Уже есть аккаунт?{" "}
            <Link to="/login" className="font-bold" style={{ color: hc(accentVar) }}>
              Войти
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
