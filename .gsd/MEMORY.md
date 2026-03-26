# Memory

Operative rules — что помнить при имплементации.
Для архива решений (почему X вместо Y) — см. DECISIONS.md.

## Дизайн-правила
- Стиль: mobile-first тёмный UI, rounded-3xl карточки, dark gradient backgrounds
- Все новые страницы используют framer-motion (AnimatePresence + motion.div)
- Иконки — только lucide-react, нигде больше
- Цвета категорий — только через CSS переменные (`text-[hsl(var(--sleep))]`), не хардкод
- glass-card класс — для карточек в списках (не card shadcn)
- Тема применяется через ThemeProvider, НЕ через next-themes (sonner.tsx — исключение, известный конфликт)

## Данные
- Все DB через crud.ts фабрики, НЕ прямой localStorage.getItem
- babyName и birthDate — прямо из localStorage (не через eventsDB)
- exportAllData / importAllData — для Settings DataSection

## Роутинг
- navigate('/add') — AddEvent (список событий)
- navigate('/add/sleep') — EventDetail с типом (через useParams eventType)
- AppLayout showTabBar={false} — только для DoctorChat и полноэкранных флоу (Onboarding, YearlyRecap)

## Переводы
- Все строки через useI18n() — НЕ хардкодить русский/английский текст напрямую
- Языки: ru / en / uk / ro / el

## Редизайн-правила (при интеграции redesign-пакета)
- Файлы из redesign ZIP — drop-in замена для src/pages/
- Medications.tsx из redesign: удалить первый import useNavigate (from 'react-router-motion' — не существует)
- Welcome.tsx redesign: добавляет AutoRedirect (умный редирект по authToken)
- Не менять маршруты — они должны совпадать с App.tsx
- Не ломать crud.ts контракт (методы: getAll, getById, create, update, delete, count)

## Известные проблемы (не трогать без явного запроса)
- pt-safe/pb-safe: определены только в index.css через env(safe-area-inset-*), в tailwind.config НЕТ
- sonner.tsx: использует next-themes вместо кастомного useTheme — потенциальный рассинхрон темы
- Stats.tsx: chart data хардкод (только count/total читается из DB)
- Calendar.tsx, Favorites.tsx: только local state, DB не подключён
- Temperature.tsx, Vaccinations.tsx: mock data, DB не подключён
