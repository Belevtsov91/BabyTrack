# Patterns

Переиспользуемые паттерны этого проекта.

---

## Страница с AppLayout + framer-motion
```tsx
export default function MyPage() {
  return (
    <AppLayout>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="px-4 pt-6 space-y-4"
      >
        {/* content */}
      </motion.div>
    </AppLayout>
  );
}
```

## Чтение данных из DB
```tsx
const [items, setItems] = useState([]);
useEffect(() => {
  setItems(eventsDB.getAll());
}, []);
```

## Карточка события (glass-card)
```tsx
<div className="glass-card rounded-3xl p-4">
  <div className="flex items-center gap-3">
    <div className="w-10 h-10 rounded-2xl" style={{ background: 'hsl(var(--sleep))' }}>
      <Moon className="w-5 h-5" />
    </div>
    <div>
      <p className="font-semibold">{t('sleep')}</p>
      <p className="text-sm text-muted-foreground">2ч 30м</p>
    </div>
  </div>
</div>
```

## Цвета категорий через CSS vars
```tsx
// Правильно:
style={{ background: 'hsl(var(--feeding))' }}
className="text-[hsl(var(--sleep))]"

// Неправильно:
className="bg-blue-500"  // хардкод
```

## Навигация на EventDetail
```tsx
navigate('/add/sleep');    // → EventDetail с eventType="sleep"
navigate('/add/feeding');  // → EventDetail с eventType="feeding"
navigate('/add');          // → AddEvent (список)
```

## Перевод через useI18n
```tsx
const { t } = useI18n();
return <p>{t('sleep')}</p>;
// НЕ: return <p>Сон</p>;
```

## Сохранение события в DB
```tsx
eventsDB.create({
  id: Date.now().toString(),
  type: 'sleep',
  startTime: new Date().toISOString(),
  endTime: new Date().toISOString(),
  notes: '',
});
```
