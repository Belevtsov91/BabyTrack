/**
 * ФАЙЛ: src/pages/media/PhotoDiary.tsx
 */

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Heart, Camera, ChevronRight, Grid, List,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { AppLayout } from "@/components/layout/AppLayout";
import { photosDB } from "@/lib/crud";
import type { PhotoRecord } from "@/lib/crud";
import { getBabyProfileState } from "@/lib/appStorage";

const hca = (c: string, a: number) => c.replace(/\)$/, ` / ${a})`);

interface Photo {
  id: string;
  emoji: string;
  bg: string;
  caption: string;
  ageMonths: number;
  date: string;
  folder: string;
  liked: boolean;
  size: "small" | "large";
}

interface PhotoFolder {
  id: string;
  emoji: string;
  label: string;
  color: string;
  count: number;
}

const PHOTO_SEED: Photo[] = [
  { id:"p1",  emoji:"😴", bg:"hsl(var(--sleep) / 0.18)", caption:"Сладкий сон",       ageMonths:1, date:"2024-10-15", folder:"sleep",      liked:true,  size:"large" },
  { id:"p2",  emoji:"😊", bg:"hsl(var(--feeding) / 0.15)", caption:"Первая улыбка!",     ageMonths:2, date:"2024-11-10", folder:"milestones", liked:true,  size:"small" },
  { id:"p3",  emoji:"🍼", bg:"hsl(var(--feeding) / 0.12)", caption:"Кушаем вместе",      ageMonths:2, date:"2024-11-20", folder:"feeding",    liked:false, size:"small" },
  { id:"p4",  emoji:"👨‍👩‍👧", bg:"hsl(var(--mood) / 0.15)", caption:"Воскресное утро",    ageMonths:3, date:"2024-12-05", folder:"family",     liked:true,  size:"large" },
  { id:"p5",  emoji:"🌳", bg:"hsl(var(--activity) / 0.15)", caption:"Первая прогулка",     ageMonths:3, date:"2024-12-12", folder:"walk",       liked:false, size:"small" },
  { id:"p6",  emoji:"🔄", bg:"hsl(var(--sleep) / 0.18)", caption:"Перевернулся!",       ageMonths:4, date:"2025-01-08", folder:"milestones", liked:true,  size:"small" },
  { id:"p7",  emoji:"🛁", bg:"hsl(var(--activity) / 0.15)", caption:"Купание",             ageMonths:4, date:"2025-01-22", folder:"family",     liked:false, size:"large" },
  { id:"p8",  emoji:"🥣", bg:"hsl(var(--feeding) / 0.12)", caption:"Первый прикорм",      ageMonths:6, date:"2025-03-15", folder:"milestones", liked:true,  size:"small" },
  { id:"p9",  emoji:"🪑", bg:"hsl(var(--diaper) / 0.15)",  caption:"Сидим сами!",         ageMonths:7, date:"2025-04-20", folder:"milestones", liked:true,  size:"large" },
  { id:"p10", emoji:"🌅", bg:"hsl(var(--diaper) / 0.10)",  caption:"Закат в парке",       ageMonths:8, date:"2025-05-10", folder:"walk",       liked:false, size:"small" },
  { id:"p11", emoji:"😂", bg:"hsl(var(--diaper) / 0.15)",  caption:"Смешная гримаса",     ageMonths:8, date:"2025-05-18", folder:"family",     liked:true,  size:"small" },
  { id:"p12", emoji:"🐛", bg:"hsl(var(--feeding) / 0.12)", caption:"Учимся ползать",      ageMonths:9, date:"2025-06-15", folder:"milestones", liked:true,  size:"large" },
];

const BASE_FOLDERS: Omit<PhotoFolder, "count">[] = [
  { id: "all",        emoji: "🌟", label: "Все",        color: "hsl(var(--diaper))" },
  { id: "milestones", emoji: "🏆", label: "Достижения", color: "hsl(var(--milestone))" },
  { id: "family",     emoji: "👨‍👩‍👧", label: "Семья",      color: "hsl(var(--mood))" },
  { id: "feeding",    emoji: "🍼", label: "Кормление",  color: "hsl(var(--feeding))" },
  { id: "sleep",      emoji: "🌙", label: "Сон",        color: "hsl(var(--sleep))" },
  { id: "walk",       emoji: "🚶", label: "Прогулки",   color: "hsl(var(--activity))" },
];

