import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, AlertTriangle, X } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { toast } from "@/hooks/use-toast";
import { allergensDB } from "@/lib/crud";

const hc = (v: string) => `hsl(var(${v}))`;
const hca = (v: string, a: number) => `hsl(var(${v}) / ${a})`;
const FOOD_TIMELINE_KEY = "babytrack_food_timeline";

type Reaction = "none" | "mild" | "severe";
type StoredReaction = "none" | "watch" | "allergic";

interface Allergen {
  id: string;
  name: string;
  emoji: string;
  category: string;
  reaction: Reaction;
  date: string;
  note?: string;
}

interface FoodEntry {
  id: string;
  name: string;
  emoji: string;
  date: string;
  reaction: Reaction;
  amount: string;
}

const ALLERGEN_SEEDS: Allergen[] = [
  { id: "a1", name: "Цитрусовые", emoji: "🍊", category: "Фрукты", reaction: "mild", date: "2025-04-10", note: "Покраснение щёк" },
  { id: "a2", name: "Клубника", emoji: "🍓", category: "Ягоды", reaction: "mild", date: "2025-05-01" },
  { id: "a3", name: "Куриный белок", emoji: "🥚", category: "Белки", reaction: "none", date: "2025-03-15" },
  { id: "a4", name: "Арахис", emoji: "🥜", category: "Орехи", reaction: "severe", date: "2025-05-20", note: "Крапивница, срочно к врачу!" },
];

const FOOD_SEEDS: FoodEntry[] = [
  { id: "f1", name: "Кабачок", emoji: "🥒", date: "2025-03-15", reaction: "none", amount: "50г" },
  { id: "f2", name: "Цветная капуста", emoji: "🥦", date: "2025-03-22", reaction: "none", amount: "60г" },
  { id: "f3", name: "Яблочное пюре", emoji: "🍎", date: "2025-04-01", reaction: "none", amount: "50г" },
  { id: "f4", name: "Морковь", emoji: "🥕", date: "2025-04-08", reaction: "mild", amount: "40г" },
  { id: "f5", name: "Куриный бульон", emoji: "🍗", date: "2025-04-15", reaction: "none", amount: "30мл" },
  { id: "f6", name: "Груша", emoji: "🍐", date: "2025-04-22", reaction: "none", amount: "70г" },
  { id: "f7", name: "Творог", emoji: "🧀", date: "2025-05-01", reaction: "none", amount: "30г" },
  { id: "f8", name: "Клубника", emoji: "🍓", date: "2025-05-10", reaction: "mild", amount: "20г" },
  { id: "f9", name: "Банан", emoji: "🍌", date: "2025-05-20", reaction: "none", amount: "50г" },
  { id: "f10", name: "Арахис", emoji: "🥜", date: "2025-05-25", reaction: "severe", amount: "5г" },
];

const REACTION_CONFIG: Record<Reaction, { label: string; color: string; bg: string; icon: string }> = {
  none: { label: "Норма", color: hc("--feeding"), bg: hca("--feeding", 0.12), icon: "✓" },
  mild: { label: "Лёгкая", color: hc("--diaper"), bg: hca("--diaper", 0.12), icon: "⚠️" },
  severe: { label: "Сильная", color: hc("--health"), bg: hca("--health", 0.12), icon: "🚨" },
};

function normalize(value: string) {
  return value.toLowerCase().replace(/[^a-zа-я0-9]+/gi, "");
}

function toStoredReaction(reaction: Reaction): StoredReaction {
  if (reaction === "mild") return "watch";
  if (reaction === "severe") return "allergic";
  return "none";
}

function fromStoredReaction(reaction: string | undefined): Reaction {
  if (reaction === "watch") return "mild";
  if (reaction === "allergic") return "severe";
  return "none";
}

function loadStoredFoodTimeline(): FoodEntry[] {
  try {
    const raw = localStorage.getItem(FOOD_TIMELINE_KEY);
    if (raw) return JSON.parse(raw) as FoodEntry[];
  } catch {
    const fallback = [...FOOD_SEEDS];
    localStorage.setItem(FOOD_TIMELINE_KEY, JSON.stringify(fallback));
    return fallback;
  }
  const next = [...FOOD_SEEDS];
  localStorage.setItem(FOOD_TIMELINE_KEY, JSON.stringify(next));
  return next;
}

