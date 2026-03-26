# State

## Active area
Интеграция пакета редизайна — замена страниц на новые версии из babytrack_redesign_FULL.zip

## Current branch
main (git не инициализирован в проекте)

## Current active task
none — задача ещё не создана

## Project readiness by area

### ✅ Готово / работает
- Роутинг (App.tsx) — полный, все маршруты настроены
- Data layer (crud.ts) — все 6 DB фабрик рабочие
- ThemeProvider (5 тем) — работает
- I18nProvider (5 языков) — работает
- AppLayout + TabBar — работают
- shadcn/ui компоненты — все установлены
- Tailwind config — настроен с кастомными токенами
- index.css — glass-card, tab-bar, activity-btn-*, fab, pt-safe/pb-safe
- AddEvent.tsx — redesigned (PinnedRow, EventCard, SectionBlock, поиск)
- EventDetail.tsx — redesigned (CircularTimer, BreastSelector, DiaperSelector, SaveConfetti)
- Chat.tsx — redesigned (ActivityFeed, QuickBroadcast, MessageBubble)
- GrowthCharts.tsx — redesigned (recharts AreaChart+LineChart, WHO данные)
- BabyProfileDetail.tsx — redesigned (HeroCard, MetricRings, EditSheet)

### 🔄 Частично / есть mock data
- Index.tsx (home) — redesigned UI, но данные частично mock
- Stats.tsx — только count/total из DB, chart data хардкод
- Medications.tsx — redesigned но mock data, нет DB
- Milestones.tsx — redesigned но mock data
- Reminders.tsx — redesigned но mock data, local state
- Calendar.tsx — redesigned но local state только
- PhotoDiary.tsx — redesigned но mock photos

### ❌ Требует замены из redesign ZIP
- Welcome.tsx — нет AutoRedirect, базовая версия
- Vaccinations.tsx — полностью mock, нет redesign визуала (ImmunityShield etc.)
- Temperature.tsx — mock, нет redesign визуала
- Allergens.tsx — hardcoded initialAllergens, нет redesign визуала
- DoctorVisits.tsx — нет файла, только DoctorChat (redesign добавляет полноценный)
- YearlyRecap/YearRecap — есть но не интегрирован в redesign

### ❓ Нет текущей версии (только в redesign ZIP)
- Login.tsx redesign (AnimatedBackground, LogoBurst, BiometricButton)
- Register.tsx redesign (StepForm, StrengthBar, AvatarPicker)
- Onboarding.tsx redesign (6-step immersive flow)
- Search.tsx redesign (LiveSearch + Highlight, CategoryFilter)
- Settings.tsx redesign (ThemeCarousel, LangGrid, UnitsPanel)

## Known risks
- next-themes в sonner.tsx vs кастомный ThemeProvider — рассинхрон тем
- pt-safe/pb-safe не в tailwind.config — работает только через index.css env()
- Medications.tsx (redesign): баг с двойным import useNavigate из несуществующего 'react-router-motion'
- @tanstack/react-query настроен но практически не используется — потенциал для рефактора данных

## Last touched areas
- Анализ всего кодбейса (батчи 1-3)
- Заполнение GSD документации

## Notes
- git не инициализирован — рекомендуется git init перед началом
- Нет .env файлов — проект полностью клиентский
