import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, ArrowRight, Fingerprint, Mail, Phone, type LucideIcon } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import {
  isOnboarded, setAuthToken,
  loginUser, generateToken, saveBabyProfileState,
} from "@/lib/appStorage";
import { GlassFilter, LiquidSurface } from "@/components/ui/liquid-radio";

function AnimatedBackground() {
  const bubbles = [
    { size: 200, x: -40,  y: -60,  color: "hsl(var(--sleep))",    delay: 0    },
    { size: 150, x: "70%",y: "15%",color: "hsl(var(--health))",   delay: 0.5  },
    { size: 120, x: "20%",y: "65%",color: "hsl(var(--activity))", delay: 1    },
    { size: 180, x: "80%",y: "70%",color: "hsl(var(--feeding))",  delay: 1.5  },
    { size: 80,  x: "50%",y: "40%",color: "hsl(var(--diaper))",   delay: 0.8  },
  ];

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none">
      {bubbles.map((b, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full blur-3xl opacity-30"
          style={{ width: b.size, height: b.size, left: b.x, top: b.y, background: b.color }}
          animate={{ x: [0, 20, -10, 15, 0], y: [0, -15, 20, -10, 0], scale: [1, 1.1, 0.95, 1.05, 1] }}
          transition={{ duration: 8 + i * 2, repeat: Infinity, delay: b.delay, ease: "easeInOut" }}
        />
      ))}
    </div>
  );
}

function LogoBurst() {
  const orbitItems = ["🌙", "🍼", "👶", "💊"];

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative w-28 h-28">
        {orbitItems.map((emoji, i) => {
          const angle = (i / orbitItems.length) * 360;
          const rad   = (angle - 90) * (Math.PI / 180);
          const r     = 54;
          return (
            <motion.div
              key={i}
              className="absolute w-9 h-9 rounded-2xl flex items-center justify-center text-base"
              style={{
                left: 56 + r * Math.cos(rad) - 18,
                top:  56 + r * Math.sin(rad) - 18,
                background: "hsl(var(--sleep-soft))",
                border: "1px solid hsl(var(--sleep) / 0.30)",
              }}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 + i * 0.1, type: "spring", stiffness: 200 }}
            >
              {emoji}
            </motion.div>
          );
        })}

        <motion.div
          className="absolute inset-0 m-auto"
          initial={{ scale: 0, rotate: -20 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 200, damping: 16 }}
        >
          <LiquidSurface
            tone="primary"
            active
            ambientDelay={0.8}
            className="w-16 h-16 rounded-[22px]"
            contentClassName="w-full h-full rounded-[22px] flex items-center justify-center"
            style={{
              background: "var(--primary-gradient, hsl(var(--primary)))",
              boxShadow: "var(--fab-shadow, 0 0 40px hsl(var(--primary) / 0.4))",
            }}
          >
            <span className="text-3xl">👶</span>
          </LiquidSurface>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="text-center"
      >
        <h1 className="text-2xl font-bold text-white">BabyTrack</h1>
        <p className="text-sm text-white/50 mt-1">Дневник малыша</p>
      </motion.div>
    </div>
  );
}