const HIGHLIGHTS = [
  { id:"h1", emoji:"🏆", label:"Достижения", color:"hsl(var(--milestone) / 0.45)", folder: "milestones" },
  { id:"h2", emoji:"❤️",  label:"Любимые",    color:"hsl(var(--health) / 0.30)", folder: "all" },
  { id:"h3", emoji:"🌆",  label:"Прогулки",   color:"hsl(var(--activity) / 0.25)", folder: "walk" },
  { id:"h4", emoji:"👨‍👩‍👧", label:"Семья",      color:"hsl(var(--mood) / 0.28)", folder: "family" },
  { id:"h5", emoji:"🍼",  label:"Кормление",  color:"hsl(var(--feeding) / 0.18)", folder: "feeding" },
];

const PHOTO_TAG_KEYS = {
  emoji: "emoji",
  bg: "bg",
  age: "age",
  folder: "folder",
  liked: "liked",
  size: "size",
} as const;

const FOLDER_THEMES: Record<string, { emoji: string; bg: string; size: Photo["size"] }> = {
  sleep: { emoji: "😴", bg: "hsl(var(--sleep) / 0.18)", size: "large" },
  milestones: { emoji: "🏆", bg: "hsl(var(--milestone) / 0.18)", size: "small" },
  family: { emoji: "👨‍👩‍👧", bg: "hsl(var(--mood) / 0.16)", size: "large" },
  feeding: { emoji: "🍼", bg: "hsl(var(--feeding) / 0.15)", size: "small" },
  walk: { emoji: "🌳", bg: "hsl(var(--activity) / 0.15)", size: "small" },
};

function getTag(tags: string[] | undefined, key: string): string | undefined {
  return tags?.find((tag) => tag.startsWith(`${key}=`))?.slice(key.length + 1);
}

function encodePhotoTags(photo: Omit<Photo, "id">): string[] {
  return [
    `${PHOTO_TAG_KEYS.emoji}=${photo.emoji}`,
    `${PHOTO_TAG_KEYS.bg}=${photo.bg}`,
    `${PHOTO_TAG_KEYS.age}=${photo.ageMonths}`,
    `${PHOTO_TAG_KEYS.folder}=${photo.folder}`,
    `${PHOTO_TAG_KEYS.liked}=${photo.liked ? 1 : 0}`,
    `${PHOTO_TAG_KEYS.size}=${photo.size}`,
  ];
}

function resolvePhotoFromRecord(record: PhotoRecord): Photo {
  const folder = getTag(record.tags, PHOTO_TAG_KEYS.folder) ?? "family";
  const theme = FOLDER_THEMES[folder] ?? FOLDER_THEMES.family;
  const ageMonths = Number(getTag(record.tags, PHOTO_TAG_KEYS.age) ?? "0") || 0;
  const liked = getTag(record.tags, PHOTO_TAG_KEYS.liked) === "1";
  const size = (getTag(record.tags, PHOTO_TAG_KEYS.size) as Photo["size"] | undefined) ?? theme.size;

  return {
    id: record.id,
    emoji: getTag(record.tags, PHOTO_TAG_KEYS.emoji) ?? theme.emoji,
    bg: getTag(record.tags, PHOTO_TAG_KEYS.bg) ?? theme.bg,
    caption: record.caption ?? "Воспоминание",
    ageMonths,
    date: record.timestamp.slice(0, 10),
    folder,
    liked,
    size,
  };
}

function createSeedRecord(photo: Photo) {
  return {
    url: `local-photo://${photo.id}`,
    caption: photo.caption,
    timestamp: `${photo.date}T12:00:00.000Z`,
    tags: encodePhotoTags(photo),
  };
}

function loadInitialPhotoRecords(): PhotoRecord[] {
  if (photosDB.count() === 0) {
    PHOTO_SEED.slice().reverse().forEach((photo) => {
      photosDB.create(createSeedRecord(photo));
    });
  }
  return photosDB.getAll();
}

function groupByAge(photos: Photo[]): Record<number, Photo[]> {
  return photos.reduce((acc, p) => {
    acc[p.ageMonths] = [...(acc[p.ageMonths] ?? []), p];
    return acc;
  }, {} as Record<number, Photo[]>);
}

function ageLabel(months: number): string {
  if (months === 0) return "Новорождённый";
  if (months < 12) return `${months} ${months === 1 ? "месяц" : months < 5 ? "месяца" : "месяцев"}`;
  const y = Math.floor(months / 12);
  const m = months % 12;
  return m > 0 ? `${y} ${y === 1 ? "год" : "года"} ${m} мес` : `${y} ${y === 1 ? "год" : "года"}`;
}

