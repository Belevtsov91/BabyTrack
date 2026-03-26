import { useState } from "react";
import { Moon, Baby, Droplets, Milk, Heart, Trophy, Stethoscope, Camera } from "lucide-react";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { eventsDB } from "@/lib/crud";
import { toast } from "@/hooks/use-toast";
import { useI18n } from "@/lib/i18n";
import { LiquidSurface, type LiquidTone } from "@/components/ui/liquid-radio";

interface QuickAction {
  id: string;
  icon: React.ReactNode;
  labelKey: string;
  category: 'sleep' | 'feeding' | 'diaper' | 'activity' | 'health' | 'mood' | 'milestone';
  path?: string;
  hasModal?: boolean;
}

const actions: QuickAction[] = [
  { id: 'sleep', icon: <Moon className="w-6 h-6" />, labelKey: 'sleep', category: 'sleep', hasModal: true },
  { id: 'bottle', icon: <Baby className="w-6 h-6" />, labelKey: 'bottle', category: 'feeding', hasModal: true },
  { id: 'breast', icon: <Heart className="w-6 h-6" />, labelKey: 'breast', category: 'feeding', hasModal: true },
  { id: 'diaper', icon: <Droplets className="w-6 h-6" />, labelKey: 'diaper', category: 'diaper', hasModal: true },
  { id: 'pump', icon: <Milk className="w-6 h-6" />, labelKey: 'pump', category: 'feeding', hasModal: true },
  { id: 'milestones', icon: <Trophy className="w-6 h-6" />, labelKey: 'milestones', category: 'milestone', path: '/milestones' },
  { id: 'doctor', icon: <Stethoscope className="w-6 h-6" />, labelKey: 'doctor', category: 'health', path: '/doctor' },
  { id: 'photos', icon: <Camera className="w-6 h-6" />, labelKey: 'photos', category: 'mood', path: '/photos' },
];

const categoryTones: Record<QuickAction["category"], LiquidTone> = {
  sleep: "sleep",
  feeding: "feeding",
  diaper: "diaper",
  activity: "activity",
  health: "health",
  mood: "mood",
  milestone: "milestone",
};

const categoryClasses: Record<QuickAction["category"], string> = {
  sleep: "activity-btn-sleep",
  feeding: "activity-btn-feeding",
  diaper: "activity-btn-diaper",
  activity: "activity-btn-activity",
  health: "activity-btn-health",
  mood: "activity-btn-mood",
  milestone: "activity-btn-milestone",
};

interface ModalField {
  key: string;
  label: string;
  type: 'number' | 'text' | 'select';
  placeholder?: string;
  options?: { value: string; label: string }[];
  suffix?: string;
}

const modalConfigs: Record<string, { title: string; emoji: string; fields: ModalField[] }> = {
  sleep: {
    title: 'Записать сон',
    emoji: '🌙',
    fields: [
      { key: 'duration', label: 'Длительность (мин)', type: 'number', placeholder: '90' },
      { key: 'quality', label: 'Качество', type: 'select', options: [
        { value: 'deep', label: '😴 Крепкий' },
        { value: 'light', label: '💤 Лёгкий' },
        { value: 'restless', label: '😣 Беспокойный' },
      ]},
      { key: 'notes', label: 'Заметка', type: 'text', placeholder: 'Примечания...' },
    ],
  },
  bottle: {
    title: 'Записать кормление',
    emoji: '🍼',
    fields: [
      { key: 'amount', label: 'Количество (мл)', type: 'number', placeholder: '120' },
      { key: 'notes', label: 'Заметка', type: 'text', placeholder: 'Тип смеси...' },
    ],
  },
  breast: {
    title: 'Грудное кормление',
    emoji: '🤱',
    fields: [
      { key: 'duration', label: 'Длительность (мин)', type: 'number', placeholder: '15' },
      { key: 'side', label: 'Сторона', type: 'select', options: [
        { value: 'left', label: 'Левая' },
        { value: 'right', label: 'Правая' },
        { value: 'both', label: 'Обе' },
      ]},
    ],
  },
  diaper: {
    title: 'Записать подгузник',
    emoji: '👶',
    fields: [
      { key: 'type', label: 'Тип', type: 'select', options: [
        { value: 'wet', label: '💧 Мокрый' },
        { value: 'dirty', label: '💩 Грязный' },
        { value: 'mixed', label: '🔄 Смешанный' },
        { value: 'dry', label: '✨ Сухой' },
      ]},
      { key: 'notes', label: 'Заметка', type: 'text', placeholder: 'Примечания...' },
    ],
  },
  pump: {
    title: 'Записать сцеживание',
    emoji: '🥛',
    fields: [
      { key: 'amount', label: 'Количество (мл)', type: 'number', placeholder: '80' },
      { key: 'duration', label: 'Длительность (мин)', type: 'number', placeholder: '15' },
      { key: 'side', label: 'Сторона', type: 'select', options: [
        { value: 'left', label: 'Левая' },
        { value: 'right', label: 'Правая' },
        { value: 'both', label: 'Обе' },
      ]},
    ],
  },
};