function saveFoodTimeline(entries: FoodEntry[]) {
  localStorage.setItem(FOOD_TIMELINE_KEY, JSON.stringify(entries));
}

function seedAllergens() {
  const existing = allergensDB.getAll();
  if (existing.length === 0) {
    ALLERGEN_SEEDS.forEach((seed) => {
      allergensDB.create({
        food: seed.name,
        date: seed.date,
        reaction: toStoredReaction(seed.reaction),
        notes: seed.note,
      });
    });
  }
}

function loadAllergens(): Allergen[] {
  seedAllergens();
  const records = allergensDB.getAll();
  return records.map((record) => {
    const seed = ALLERGEN_SEEDS.find((item) => normalize(item.name) === normalize(record.food));
    return {
      id: record.id,
      name: record.food,
      emoji: seed?.emoji ?? "🍽️",
      category: seed?.category ?? "Добавлено",
      reaction: fromStoredReaction(record.reaction),
      date: record.date,
      note: record.notes,
    };
  });
}

function loadFoodEntries() {
  return loadStoredFoodTimeline();
}

function AllergenBubble({ allergen }: { allergen: Allergen }) {
  const [open, setOpen] = useState(false);
  const rc = REACTION_CONFIG[allergen.reaction];

  return (
    <motion.div layout initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }}>
      <motion.button
        onClick={() => setOpen((v) => !v)}
        whileTap={{ scale: 0.93 }}
        className="flex flex-col items-center gap-2 p-4 rounded-2xl w-full transition-all"
        style={{ background: rc.bg, border: `1.5px solid ${rc.color}` }}
      >
        <span className="text-3xl">{allergen.emoji}</span>
        <p className="text-xs font-bold text-foreground text-center leading-tight">{allergen.name}</p>
        <div className="flex items-center gap-1 px-2 py-0.5 rounded-full" style={{ background: hca("--feeding", 0.15) }}>
          <span className="text-[9px]">{rc.icon}</span>
          <span className="text-[9px] font-bold" style={{ color: rc.color }}>{rc.label}</span>
        </div>
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="mt-1 p-3 rounded-2xl" style={{ background: rc.bg, border: `1px solid ${rc.color}` }}>
              <p className="text-[10px] text-muted-foreground">
                Обнаружено: {new Date(allergen.date).toLocaleDateString("ru-RU", { day: "numeric", month: "long" })}
              </p>
              <p className="text-[10px] text-muted-foreground mt-0.5">Категория: {allergen.category}</p>
              {allergen.note && <p className="text-xs text-foreground/80 mt-1 italic">"{allergen.note}"</p>}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function FoodTimelineView({ entries }: { entries: FoodEntry[] }) {
  return (
    <div className="flex flex-col gap-0">
      {entries.map((entry, i) => {
        const rc = REACTION_CONFIG[entry.reaction];
        return (
          <motion.div
            key={entry.id}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.04 }}
            className="flex gap-3"
          >
            <div className="flex flex-col items-center w-5 shrink-0">
              <div
                className="w-5 h-5 rounded-full flex items-center justify-center text-xs shrink-0"
                style={{ background: rc.color }}
              >
                {entry.reaction === "none" ? "✓" : entry.reaction === "mild" ? "!" : "!!"}
              </div>
              {i < entries.length - 1 && <div className="w-0.5 flex-1 mt-0.5" style={{ background: hc("--border") }} />}
            </div>

            <div className="flex-1 pb-3">
              <div
                className="flex items-center gap-2 p-3 rounded-2xl"
                style={{ background: hca("--feeding", 0.06), border: `1px solid ${hca("--feeding", 0.12)}` }}
              >
                <span className="text-xl">{entry.emoji}</span>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-foreground">{entry.name}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {new Date(entry.date).toLocaleDateString("ru-RU", { day: "numeric", month: "short" })}
                    {" · "}{entry.amount}
                  </p>
                </div>
                <span className="text-[9px] font-bold px-2 py-1 rounded-xl shrink-0" style={{ background: hca("--feeding", 0.15), color: rc.color }}>
                  {rc.label}
                </span>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

const FOOD_EMOJIS = ["🥒", "🥦", "🍎", "🥕", "🍗", "🍐", "🧀", "🍌", "🥜", "🍓", "🥚", "🌽", "🥛", "🐟", "🍯"];

function AddSheet({
  onClose,
  onSave,
}: {
  onClose: () => void;
  onSave: (entry: { allergen: Allergen; food: FoodEntry }) => void;
}) {
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState("🥒");
  const [reaction, setReaction] = useState<Reaction>("none");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");

  const handleSave = () => {
    if (!name.trim()) return;
    const today = new Date().toISOString().slice(0, 10);
    const allergen: Allergen = {
      id: `allergen-${Date.now()}`,
      name: name.trim(),
      emoji,
      category: "Добавлено",
      reaction,
      date: today,
      note: note.trim() || undefined,
    };
    const food: FoodEntry = {
      id: `food-${Date.now()}`,
      name: name.trim(),
      emoji,
      date: today,
      reaction,
      amount: amount.trim() || "без указания",
    };
    onSave({ allergen, food });
    toast({ title: `✅ ${emoji} ${name} добавлено` });
    onClose();
  };

  return (
    <motion.div
      initial={{ y: "100%" }}
      animate={{ y: 0 }}
      exit={{ y: "100%" }}
      transition={{ type: "spring", stiffness: 300, damping: 32 }}
      className="fixed inset-x-0 bottom-0 z-40 max-w-md mx-auto rounded-t-3xl"
      style={{ background: hc("--background"), border: `1px solid ${hc("--border")}` }}
    >
      <div className="flex justify-center pt-3 pb-1">
        <div className="w-10 h-1 rounded-full bg-white/20" />
      </div>
      <div className="px-5 pb-10 flex flex-col gap-4 max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold">Добавить продукт</h3>
          <button onClick={onClose}><X className="w-5 h-5 text-muted-foreground" /></button>
        </div>

        <div className="flex flex-wrap gap-2">
          {FOOD_EMOJIS.map((value) => (
            <button
              key={value}
              onClick={() => setEmoji(value)}
              className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
              style={emoji === value
                ? { background: hca("--sleep", 0.20), border: `2px solid ${hc("--sleep")}` }
                : { background: hc("--muted"), border: "2px solid transparent" }
              }
            >
              {value}
            </button>
          ))}
        </div>

        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Название продукта"
          className="w-full h-12 px-4 rounded-2xl bg-muted text-foreground text-sm focus:outline-none"
          style={{ border: `1px solid ${hc("--border")}` }}
        />

        <input
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="Количество (например 50г)"
          className="w-full h-12 px-4 rounded-2xl bg-muted text-foreground text-sm focus:outline-none"
          style={{ border: `1px solid ${hc("--border")}` }}
        />

        <div>
          <p className="text-xs text-muted-foreground mb-2">Реакция</p>
          <div className="flex gap-2">
            {(["none", "mild", "severe"] as Reaction[]).map((value) => {
              const rc = REACTION_CONFIG[value];
              return (
                <button
                  key={value}
                  onClick={() => setReaction(value)}
                  className="flex-1 py-3 rounded-2xl text-xs font-bold transition-all"
                  style={reaction === value
                    ? { background: rc.bg, border: `1.5px solid ${rc.color}`, color: rc.color }
                    : { background: hc("--muted"), border: "1.5px solid transparent", color: hc("--muted-foreground") }
                  }
                >
                  {rc.icon} {rc.label}
                </button>
              );
            })}
          </div>
        </div>

        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Заметка о реакции"
          className="w-full h-12 px-4 rounded-2xl bg-muted text-foreground text-sm focus:outline-none"
          style={{ border: `1px solid ${hc("--border")}` }}
        />

        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={handleSave}
          className="w-full h-14 rounded-2xl font-bold text-white"
          style={{ background: `linear-gradient(135deg, ${hc("--feeding")}, ${hca("--feeding", 0.60)})` }}
        >
          Сохранить
        </motion.button>
      </div>
    </motion.div>
  );
}

export default function Allergies() {
  const [tab, setTab] = useState<"allergens" | "food">("allergens");
  const [showAdd, setShowAdd] = useState(false);
  const [allergens, setAllergens] = useState<Allergen[]>(() => loadAllergens());
  const [foodEntries, setFoodEntries] = useState<FoodEntry[]>(() => loadFoodEntries());

  const severe = allergens.filter((item) => item.reaction === "severe");

  const handleSave = ({ allergen, food }: { allergen: Allergen; food: FoodEntry }) => {
    const nextAllergens = [allergen, ...allergens];
    const nextFood = [food, ...foodEntries];

    allergensDB.create({
      food: allergen.name,
      date: allergen.date,
      reaction: toStoredReaction(allergen.reaction),
      notes: allergen.note,
    });
    saveFoodTimeline(nextFood);
    setAllergens(nextAllergens);
    setFoodEntries(nextFood);
  };

  return (
    <AppLayout>
      <AnimatePresence>
        {showAdd && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-30 bg-black/60"
              onClick={() => setShowAdd(false)}
            />
            <AddSheet onClose={() => setShowAdd(false)} onSave={handleSave} />
          </>
        )}
      </AnimatePresence>

      <div className="flex flex-col gap-4 pt-safe pb-10">
        <motion.header
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          className="px-4 md:px-6 pt-4 flex items-center justify-between"
        >
          <div>
            <h1 className="text-2xl font-bold text-foreground">Аллергии и прикорм</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {allergens.length} аллергена · {foodEntries.length} продуктов
            </p>
          </div>
          <motion.button
            whileTap={{ scale: 0.88 }}
            onClick={() => setShowAdd(true)}
            className="w-10 h-10 rounded-2xl flex items-center justify-center"
            style={{ background: hca("--feeding", 0.15) }}
          >
            <Plus className="w-5 h-5 text-green-400" />
          </motion.button>
        </motion.header>

        {severe.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mx-4 md:mx-6 flex items-center gap-3 p-3 rounded-2xl"
            style={{ background: hca("--health", 0.12), border: `1px solid ${hca("--health", 0.35)}` }}
          >
            <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
            <p className="text-xs font-semibold text-red-400">
              ⚠️ Строгий запрет: {severe.map((item) => item.name).join(", ")}
            </p>
          </motion.div>
        )}

        <div className="px-4 md:px-6">
          <div
            className="flex p-1 rounded-2xl"
            style={{ background: hc("--background"), border: `1px solid ${hc("--border")}` }}
          >
            {(["allergens", "food"] as const).map((value) => (
              <button
                key={value}
                onClick={() => setTab(value)}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all"
                style={tab === value
                  ? { background: `linear-gradient(135deg, ${hc("--sleep")}, ${hc("--milestone")})`, color: "white" }
                  : { color: hc("--muted-foreground") }
                }
              >
                {value === "allergens" ? "⚠️ Аллергены" : "🥣 Прикорм"}
              </button>
            ))}
          </div>
        </div>

        <AnimatePresence mode="wait">
          {tab === "allergens" ? (
            <motion.div
              key="allergens"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="px-4 md:px-6"
            >
              <div className="grid grid-cols-3 gap-2">
                {allergens.map((item) => (
                  <AllergenBubble key={item.id} allergen={item} />
                ))}

                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setShowAdd(true)}
                  className="flex flex-col items-center justify-center gap-2 p-4 rounded-2xl"
                  style={{ background: hc("--muted"), border: `2px dashed ${hc("--border")}` }}
                >
                  <Plus className="w-6 h-6 text-muted-foreground" />
                  <span className="text-[10px] text-muted-foreground">Добавить</span>
                </motion.button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="food"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="px-4 md:px-6"
            >
              <FoodTimelineView entries={foodEntries} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AppLayout>
  );
}
