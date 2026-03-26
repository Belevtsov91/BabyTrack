/**
 * Demo seed data — 4 children profiles with comprehensive data.
 * Boy 1: Арсений, 9 months | Boy 2: Максим, 3 years
 * Girl 1: Анастасия, 5 months | Girl 2: Алиса, 5 years
 *
 * The active profile (babyName/birthDate) is Арсений.
 * All other profiles are stored in babytrack_profiles for future multi-profile UI.
 * All CRUD stores (events, milestones, vaccinations, temp, allergens) belong to Арсений.
 */
import { SK } from "./storageKeys";

const SEED_KEY = SK.SEED_MARK;

const NOW = new Date();

function daysAgo(n: number, h = 12, m = 0): string {
  const d = new Date(NOW);
  d.setDate(d.getDate() - n);
  d.setHours(h, m, 0, 0);
  return d.toISOString();
}

function monthsAgo(n: number): string {
  const d = new Date(NOW);
  d.setMonth(d.getMonth() - n);
  return d.toISOString().split("T")[0];
}

function sid(): string {
  return `seed-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// PROFILE HELPERS
// ─────────────────────────────────────────────────────────────────────────────
function makeProfile(
  id: string, name: string, gender: "boy" | "girl",
  birthMonthsAgo: number, avatar: string,
) {
  const birth = new Date(NOW);
  birth.setMonth(birth.getMonth() - birthMonthsAgo);
  birth.setDate(15);
  return {
    id,
    name,
    gender,
    birthDate: birth.toISOString().split("T")[0],
    avatar,
    active: id === "arseny",
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// ARSENY DATA (active baby, 9 months boy) — all CRUD stores
// ─────────────────────────────────────────────────────────────────────────────
function buildArsenyEvents(): object[] {
  const events: object[] = [];

  // ── Daily pattern: last 30 days ──────────────────────────────────────────
  for (let day = 0; day <= 30; day++) {
    const isWeekend = (day % 7 === 0 || day % 7 === 6);

    // Night sleep (from evening to morning)
    events.push({ id: sid(), type: "sleep",   title: "Ночной сон",          timestamp: daysAgo(day, 20, 30), duration: 480 + (Math.random() > 0.5 ? 30 : -20), data: { eventSubType: "sleep" }, favorite: false });
    // Morning
    events.push({ id: sid(), type: "feeding", title: "Кормление грудью",    timestamp: daysAgo(day, 6,  30), duration: 15 + Math.round(Math.random() * 10), data: { eventSubType: "breast", breast: "left" }, favorite: false });
    events.push({ id: sid(), type: "diaper",  title: "Подгузник",           timestamp: daysAgo(day, 7,  10), data: { eventSubType: "diaper", diaperType: "wet" }, favorite: false });
    // Breakfast solid food (> 4 months)
    events.push({ id: sid(), type: "feeding", title: "Прикорм",             timestamp: daysAgo(day, 8,  0),  data: { eventSubType: "solid", amount: 70 + Math.round(Math.random() * 40), unit: "мл" }, favorite: false });
    // Morning nap
    events.push({ id: sid(), type: "sleep",   title: "Дневной сон",         timestamp: daysAgo(day, 9,  30), duration: 50 + Math.round(Math.random() * 30), data: { eventSubType: "sleep" }, favorite: false });
    events.push({ id: sid(), type: "diaper",  title: "Подгузник",           timestamp: daysAgo(day, 11, 0),  data: { eventSubType: "diaper", diaperType: day % 3 === 0 ? "dirty" : "wet" }, favorite: false });
    events.push({ id: sid(), type: "feeding", title: "Кормление грудью",    timestamp: daysAgo(day, 11, 30), duration: 18, data: { eventSubType: "breast", breast: "right" }, favorite: false });
    // Lunch solid
    events.push({ id: sid(), type: "feeding", title: "Прикорм",             timestamp: daysAgo(day, 13, 0),  data: { eventSubType: "solid", amount: 80 + Math.round(Math.random() * 30), unit: "мл" }, favorite: false });
    // Afternoon nap
    events.push({ id: sid(), type: "sleep",   title: "Дневной сон",         timestamp: daysAgo(day, 14, 0),  duration: 60 + Math.round(Math.random() * 30), data: { eventSubType: "sleep" }, favorite: false });
    events.push({ id: sid(), type: "diaper",  title: "Подгузник",           timestamp: daysAgo(day, 15, 30), data: { eventSubType: "diaper", diaperType: "wet" }, favorite: false });
    // Walk — every day
    if (!isWeekend || Math.random() > 0.3) {
      events.push({ id: sid(), type: "activity", title: "Прогулка",         timestamp: daysAgo(day, 16, 0),  duration: 40 + Math.round(Math.random() * 30), data: { eventSubType: "walk" }, favorite: false });
    }
    events.push({ id: sid(), type: "feeding", title: "Кормление грудью",    timestamp: daysAgo(day, 17, 30), duration: 20, data: { eventSubType: "breast", breast: "both" }, favorite: false });
    // Bath — every 2 days
    if (day % 2 === 0) {
      events.push({ id: sid(), type: "activity", title: "Купание",          timestamp: daysAgo(day, 18, 30), duration: 20, data: { eventSubType: "bath" }, favorite: false });
    }
    events.push({ id: sid(), type: "diaper",  title: "Подгузник",           timestamp: daysAgo(day, 19, 0),  data: { eventSubType: "diaper", diaperType: "mixed" }, favorite: false });
    events.push({ id: sid(), type: "feeding", title: "Кормление грудью",    timestamp: daysAgo(day, 20, 0),  duration: 22, data: { eventSubType: "breast", breast: "left" }, favorite: false });
  }

  // ── Special events ────────────────────────────────────────────────────────
  // Weight / height measurements
  events.push({ id: sid(), type: "activity", title: "Вес",           timestamp: daysAgo(0, 10, 0),  data: { eventSubType: "weight", amount: 8.4, unit: "кг" }, favorite: false });
  events.push({ id: sid(), type: "activity", title: "Рост",          timestamp: daysAgo(0, 10, 5),  data: { eventSubType: "height", amount: 70, unit: "см" }, favorite: false });
  events.push({ id: sid(), type: "activity", title: "Обхват головы", timestamp: daysAgo(0, 10, 10), data: { eventSubType: "head", amount: 44, unit: "см" }, favorite: false });
  events.push({ id: sid(), type: "activity", title: "Вес",           timestamp: daysAgo(30, 10, 0), data: { eventSubType: "weight", amount: 8.1, unit: "кг" }, favorite: false });
  events.push({ id: sid(), type: "activity", title: "Рост",          timestamp: daysAgo(30, 10, 5), data: { eventSubType: "height", amount: 68, unit: "см" }, favorite: false });
  events.push({ id: sid(), type: "activity", title: "Обхват головы", timestamp: daysAgo(30, 10, 10),data: { eventSubType: "head", amount: 43.5, unit: "см" }, favorite: false });
  events.push({ id: sid(), type: "activity", title: "Вес",           timestamp: daysAgo(60, 10, 0), data: { eventSubType: "weight", amount: 7.8, unit: "кг" }, favorite: false });
  events.push({ id: sid(), type: "activity", title: "Рост",          timestamp: daysAgo(60, 10, 5), data: { eventSubType: "height", amount: 66, unit: "см" }, favorite: false });
  events.push({ id: sid(), type: "activity", title: "Обхват головы", timestamp: daysAgo(60, 10, 10),data: { eventSubType: "head", amount: 43, unit: "см" }, favorite: false });

  // Doctor visits
  events.push({ id: sid(), type: "activity", title: "Визит к врачу", timestamp: daysAgo(3, 10, 0),  data: { eventSubType: "doctor", doctorName: "Кузнецова Е.В.", specialty: "Педиатр" }, description: "Плановый осмотр 9 месяцев. Вес 8.4кг, рост 70см. Развитие в норме.", favorite: false });
  events.push({ id: sid(), type: "activity", title: "Визит к врачу", timestamp: daysAgo(60, 11, 0), data: { eventSubType: "doctor", doctorName: "Орлова М.Н.", specialty: "Невролог" }, description: "Профилактический осмотр. Всё в порядке.", favorite: false });
  events.push({ id: sid(), type: "activity", title: "Визит к врачу", timestamp: daysAgo(90, 10, 0), data: { eventSubType: "doctor", doctorName: "Кузнецова Е.В.", specialty: "Педиатр" }, description: "Осмотр 6 месяцев. Рост 66см, вес 7.8кг.", favorite: false });

  // Vaccines
  events.push({ id: sid(), type: "activity", title: "Прививка", timestamp: daysAgo(5, 9, 30),  data: { eventSubType: "vaccine", vaccineName: "Пневмококковая (ПКВ13)" }, description: "Небольшое покраснение. Хорошо перенёс.", favorite: false });
  events.push({ id: sid(), type: "activity", title: "Прививка", timestamp: daysAgo(90, 9, 0),  data: { eventSubType: "vaccine", vaccineName: "АКДС + Хиб (3-я доза)" }, description: "Немного капризничал вечером.", favorite: false });
  events.push({ id: sid(), type: "activity", title: "Прививка", timestamp: daysAgo(150, 9, 0), data: { eventSubType: "vaccine", vaccineName: "АКДС + Хиб (2-я доза) + ОПВ" }, description: "Перенёс хорошо.", favorite: false });

  // Medications
  events.push({ id: sid(), type: "activity", title: "Лекарство", timestamp: daysAgo(7, 21, 0),  data: { eventSubType: "medication", medName: "Нурофен", medPurpose: "Жар", medForm: "суспензия", medDose: "2.5 мл", medFrequency: "каждые 6 часов" }, description: "Жар после прививки. Дали перед сном.", favorite: false });
  events.push({ id: sid(), type: "activity", title: "Лекарство", timestamp: daysAgo(45, 20, 0), data: { eventSubType: "medication", medName: "Виферон", medPurpose: "ОРВИ", medForm: "свечи", medDose: "1 шт", medFrequency: "2 раза в день" }, description: "5 дней курс.", favorite: false });
  events.push({ id: sid(), type: "activity", title: "Лекарство", timestamp: daysAgo(45, 8, 0),  data: { eventSubType: "medication", medName: "Аквалор Baby", medPurpose: "Насморк", medForm: "спрей", medDose: "1 доза", medFrequency: "4 раза в день" }, description: "Промывание носика.", favorite: false });

  // Pump sessions
  events.push({ id: sid(), type: "feeding", title: "Сцеживание", timestamp: daysAgo(2, 7, 0), duration: 15, data: { eventSubType: "pump", amount: 120, unit: "мл" }, favorite: false });
  events.push({ id: sid(), type: "feeding", title: "Сцеживание", timestamp: daysAgo(5, 7, 0), duration: 12, data: { eventSubType: "pump", amount: 100, unit: "мл" }, favorite: false });

  // Bottle feeding
  events.push({ id: sid(), type: "feeding", title: "Бутылочка", timestamp: daysAgo(1, 15, 0), data: { eventSubType: "bottle", amount: 150, unit: "мл" }, favorite: false });
  events.push({ id: sid(), type: "feeding", title: "Бутылочка", timestamp: daysAgo(10, 15, 0),data: { eventSubType: "bottle", amount: 130, unit: "мл" }, favorite: false });

  // Special solid food introductions
  events.push({ id: sid(), type: "feeding", title: "Прикорм",  timestamp: daysAgo(60, 11, 0),  data: { eventSubType: "solid", amount: 50, unit: "мл" }, description: "Первый раз морковное пюре — понравилось!", favorite: true });
  events.push({ id: sid(), type: "feeding", title: "Прикорм",  timestamp: daysAgo(55, 11, 0),  data: { eventSubType: "solid", amount: 60, unit: "мл" }, description: "Тыквенное пюре", favorite: false });
  events.push({ id: sid(), type: "feeding", title: "Прикорм",  timestamp: daysAgo(50, 11, 0),  data: { eventSubType: "solid", amount: 70, unit: "мл" }, description: "Кабачок", favorite: false });

  // Moods
  events.push({ id: sid(), type: "mood", title: "Настроение",  timestamp: daysAgo(0, 14, 0),  data: { mood: "happy" },  description: "Смеялся весь день", favorite: false });
  events.push({ id: sid(), type: "mood", title: "Настроение",  timestamp: daysAgo(7, 14, 0),  data: { mood: "fussy" },  description: "Прорезывание зубов", favorite: false });
  events.push({ id: sid(), type: "mood", title: "Настроение",  timestamp: daysAgo(14, 14, 0), data: { mood: "calm" },   description: "Спокойный день", favorite: false });

  return events;
}

function buildArsenyMilestones(): object[] {
  return [
    { id: sid(), title: "Первая улыбка",               emoji: "😊", category: "social",   completed: true,  date: monthsAgo(8) },
    { id: sid(), title: "Реагирует на имя",            emoji: "👂", category: "social",   completed: true,  date: monthsAgo(7) },
    { id: sid(), title: "Держит голову лёжа на животе",emoji: "💪", category: "motor",    completed: true,  date: monthsAgo(7) },
    { id: sid(), title: "Переворачивается со спины на живот", emoji: "🔄", category: "motor", completed: true, date: monthsAgo(6) },
    { id: sid(), title: "Первый прикорм",              emoji: "🥄", category: "feeding",  completed: true,  date: monthsAgo(3) },
    { id: sid(), title: "Сидит с опорой",              emoji: "🪑", category: "motor",    completed: true,  date: monthsAgo(3) },
    { id: sid(), title: "Сидит без опоры",             emoji: "🧍", category: "motor",    completed: true,  date: monthsAgo(1) },
    { id: sid(), title: "Говорит «мама»/«папа»",       emoji: "🗣️", category: "speech",   completed: true,  date: daysAgo(14).split("T")[0] },
    { id: sid(), title: "Машет рукой «пока»",          emoji: "👋", category: "social",   completed: true,  date: daysAgo(7).split("T")[0] },
    { id: sid(), title: "Встаёт с опорой",             emoji: "🦵", category: "motor",    completed: false },
    { id: sid(), title: "Первый шаг",                  emoji: "👣", category: "motor",    completed: false },
    { id: sid(), title: "Пьёт из кружки",              emoji: "🥤", category: "feeding",  completed: false },
    { id: sid(), title: "Жуёт кусочки еды",            emoji: "🦷", category: "feeding",  completed: false },
    { id: sid(), title: "Строит башню из 2 кубиков",   emoji: "🧱", category: "motor",    completed: false },
    { id: sid(), title: "Говорит 3 слова",             emoji: "💬", category: "speech",   completed: false },
  ];
}

function buildArsenyVaccinations(): object[] {
  const futureDate = (months: number) => {
    const d = new Date(NOW);
    d.setMonth(d.getMonth() + months);
    return d.toISOString().split("T")[0];
  };
  return [
    { id: sid(), name: "БЦЖ",                               scheduledDate: monthsAgo(9), completedDate: monthsAgo(9), status: "completed", notes: "Роддом, 1-е сутки" },
    { id: sid(), name: "Гепатит B (1-я доза)",              scheduledDate: monthsAgo(9), completedDate: monthsAgo(9), status: "completed", notes: "Роддом" },
    { id: sid(), name: "Гепатит B (2-я доза)",              scheduledDate: monthsAgo(8), completedDate: monthsAgo(8), status: "completed", notes: "1 месяц" },
    { id: sid(), name: "АКДС + Хиб (1-я доза)",            scheduledDate: monthsAgo(6), completedDate: monthsAgo(6), status: "completed", notes: "3 месяца" },
    { id: sid(), name: "ОПВ (1-я доза)",                    scheduledDate: monthsAgo(6), completedDate: monthsAgo(6), status: "completed", notes: "3 месяца" },
    { id: sid(), name: "Пневмококковая ПКВ13 (1-я доза)",   scheduledDate: monthsAgo(6), completedDate: monthsAgo(6), status: "completed", notes: "3 месяца" },
    { id: sid(), name: "АКДС + Хиб (2-я доза)",            scheduledDate: monthsAgo(4), completedDate: monthsAgo(4), status: "completed", notes: "4.5 месяца" },
    { id: sid(), name: "ОПВ (2-я доза)",                    scheduledDate: monthsAgo(4), completedDate: monthsAgo(4), status: "completed", notes: "4.5 месяца" },
    { id: sid(), name: "АКДС + Хиб (3-я доза)",            scheduledDate: monthsAgo(3), completedDate: monthsAgo(3), status: "completed", notes: "6 месяцев" },
    { id: sid(), name: "ОПВ (3-я доза)",                    scheduledDate: monthsAgo(3), completedDate: monthsAgo(3), status: "completed", notes: "6 месяцев" },
    { id: sid(), name: "Гепатит B (3-я доза)",              scheduledDate: monthsAgo(3), completedDate: monthsAgo(3), status: "completed", notes: "6 месяцев" },
    { id: sid(), name: "Пневмококковая ПКВ13 (2-я доза)",   scheduledDate: daysAgo(5).split("T")[0], completedDate: daysAgo(5).split("T")[0], status: "completed", notes: "9 месяцев" },
    { id: sid(), name: "Корь-Краснуха-Паротит (КПК)",        scheduledDate: futureDate(3), status: "pending", notes: "12 месяцев" },
    { id: sid(), name: "Ветряная оспа",                      scheduledDate: futureDate(3), status: "pending", notes: "12 месяцев" },
    { id: sid(), name: "АКДС (R1 ревакцинация)",             scheduledDate: futureDate(3), status: "pending", notes: "18 месяцев" },
  ];
}

function buildArsenyTemperature(): object[] {
  const records: object[] = [];
  // Last 30 days of temp readings
  for (const [day, val, note] of [
    [0,  36.6, "Утром, норма"],
    [2,  37.2, "Чуть повышена, наблюдаем"],
    [5,  37.8, "После прививки ПКВ13"],
    [6,  37.1, "Снижается"],
    [7,  36.7, "Норма"],
    [14, 36.5, "Плановое измерение"],
    [21, 36.6, "Норма"],
    [28, 38.1, "ОРВИ, 1-й день"],
    [29, 38.4, "ОРВИ, 2-й день — дали Нурофен"],
    [30, 37.5, "ОРВИ, 3-й день — идём на поправку"],
  ] as [number, number, string][]) {
    records.push({ id: sid(), value: val, timestamp: daysAgo(day, 8, 0), notes: note });
  }
  return records;
}

function buildArsenyAllergens(): object[] {
  return [
    { id: sid(), food: "Морковь",         date: monthsAgo(3), reaction: "none",     notes: "Первый прикорм — реакции нет, съел 50г" },
    { id: sid(), food: "Тыква",           date: monthsAgo(2), reaction: "none",     notes: "Хорошо поел, 70г" },
    { id: sid(), food: "Кабачок",         date: monthsAgo(2), reaction: "none",     notes: "60г — понравилось" },
    { id: sid(), food: "Яблоко",          date: monthsAgo(1), reaction: "mild",     notes: "Лёгкое покраснение щёк — понаблюдать" },
    { id: sid(), food: "Гречневая каша",  date: monthsAgo(1), reaction: "none",     notes: "Безмолочная, ел хорошо" },
    { id: sid(), food: "Брокколи",        date: daysAgo(20).split("T")[0], reaction: "watch", notes: "Небольшое вздутие" },
    { id: sid(), food: "Картофель",       date: daysAgo(15).split("T")[0], reaction: "none",  notes: "Пюре — нейтрально" },
    { id: sid(), food: "Груша",           date: daysAgo(10).split("T")[0], reaction: "none",  notes: "Понравилось" },
    { id: sid(), food: "Индейка",         date: daysAgo(5).split("T")[0],  reaction: "none",  notes: "Первое мясное пюре" },
  ];
}

// ─────────────────────────────────────────────────────────────────────────────
// OTHER PROFILES (stored as reference for future multi-profile UI)
// ─────────────────────────────────────────────────────────────────────────────
function buildProfiles(): object[] {
  return [
    makeProfile("arseny",     "Арсений",   "boy",  9,  "👶"),
    makeProfile("maxim",      "Максим",    "boy",  36, "👦"),
    makeProfile("anastasia",  "Анастасия", "girl", 5,  "👶"),
    makeProfile("alisa",      "Алиса",     "girl", 60, "👧"),
  ];
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN EXPORT
// ─────────────────────────────────────────────────────────────────────────────
export function seedDemoData() {
  if (localStorage.getItem(SEED_KEY)) return;
  const hasExistingState = Boolean(
    localStorage.getItem(SK.AUTH_TOKEN) ||
    localStorage.getItem(SK.EVENTS) ||
    localStorage.getItem(SK.LEGACY_EVENTS) ||
    localStorage.getItem(SK.BABY_NAME),
  );

  if (hasExistingState) {
    localStorage.setItem(SEED_KEY, "existing-state");
    return;
  }

  // Active baby profile — Арсений (9 months, boy)
  const arsenyBirth = (() => {
    const d = new Date(NOW);
    d.setMonth(d.getMonth() - 9);
    d.setDate(15);
    return d.toISOString().split("T")[0];
  })();

  localStorage.setItem(SK.AUTH_TOKEN,        "mock-token");
  localStorage.setItem(SK.ONBOARDED,         "true");
  localStorage.setItem(SK.BABY_NAME,         "Арсений");
  localStorage.setItem(SK.BIRTH_DATE,        arsenyBirth);
  localStorage.setItem(SK.BABY_GENDER,       "boy");
  localStorage.setItem(SK.USER_NAME,         "Мама");
  localStorage.setItem(SK.USER_EMAIL,        "mama@example.com");
  localStorage.setItem(SK.USER_AVATAR,       "👩");
  localStorage.setItem(SK.USER_ROLE,         "mom");
  localStorage.setItem(SK.TRACKED_FEATURES,  JSON.stringify(["sleep","feeding","diaper","growth","health","milestones"]));

  // Settings defaults
  localStorage.setItem(SK.SHOW_SOLID, "auto");
  localStorage.setItem(SK.SHOW_WALK,  "1");
  localStorage.setItem(SK.SHOW_MOOD,  "1");
  localStorage.setItem(SK.SYNC_ENABLED, "0");
  localStorage.setItem(SK.UNIT_VOLUME, "мл");
  localStorage.setItem(SK.UNIT_LENGTH, "см");
  localStorage.setItem(SK.UNIT_WEIGHT, "кг");
  localStorage.setItem(SK.UNIT_TEMPERATURE, "°C");

  // CRUD data for active baby
  localStorage.setItem(SK.EVENTS,       JSON.stringify(buildArsenyEvents()));
  localStorage.setItem(SK.MILESTONES,   JSON.stringify(buildArsenyMilestones()));
  localStorage.setItem(SK.VACCINATIONS, JSON.stringify(buildArsenyVaccinations()));
  localStorage.setItem(SK.TEMPERATURE,  JSON.stringify(buildArsenyTemperature()));
  localStorage.setItem(SK.ALLERGENS,    JSON.stringify(buildArsenyAllergens()));
  localStorage.setItem(SK.PHOTOS,       JSON.stringify([]));

  // All 4 profiles (for future multi-profile UI)
  localStorage.setItem(SK.PROFILES, JSON.stringify(buildProfiles()));

  // Medication history for autocomplete
  localStorage.setItem(SK.MED_HISTORY, JSON.stringify([
    { name: "Нурофен",       purpose: "Жар, боль",   form: "суспензия", unit: "мл" },
    { name: "Парацетамол",   purpose: "Жар",         form: "суппозитории", unit: "мг" },
    { name: "Виферон",       purpose: "ОРВИ, грипп", form: "свечи",     unit: "шт" },
    { name: "Аквалор Baby",  purpose: "Насморк",     form: "спрей",     unit: "доза" },
    { name: "Зиртек",        purpose: "Аллергия",    form: "капли",     unit: "кап" },
    { name: "Смекта",        purpose: "Диарея",      form: "порошок",   unit: "пак" },
    { name: "Бифиформ Baby", purpose: "Пробиотик",   form: "масло",     unit: "доза" },
    { name: "Д3 (Аквадетрим)", purpose: "Витамин D", form: "капли",     unit: "кап" },
  ]));

  localStorage.setItem(SEED_KEY, "1");
}

/** Call this to reset all demo data (e.g. from Settings dev menu) */
export function resetSeedData() {
  localStorage.removeItem(SEED_KEY);
  localStorage.removeItem(SK.EVENTS);
  localStorage.removeItem(SK.MILESTONES);
  localStorage.removeItem(SK.VACCINATIONS);
  localStorage.removeItem(SK.TEMPERATURE);
  localStorage.removeItem(SK.ALLERGENS);
  localStorage.removeItem(SK.PHOTOS);
  localStorage.removeItem(SK.PROFILES);
  localStorage.removeItem(SK.MED_HISTORY);
}