export function QuickActions() {
  const navigate = useNavigate();
  const { t } = useI18n();
  const [modalAction, setModalAction] = useState<string | null>(null);
  const [formData, setFormData] = useState<Record<string, string>>({});

  const handleClick = (action: QuickAction) => {
    if (action.path) {
      navigate(action.path);
    } else if (action.hasModal) {
      setModalAction(action.id);
      setFormData({});
    }
  };

  const handleSave = () => {
    if (!modalAction) return;
    const config = modalConfigs[modalAction];
    const actionDef = actions.find(a => a.id === modalAction)!;

    const eventType = actionDef.category === 'diaper' ? 'diaper' :
                      actionDef.category === 'sleep' ? 'sleep' : 'feeding';

    const amountValue = formData.amount ? parseFloat(formData.amount) : undefined;
    const durationValue = formData.duration ? parseInt(formData.duration, 10) : undefined;
    const titleMap: Record<string, string> = {
      sleep: 'Сон',
      bottle: 'Бутылочка',
      breast: 'Грудное кормление',
      diaper: 'Подгузник',
      pump: 'Сцеживание',
    };
    const data: Record<string, string | number | undefined> = {
      eventSubType: modalAction,
      notes: formData.notes,
    };

    if (typeof durationValue === "number" && Number.isFinite(durationValue)) {
      data.duration = durationValue;
    }
    if (typeof amountValue === "number" && Number.isFinite(amountValue)) {
      data.amount = amountValue;
      data.unit = 'мл';
    }
    if (modalAction === 'diaper') {
      data.diaperType = formData.type;
    }
    if (modalAction === 'breast' || modalAction === 'pump') {
      data.side = formData.side;
    }
    if (modalAction === 'sleep') {
      data.quality = formData.quality;
    }

    eventsDB.create({
      type: eventType,
      title: titleMap[modalAction] ?? config.title,
      timestamp: new Date().toISOString(),
      duration: typeof durationValue === "number" && Number.isFinite(durationValue) ? durationValue : undefined,
      description: formData.notes?.trim() || undefined,
      data,
    });

    toast({ title: "✅ Записано", description: config.title });
    setModalAction(null);
    setFormData({});
  };

  const config = modalAction ? modalConfigs[modalAction] : null;

  return (
    <div className="px-4">
      <h2 className="text-sm font-medium text-muted-foreground mb-3 uppercase tracking-wide">
        {t('quickActions')}
      </h2>
      <div className="grid grid-cols-4 gap-3">
        {actions.map((action, index) => (
          <motion.button
            key={action.id}
            onClick={() => handleClick(action)}
            whileTap={{ scale: 0.94 }}
            whileHover={{ y: -2 }}
            className="w-full text-left animate-fade-in"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <LiquidSurface
              tone={categoryTones[action.category]}
              className="rounded-2xl"
              ambientDelay={index * 0.6}
              contentClassName={cn(
                "activity-btn min-h-[5.75rem]",
                categoryClasses[action.category],
              )}
            >
              {action.icon}
              <span className="text-[10px] font-medium leading-tight">{t(action.labelKey)}</span>
            </LiquidSurface>
          </motion.button>
        ))}
      </div>

      {/* Quick Add Modal */}
      <AnimatePresence>
        {modalAction && config && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end justify-center"
            onClick={() => setModalAction(null)}
          >
            <motion.div
              initial={{ y: 300 }}
              animate={{ y: 0 }}
              exit={{ y: 300 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="w-full max-w-md bg-card rounded-t-3xl p-6 pb-10"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-10 h-1 bg-muted rounded-full mx-auto mb-4" />
              <div className="flex items-center gap-3 mb-6">
                <span className="text-3xl">{config.emoji}</span>
                <h3 className="text-lg font-semibold text-foreground">{config.title}</h3>
              </div>

              <div className="space-y-4">
                {config.fields.map((field) => (
                  <div key={field.key}>
                    <label className="text-sm text-muted-foreground mb-1.5 block">{field.label}</label>
                    {field.type === 'select' ? (
                      <div className="flex flex-wrap gap-2">
                        {field.options?.map((opt) => (
                          <button
                            key={opt.value}
                            onClick={() => setFormData(prev => ({ ...prev, [field.key]: opt.value }))}
                            className={cn(
                              "px-4 py-2.5 rounded-xl text-sm font-medium transition-all",
                              formData[field.key] === opt.value
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted text-muted-foreground"
                            )}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <input
                        type={field.type}
                        placeholder={field.placeholder}
                        value={formData[field.key] || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, [field.key]: e.target.value }))}
                        className="w-full bg-muted rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                      />
                    )}
                  </div>
                ))}
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setModalAction(null)}
                  className="flex-1 py-3 rounded-xl bg-muted text-muted-foreground font-medium text-sm"
                >
                  {t('cancel')}
                </button>
                <button
                  onClick={handleSave}
                  className="flex-1 py-3 rounded-xl bg-primary text-primary-foreground font-medium text-sm"
                >
                  {t('save')}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