function calcAgeMonthsForToday(): number {
  const birthDate = getBabyProfileState().birthDate;
  const birth = new Date(birthDate);
  if (Number.isNaN(birth.getTime())) return 0;

  const now = new Date();
  let months = (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth());
  if (now.getDate() < birth.getDate()) months -= 1;
  return Math.max(0, months);
}

function HighlightReel({
  onCreate,
  onFocusFolder,
}: {
  onCreate: () => void;
  onFocusFolder: (folder: string) => void;
}) {
  return (
    <div className="flex gap-3 px-4 overflow-x-auto scrollbar-hide pb-1">
      <motion.button
        whileTap={{ scale: 0.9 }}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        onClick={onCreate}
        className="flex flex-col items-center gap-1.5 shrink-0"
      >
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center"
          style={{ background: "hsl(var(--muted))", border: "2px dashed hsl(var(--border))" }}
        >
          <Plus className="w-6 h-6 text-muted-foreground" />
        </div>
        <span className="text-[10px] text-muted-foreground">Новое</span>
      </motion.button>

      {HIGHLIGHTS.map((h, i) => (
        <motion.button
          key={h.id}
          whileTap={{ scale: 0.9 }}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: i * 0.06 }}
          onClick={() => onFocusFolder(h.folder)}
          className="flex flex-col items-center gap-1.5 shrink-0"
        >
          <motion.div
            className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl relative"
            style={{ background: h.color, boxShadow: `0 4px 16px ${hca(h.color, 0.38)}` }}
            animate={{ boxShadow: [`0 4px 16px ${hca(h.color, 0.25)}`, `0 4px 24px ${hca(h.color, 0.44)}`, `0 4px 16px ${hca(h.color, 0.25)}`] }}
            transition={{ duration: 3, repeat: Infinity, delay: i * 0.5 }}
          >
            {h.emoji}
          </motion.div>
          <span className="text-[10px] text-muted-foreground whitespace-nowrap">{h.label}</span>
        </motion.button>
      ))}
    </div>
  );
}

function FolderWheel({
  active,
  onChange,
  folders,
}: {
  active: string;
  onChange: (id: string) => void;
  folders: PhotoFolder[];
}) {
  return (
    <div className="flex gap-2 px-4 overflow-x-auto scrollbar-hide pb-1">
      {folders.map((f, i) => (
        <motion.button
          key={f.id}
          onClick={() => onChange(f.id)}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05 }}
          whileTap={{ scale: 0.9 }}
          className="flex items-center gap-2 px-3 py-2 rounded-2xl shrink-0 transition-all"
          style={active === f.id
            ? { background: hca(f.color, 0.15), border: `1.5px solid ${f.color}`, boxShadow: `0 0 12px ${hca(f.color, 0.15)}` }
            : { background: "hsl(var(--card))", border: "1.5px solid transparent" }
          }
        >
          <span className="text-base">{f.emoji}</span>
          <span className="text-xs font-semibold whitespace-nowrap"
            style={{ color: active === f.id ? f.color : "hsl(var(--muted-foreground))" }}>
            {f.label}
          </span>
          <span
            className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
            style={{
              background: active === f.id ? hca(f.color, 0.19) : "hsl(var(--border))",
              color: active === f.id ? f.color : "hsl(var(--muted-foreground))",
            }}
          >
            {f.count}
          </span>
        </motion.button>
      ))}
    </div>
  );
}