function FloatingInput({
  label, value, onChange, type = "text", icon: Icon, color = "hsl(var(--primary))",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  icon?: LucideIcon;
  color?: string;
}) {
  const [focused, setFocused] = useState(false);
  const [show,    setShow]    = useState(false);
  const isPassword = type === "password";
  const raised     = focused || value.length > 0;

  return (
    <div className="relative">
      <LiquidSurface
        tone="primary"
        active={focused}
        ambientDelay={0.4}
        className="rounded-2xl"
        contentClassName="relative"
        style={{
          background: "hsl(var(--card))",
          border: `1.5px solid ${focused ? color : "hsl(var(--border))"}`,
          boxShadow: focused ? `0 0 0 3px hsl(var(--primary) / 0.10)` : "none",
        }}
      >
        {Icon && (
          <div className="absolute left-4 top-1/2 -translate-y-1/2">
            <Icon className="w-4 h-4" style={{ color: focused ? color : "hsl(var(--muted-foreground))" }} />
          </div>
        )}

        <motion.label
          animate={{
            top:      raised ? 8  : "50%",
            fontSize: raised ? 10 : 14,
            y:        raised ? 0  : "-50%",
            color:    raised ? color : "hsl(var(--muted-foreground))",
          }}
          transition={{ duration: 0.18 }}
          className="absolute font-medium pointer-events-none"
          style={{ left: Icon ? 44 : 16 }}
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
          style={{
            paddingLeft:  Icon ? 44 : 16,
            paddingRight: isPassword ? 48 : 16,
            paddingTop:   raised ? 22 : 14,
            paddingBottom: 10,
          }}
        />

        {isPassword && (
          <button
            type="button"
            onClick={() => setShow((v) => !v)}
            className="absolute right-4 top-1/2 -translate-y-1/2"
          >
            {show
              ? <EyeOff className="w-4 h-4 text-muted-foreground" />
              : <Eye    className="w-4 h-4 text-muted-foreground" />
            }
          </button>
        )}
      </LiquidSurface>
    </div>
  );
}

function SocialPill({
  icon, label, onClick,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  color: string;
}) {
  return (
    <motion.button
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className="flex-1"
    >
      <LiquidSurface
        tone="neutral"
        ambientDelay={label === "Apple" ? 0.2 : 1}
        className="rounded-2xl"
        contentClassName="flex items-center justify-center gap-2.5 py-3.5 rounded-2xl font-semibold text-sm text-foreground transition-all"
        style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}
      >
        {icon}
        <span>{label}</span>
      </LiquidSurface>
    </motion.button>
  );
}

function BiometricButton({ onPress }: { onPress: () => void }) {
  const [scanning, setScanning] = useState(false);

  const handlePress = () => {
    setScanning(true);
    setTimeout(() => { setScanning(false); onPress(); }, 1500);
  };

  return (
    <motion.button
      whileTap={{ scale: 0.88 }}
      onClick={handlePress}
      className="w-full"
    >
      <LiquidSurface
        tone={scanning ? "primary" : "neutral"}
        active={scanning}
        ambientDelay={1.6}
        className="rounded-2xl"
        contentClassName="flex items-center justify-center gap-3 py-3.5 rounded-2xl font-semibold text-sm"
        style={{
          background: "hsl(var(--card))",
          border: `1px solid ${scanning ? "hsl(var(--primary))" : "hsl(var(--border))"}`,
        }}
      >
        <motion.div
          animate={scanning ? { scale: [1, 1.2, 1], opacity: [1, 0.5, 1] } : {}}
          transition={{ duration: 0.8, repeat: scanning ? Infinity : 0 }}
        >
          <Fingerprint
            className="w-5 h-5"
            style={{ color: scanning ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))" }}
          />
        </motion.div>
        <span style={{ color: scanning ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))" }}>
          {scanning ? "Сканирование..." : "Face ID / Touch ID"}
        </span>
      </LiquidSurface>
    </motion.button>
  );
}

