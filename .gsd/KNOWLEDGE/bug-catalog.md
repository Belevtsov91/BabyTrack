# Bug Catalog

Known bugs, past incidents, and their fixes.

---

## BUG-001 — Medications.tsx (redesign): двойной import useNavigate
**Файл:** `babytrack_redesign_FULL.zip` → Medications.tsx
**Симптом:** Ошибка компиляции — import из несуществующего пакета 'react-router-motion'
**Root cause:** Опечатка в первом import:
```tsx
// УДАЛИТЬ:
import { useNavigate } from 'react-router-motion';  // не существует
// ОСТАВИТЬ:
import { useNavigate } from 'react-router-dom';     // правильно
```
**Статус:** Не исправлен (баг в ZIP-архиве, не в текущем codebase)
**Fix:** При копировании Medications.tsx из ZIP — удалить первую строку import

---

## BUG-002 — sonner.tsx использует next-themes
**Файл:** `src/components/ui/sonner.tsx`
**Симптом:** Toast уведомления могут не подхватывать активную тему приложения
**Root cause:** sonner.tsx делает `import { useTheme } from 'next-themes'`, а приложение использует кастомный ThemeProvider из `src/lib/theme.tsx`. Две независимые системы.
**Статус:** Не исправлен, работает де-факто
**Fix (при запросе):** Переписать sonner.tsx чтобы использовал useTheme из @/lib/theme

---

## BUG-003 — pt-safe/pb-safe не в tailwind.config
**Файл:** `tailwind.config.ts`
**Симптом:** На некоторых production build pt-safe/pb-safe могут purge-иться
**Root cause:** Классы определены в index.css через @layer utilities с env(safe-area-inset-*), но не в tailwind.config safelist. Tailwind может их удалить при build.
**Статус:** Требует проверки при production build
**Fix (при запросе):** Добавить в tailwind.config safelist: ['pt-safe', 'pb-safe']