function PhotoCard({
  photo,
  index,
  onLike,
}: {
  photo: Photo;
  index: number;
  onLike: (id: string) => void;
}) {
  const isLarge = photo.size === "large";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{ delay: index * 0.04, type: "spring", stiffness: 200 }}
      className={cn("relative rounded-3xl overflow-hidden cursor-pointer", isLarge ? "col-span-2" : "col-span-1")}
      style={{ aspectRatio: isLarge ? "2/1" : "1/1" }}
      whileTap={{ scale: 0.96 }}
    >
      <div className="absolute inset-0" style={{ background: photo.bg }} />

      <div className="absolute inset-0 flex items-center justify-center">
        <span className={cn("select-none", isLarge ? "text-6xl" : "text-4xl")}>
          {photo.emoji}
        </span>
      </div>

      <div
        className="absolute inset-x-0 bottom-0 h-2/3"
        style={{ background: "linear-gradient(to top, rgba(0,0,0,0.7), transparent)" }}
      />

      <div className="absolute bottom-0 inset-x-0 p-3">
        <p className="text-xs font-semibold text-white leading-tight">{photo.caption}</p>
        <p className="text-[9px] text-white/50 mt-0.5">{ageLabel(photo.ageMonths)}</p>
      </div>

      <motion.button
        className="absolute top-2.5 right-2.5 w-8 h-8 rounded-xl flex items-center justify-center"
        style={{ background: "rgba(0,0,0,0.35)", backdropFilter: "blur(8px)" }}
        onClick={(e) => {
          e.stopPropagation();
          onLike(photo.id);
        }}
        whileTap={{ scale: 0.8 }}
      >
        <motion.div
          animate={photo.liked ? { scale: [1, 1.4, 1] } : {}}
          transition={{ duration: 0.3 }}
        >
          <Heart
            className="w-4 h-4"
            style={{ color: photo.liked ? "hsl(var(--health))" : "white", fill: photo.liked ? "hsl(var(--health))" : "none" }}
          />
        </motion.div>
      </motion.button>
    </motion.div>
  );
}

