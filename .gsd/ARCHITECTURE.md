# Architecture

## Overview
Single-page React приложение, mobile-first (max-width 430px), PWA.
Нет бэкенда — все данные в localStorage через CRUD-фабрики в `src/lib/crud.ts`.
Роутинг: react-router-dom v6, защищённые маршруты через RequireAuth / RequireOnboarding.

## Directory structure
```
src/
  pages/
    auth/           Welcome, Login, Register, Onboarding
    tracking/       AddEvent, EventDetail, Favorites, Calendar, Reminders
    health/         DoctorChat, Vaccinations, Temperature, Allergens, GrowthCharts, Medications
    social/         Chat, YearlyRecap
    media/          PhotoDiary, PdfReport
    profile/        BabyProfileDetail, Milestones
    Index.tsx       Home (радиальные виджеты, таймлайн)
    Stats.tsx
    Settings.tsx
    NotFound.tsx
    Search.tsx
  components/
    layout/         AppLayout.tsx, TabBar.tsx, PageTransition.tsx
    ui/             полный shadcn набор
    ActiveTimer.tsx, BabyProfile.tsx, Timeline.tsx, SummaryCard.tsx
    QuickActions.tsx, MotionContainer.tsx, NavLink.tsx
  lib/
    crud.ts         localStorage CRUD-фабрики
    theme.tsx       ThemeProvider + useTheme (5 тем)
    i18n.tsx        I18nProvider + useI18n (5 языков)
    utils.ts        cn() = twMerge + clsx
    haptic.ts       вибрация (navigator.vibrate)
  hooks/
    use-toast.ts
    use-mobile.tsx
  test/
    setup.ts
```

## Data layer (crud.ts)
CRUD-фабрики, все → localStorage:
- `eventsDB`       → key: `babytrack_events`    (BabyEvent: sleep|feeding|diaper|activity|mood|temperature|milestone)
- `milestonesDB`   → key: `babytrack_milestones`
- `vaccinationsDB` → key: `babytrack_vaccinations`
- `temperatureDB`  → key: `babytrack_temperature`
- `allergensDB`    → key: `babytrack_allergens`
- `photosDB`       → key: `babytrack_photos`
- `exportAllData()` / `importAllData(json)`
- Baby profile: `babyName`, `birthDate` — прямо в localStorage

## Auth flow
```
/welcome → /login | /register → /onboarding → / (home)
```
- RequireAuth — проверяет localStorage `authToken`
- RequireOnboarding — проверяет localStorage `onboarded`
- Нет реальной авторизации, токен просто пишется в localStorage при регистрации

## Routing (App.tsx)
Все защищённые маршруты обёрнуты в PageTransition.
TabBar показывается везде кроме DoctorChat (showTabBar={false}).

## Layout system
- AppLayout — min-h-screen bg-background, max-w-md mx-auto pb-24
- TabBar — 5 вкладок: / | /stats | /add (центральная FAB) | /chat | /settings
- PageTransition — framer-motion AnimatePresence обёртка

## Theme system (lib/theme.tsx)
5 тем: dark / light / pastel / spring / winter
Применяется через document.documentElement.style.setProperty() в useEffect.
Хранится в localStorage `babytrack_theme`.
Каждая тема — полный набор CSS-переменных (background, foreground, primary, muted, card, border, 8 цветов категорий).

## I18n system (lib/i18n.tsx)
5 языков: ru / en / uk / ro / el
Хранится в localStorage `babytrack_lang`.
Используется через useI18n() хук.

## CSS design system
Кастомные классы (index.css):
- `glass-card` — карточка с backdrop-filter + тёмный фон
- `tab-bar`, `tab-item`, `tab-item-active` — нижняя навигация
- `activity-btn-*` — кнопки активностей
- `fab` — floating action button
- `pt-safe`, `pb-safe` — iOS safe area insets (НЕ определены в tailwind.config — только в index.css через env(safe-area-inset-*))

HSL CSS переменные для 8 категорий:
`--sleep`, `--feeding`, `--diaper`, `--activity`, `--mood`, `--health`, `--growth`, `--milestone`
+ мягкие варианты: `--sleep-soft`, `--feeding-soft`, etc.

## Key constraints
1. Max ширина контейнера — 430px (мобильный экран)
2. Все данные — localStorage, нет API
3. TypeScript — relaxed (strict: false, noImplicitAny: false)
4. Нет реального бэкенда, нет БД
5. framer-motion обязателен для всех страниц (анимации — часть дизайна)
6. sonner.tsx использует next-themes (конфликт с кастомным ThemeProvider — известный баг)