export default function Login() {
  const navigate = useNavigate();
  const [mode,     setMode]     = useState<"email" | "phone">("email");
  const [email,    setEmail]    = useState("");
  const [phone,    setPhone]    = useState("");
  const [password, setPassword] = useState("");
  const [loading,  setLoading]  = useState(false);

  const accent = "hsl(var(--primary))";
  const finishAuth = (token: string) => {
    setAuthToken(token);
    navigate(isOnboarded() ? "/" : "/onboarding");
  };

  const handleLogin = () => {
    const identifier = mode === "email" ? email.trim() : phone.trim();
    if (!identifier || !password) {
      toast({ title: "Заполните все поля", variant: "destructive" });
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      const result = loginUser(identifier, password);
      if ("error" in result) {
        toast({ title: result.error, variant: "destructive" });
        return;
      }
      saveBabyProfileState({
        userName: result.user.name,
        userEmail: result.user.email,
        userRole: result.user.role,
        avatar: result.user.avatar,
      });
      finishAuth(generateToken(result.user.id));
      toast({ title: `Добро пожаловать, ${result.user.name}! 👋` });
    }, 800);
  };

  const handleBiometric = () => {
    finishAuth("biometric-token");
  };

  return (
    <div className="min-h-screen flex flex-col max-w-md mx-auto relative overflow-hidden bg-background">
      <GlassFilter />
      <AnimatedBackground />

      <div className="flex-1 flex flex-col px-6 py-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex-1 flex items-center justify-center"
        >
          <LogoBurst />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="flex flex-col gap-4"
        >
          {/* Переключатель email / phone */}
          <div
            className="flex p-1 rounded-2xl"
            style={{ background: "hsl(var(--muted))", border: "1px solid hsl(var(--border))" }}
          >
            {([["email","✉️ Email"], ["phone","📱 Телефон"]] as const).map(([m, label]) => (
              <motion.button
                key={m}
                onClick={() => setMode(m)}
                whileTap={{ scale: 0.97 }}
                className="flex-1"
              >
                <LiquidSurface
                  tone="primary"
                  active={mode === m}
                  ambientDelay={m === "email" ? 0.1 : 0.7}
                  className="rounded-xl"
                  contentClassName="py-2.5 rounded-xl text-sm font-semibold transition-all"
                  style={mode === m
                    ? { background: "var(--primary-gradient, hsl(var(--primary)))", color: "white" }
                    : { color: "hsl(var(--muted-foreground))" }
                  }
                >
                  {label}
                </LiquidSurface>
              </motion.button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {mode === "email" ? (
              <motion.div
                key="email"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="flex flex-col gap-3"
              >
                <FloatingInput label="Email" value={email} onChange={setEmail} type="email" icon={Mail} color={accent} />
                <FloatingInput label="Пароль" value={password} onChange={setPassword} type="password" color={accent} />
              </motion.div>
            ) : (
              <motion.div
                key="phone"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex flex-col gap-3"
              >
                <FloatingInput label="Номер телефона" value={phone} onChange={setPhone} type="tel" icon={Phone} color={accent} />
                <FloatingInput label="Пароль" value={password} onChange={setPassword} type="password" color={accent} />
              </motion.div>
            )}
          </AnimatePresence>

          <div className="text-right">
            <Link to="/forgot-password" className="text-xs font-semibold" style={{ color: accent }}>
              Забыли пароль?
            </Link>
          </div>

          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={handleLogin}
            disabled={loading}
            className="w-full"
          >
            <LiquidSurface
              tone="primary"
              active={loading}
              ambientDelay={0.4}
              className="rounded-2xl"
              contentClassName="w-full h-14 rounded-2xl font-bold text-base text-white flex items-center justify-center gap-2"
              style={{
                background: "var(--primary-gradient, hsl(var(--primary)))",
                boxShadow: "var(--fab-shadow)",
                opacity: loading ? 0.8 : 1,
              }}
            >
              {loading ? (
                <motion.div
                  className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                />
              ) : (
                <>Войти <ArrowRight className="w-5 h-5" /></>
              )}
            </LiquidSurface>
          </motion.button>

          <BiometricButton onPress={handleBiometric} />

          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-white/[0.06]" />
            <span className="text-xs text-muted-foreground">или</span>
            <div className="flex-1 h-px bg-white/[0.06]" />
          </div>

          <div className="flex gap-3">
            <SocialPill
              label="Apple"
              icon={<span className="text-xl">🍎</span>}
              onClick={() => finishAuth("apple-token")}
              color="white"
            />
            <SocialPill
              label="Google"
              icon={
                <svg width="18" height="18" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
              }
              onClick={() => finishAuth("google-token")}
              color=""
            />
          </div>

          <p className="text-center text-sm text-muted-foreground">
            Нет аккаунта?{" "}
            <Link to="/register" className="font-bold" style={{ color: accent }}>
              Зарегистрироваться
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
