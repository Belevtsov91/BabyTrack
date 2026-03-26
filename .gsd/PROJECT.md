# Project

## Name
BabyTracker

## Purpose
Mobile-first PWA для отслеживания активностей новорождённого/младенца.
Фиксация: кормление, сон, подгузники, рост, здоровье, настроение, прививки, лекарства, аллергены, фото.
Целевая аудитория — родители, одна семья, данные локально на устройстве.

## Live
localhost:8080 (dev only, нет деплоя)

## Stack
- React 18.3.1 + TypeScript
- Vite 5.4 + SWC
- framer-motion 12.34 — анимации везде
- lucide-react 0.462 — иконки
- recharts 2.15 — графики
- react-router-dom 6.30 — роутинг
- @tanstack/react-query 5.83 — сконфигурирован, слабо используется
- Tailwind CSS 3.4 + tailwindcss-animate
- shadcn/ui (полный Radix UI набор)
- jspdf 4.2 — экспорт PDF
- date-fns 3.6
- zod + react-hook-form
- sonner + @radix-ui/react-toast (две toast-системы)
- vaul — bottom sheets
- bun (package manager)

## Current status
Active — идёт интеграция пакета редизайна (23 новых страницы из babytrack_redesign_FULL.zip).
Данные: localStorage, нет бэкенда, нет авторизации на сервере.