function AgeSection({
  ageMonths,
  photos,
  onLike,
}: {
  ageMonths: number;
  photos: Photo[];
  onLike: (id: string) => void;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const color = `hsl(${(ageMonths * 25) % 360},45%,55%)`;

  return (
    <motion.div layout className="flex flex-col gap-3">
      <motion.button
        onClick={() => setCollapsed((v) => !v)}
        className="flex items-center gap-3 px-4"
        whileTap={{ scale: 0.97 }}
      >
        <div
          className="w-9 h-9 rounded-2xl flex items-center justify-center text-base shrink-0"
          style={{ background: hca(color, 0.12), border: `1px solid ${hca(color, 0.25)}` }}
        >
          🎂
        </div>
        <div className="flex-1 text-left">
          <p className="text-sm font-bold text-foreground">{ageLabel(ageMonths)}</p>
          <p className="text-[10px] text-muted-foreground">{photos.length} фото</p>
        </div>
        <motion.div animate={{ rotate: collapsed ? -90 : 0 }}>
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        </motion.div>
      </motion.button>

      <AnimatePresence>
        {!collapsed && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="grid grid-cols-2 gap-2 px-4">
              {photos.map((p, i) => (
                <PhotoCard key={p.id} photo={p} index={i} onLike={onLike} />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function MemoryAlert({
  onOpen,
  memoryCount,
}: {
  onOpen: () => void;
  memoryCount: number;
}) {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="mx-4 md:mx-6 rounded-3xl p-4 flex items-center gap-3 relative overflow-hidden"
      style={{
        background: "linear-gradient(135deg, hsl(var(--milestone) / 0.15), hsl(var(--sleep) / 0.12))",
        border: "1px solid hsl(var(--milestone) / 0.25)",
      }}
    >
      <div className="absolute -right-4 -top-4 w-20 h-20 rounded-full opacity-10"
        style={{ background: "hsl(var(--milestone))" }} />

      <span className="text-3xl shrink-0">✨</span>
      <div className="flex-1">
        <p className="text-sm font-bold text-white">В этот день год назад</p>
        <p className="text-xs text-white/60 mt-0.5">
          У вас есть {memoryCount} воспоминаний
        </p>
      </div>
      <div className="flex items-center gap-2">
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={onOpen}
          className="px-3 py-1.5 rounded-xl text-xs font-bold text-white"
          style={{ background: "hsl(var(--milestone))" }}
        >
          Смотреть
        </motion.button>
        <button onClick={() => setDismissed(true)} className="text-white/40 text-lg">×</button>
      </div>
    </motion.div>
  );
}

export default function PhotoDiary() {
  const [folder, setFolder] = useState("all");
  const [view, setView] = useState<"masonry" | "timeline">("masonry");
  const [records, setRecords] = useState<PhotoRecord[]>(loadInitialPhotoRecords);

  useEffect(() => {
    const sync = () => setRecords(photosDB.getAll());
    window.addEventListener("storage", sync);
    window.addEventListener("focus", sync);
    document.addEventListener("visibilitychange", sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener("focus", sync);
      document.removeEventListener("visibilitychange", sync);
    };
  }, []);

  const photos = useMemo(() => records.map(resolvePhotoFromRecord), [records]);
  const folders = useMemo<PhotoFolder[]>(() => BASE_FOLDERS.map((folderItem) => ({
    ...folderItem,
    count: folderItem.id === "all"
      ? photos.length
      : photos.filter((photo) => photo.folder === folderItem.id).length,
  })), [photos]);

  const filtered = useMemo(
    () => (folder === "all" ? photos : photos.filter((photo) => photo.folder === folder)),
    [folder, photos],
  );
  const grouped = useMemo(() => groupByAge(filtered), [filtered]);
  const sortedAges = useMemo(() => Object.keys(grouped).map(Number).sort((a, b) => b - a), [grouped]);
  const likedCount = photos.filter((photo) => photo.liked).length;

  const handleLike = (id: string) => {
    const current = records.find((record) => record.id === id);
    if (!current) return;
    const next = resolvePhotoFromRecord(current);
    photosDB.update(id, {
      tags: encodePhotoTags({ ...next, liked: !next.liked }),
    });
    setRecords(photosDB.getAll());
  };

  const handleCreatePhoto = () => {
    const folderId = folder === "all" ? "family" : folder;
    const theme = FOLDER_THEMES[folderId] ?? FOLDER_THEMES.family;
    const caption = `${theme.emoji} Новая память · ${new Date().toLocaleDateString("ru-RU", {
      day: "numeric",
      month: "short",
    })}`;
    const newPhoto: Photo = {
      id: `local-${Date.now()}`,
      emoji: theme.emoji,
      bg: theme.bg,
      caption,
      ageMonths: calcAgeMonthsForToday(),
      date: new Date().toISOString().slice(0, 10),
      folder: folderId,
      liked: false,
      size: theme.size,
    };

    photosDB.create(createSeedRecord(newPhoto));
    setRecords(photosDB.getAll());
    setFolder(folderId);
    setView("masonry");
  };

  const handleOpenMemory = () => {
    setFolder("all");
    setView("timeline");
  };

  return (
    <AppLayout>
      <div className="flex flex-col gap-4 pt-safe pb-10">

        <motion.header
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          className="px-4 md:px-6 pt-4 flex items-center justify-between"
        >
          <div>
            <h1 className="text-2xl font-bold text-foreground">Фотодневник</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {photos.length} фото · {likedCount} ❤️
            </p>
          </div>
          <div className="flex gap-2">
            <motion.button
              whileTap={{ scale: 0.88 }}
              onClick={() => setView((v) => (v === "masonry" ? "timeline" : "masonry"))}
              className="w-10 h-10 rounded-2xl flex items-center justify-center"
              style={{ background: "hsl(var(--muted))" }}
            >
              {view === "masonry"
                ? <List className="w-4 h-4 text-muted-foreground" />
                : <Grid className="w-4 h-4 text-muted-foreground" />
              }
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.88 }}
              onClick={handleCreatePhoto}
              className="w-10 h-10 rounded-2xl flex items-center justify-center"
              style={{ background: "hsl(var(--milestone) / 0.18)" }}
            >
              <Camera className="w-4 h-4 text-purple-400" />
            </motion.button>
          </div>
        </motion.header>

        <MemoryAlert onOpen={handleOpenMemory} memoryCount={photos.length} />

        <div>
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest px-4 mb-2">
            ✨ Подборки
          </p>
          <HighlightReel onCreate={handleCreatePhoto} onFocusFolder={setFolder} />
        </div>

        <div>
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest px-4 mb-2">
            📁 Папки
          </p>
          <FolderWheel active={folder} onChange={setFolder} folders={folders} />
        </div>

        <AnimatePresence mode="wait">
          {view === "masonry" ? (
            <motion.div
              key="masonry"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="px-4 md:px-6"
            >
              <div className="grid grid-cols-2 gap-2">
                <AnimatePresence>
                  {filtered.map((photo, index) => (
                    <PhotoCard key={photo.id} photo={photo} index={index} onLike={handleLike} />
                  ))}
                </AnimatePresence>
              </div>
              {filtered.length === 0 && (
                <div className="text-center py-16">
                  <span className="text-5xl">📷</span>
                  <p className="text-muted-foreground mt-3 text-sm">Нет фото в этой папке</p>
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="timeline"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col gap-6"
            >
              {sortedAges.map((age) => (
                <AgeSection
                  key={age}
                  ageMonths={age}
                  photos={grouped[age]}
                  onLike={handleLike}
                />
              ))}
              {sortedAges.length === 0 && (
                <div className="text-center py-16 px-4">
                  <span className="text-5xl">📷</span>
                  <p className="text-muted-foreground mt-3 text-sm">Нет фото</p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </AppLayout>
  );
}
