import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Star, Check, ChevronRight,
  Calendar, X, Stethoscope,
} from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import CountdownBanner from "@/components/ui/the-future-arrives-soon-cta";
import { toast } from "@/hooks/use-toast";
import { eventsDB } from "@/lib/crud";

const hca = (c: string, a: number) => c.replace(/\)$/, ` / ${a})`);
const VISIT_STORAGE_KEY = "babytrack_doctor_visits";

interface Doctor {
  id: string;
  name: string;
  spec: string;
  emoji: string;
  color: string;
  rating: number;
  clinic: string;
}

interface Visit {
  id: string;
  doctorId: string;
  date: string;
  reason: string;
  conclusion: string;
  recommendations: string[];
  nextDate?: string;
}

const DOCTORS: Doctor[] = [
  { id: "d1", name: "Иванова О.В.", spec: "Педиатр", emoji: "👩‍⚕️", color: "hsl(var(--feeding))", rating: 5, clinic: "Дет. поликлиника №5" },
  { id: "d2", name: "Петров А.И.", spec: "Невролог", emoji: "👨‍⚕️", color: "hsl(var(--activity))", rating: 4.8, clinic: "Медцентр Здоровье" },
  { id: "d3", name: "Смирнова Н.К.", spec: "Офтальмолог", emoji: "👩‍⚕️", color: "hsl(var(--sleep))", rating: 4.7, clinic: "Дет. поликлиника №5" },
  { id: "d4", name: "Козлов В.М.", spec: "Хирург", emoji: "👨‍⚕️", color: "hsl(var(--health))", rating: 4.9, clinic: "ДГКБ №9" },
];

const VISITS: Visit[] = [
  {
    id: "v1",
    doctorId: "d1",
    date: "2025-06-10",
    reason: "Плановый осмотр 9 месяцев",
    conclusion: "Развитие соответствует возрасту. Вес 9.3 кг, рост 71.5 см.",
    recommendations: ["Продолжить прикорм", "Витамин D3 ежедневно", "Гимнастика"],
    nextDate: "2025-09-10",
  },
  {
    id: "v2",
    doctorId: "d2",
    date: "2025-05-20",
    reason: "Наблюдение нервной системы",
    conclusion: "Нервно-психическое развитие в норме. Рефлексы хорошие.",
    recommendations: ["Массаж курс 10 сеансов", "Плавание"],
  },
  {
    id: "v3",
    doctorId: "d1",
    date: "2025-03-15",
    reason: "Плановый осмотр 6 месяцев + вакцинация",
    conclusion: "Здоров. АКДС 3 доза введена без реакций.",
    recommendations: ["Начать прикорм", "Режим дня"],
    nextDate: "2025-06-10",
  },
  {
    id: "v4",
    doctorId: "d3",
    date: "2025-02-10",
    reason: "Осмотр зрения",
    conclusion: "Зрение в норме, патологий нет.",
    recommendations: ["Ограничить экраны", "Следующий осмотр в 1 год"],
  },
];

function parseStoredVisits(): Visit[] {
  try {
    return JSON.parse(localStorage.getItem(VISIT_STORAGE_KEY) || "[]") as Visit[];
  } catch {
    return [];
  }
}

function saveVisits(visits: Visit[]) {
  localStorage.setItem(VISIT_STORAGE_KEY, JSON.stringify(visits));
}

function doctorKey(value: string) {
  return value.toLowerCase().replace(/[^a-zа-я0-9]+/gi, "");
}

function resolveDoctorId(doctorName?: string, specialty?: string) {
  const byName = DOCTORS.find((doctor) => doctorKey(doctor.name).includes(doctorKey(doctorName ?? "")));
  if (byName) return byName.id;
  const bySpec = DOCTORS.find((doctor) => doctorKey(doctor.spec).includes(doctorKey(specialty ?? "")));
  return bySpec?.id ?? DOCTORS[0].id;
}

function doctorFromVisit(visit: Visit) {
  return DOCTORS.find((doctor) => doctor.id === visit.doctorId);
}

function syncVisitsFromEvents(base: Visit[]) {
  const result = [...base];
  const seen = new Set(result.map((visit) => `${visit.date}|${visit.doctorId}|${visit.reason}`));

  eventsDB
    .getAll()
    .filter((event) => event.data?.eventSubType === "doctor" || event.data?.doctorName || event.data?.specialty)
    .forEach((event) => {
      const next: Visit = {
        id: event.id,
        doctorId: resolveDoctorId(event.data?.doctorName, event.data?.specialty),
        date: event.timestamp.slice(0, 10),
        reason: event.description ?? event.title ?? "Визит к врачу",
        conclusion: event.description ?? "Запись из журнала",
        recommendations: [],
      };

      const key = `${next.date}|${next.doctorId}|${next.reason}`;
      if (seen.has(key)) return;
      seen.add(key);
      result.unshift(next);
    });

  return result.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

function loadVisits() {
  const stored = parseStoredVisits();
  const base = stored.length > 0 ? stored : VISITS;
  const merged = syncVisitsFromEvents(base);
  saveVisits(merged);
  return merged;
}

function DoctorCard({
  doctor,
  visitCount,
  onSelect,
  isSelected,
}: {
  doctor: Doctor;
  visitCount: number;
  onSelect: () => void;
  isSelected: boolean;
}) {
  return (
    <motion.button
      onClick={onSelect}
      whileTap={{ scale: 0.94 }}
      className="flex flex-col items-center gap-2 p-3 rounded-2xl shrink-0 transition-all"
      style={isSelected
        ? { background: `${hca(doctor.color, 0.13)}`, border: `1.5px solid ${doctor.color}` }
        : { background: "hsl(var(--card))", border: "1.5px solid transparent" }
      }
    >
      <div
        className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl relative"
        style={{ background: `${hca(doctor.color, 0.12)}` }}
      >
        {doctor.emoji}
        {isSelected && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full flex items-center justify-center"
            style={{ background: doctor.color }}
          >
            <Check className="w-3 h-3 text-white" />
          </motion.div>
        )}
      </div>
      <div className="text-center">
        <p className="text-[10px] font-bold text-foreground whitespace-nowrap">{doctor.name.split(" ")[0]}</p>
        <p className="text-[9px] text-muted-foreground">{doctor.spec}</p>
        <div className="flex items-center justify-center gap-0.5 mt-0.5">
          <Star className="w-2.5 h-2.5 text-yellow-400 fill-yellow-400" />
          <span className="text-[9px] text-yellow-400">{doctor.rating}</span>
        </div>
        <span
          className="text-[9px] px-1.5 py-0.5 rounded-full mt-0.5 inline-block"
          style={{ background: `${hca(doctor.color, 0.12)}`, color: doctor.color }}
        >
          {visitCount} визит{visitCount === 1 ? "" : visitCount < 5 ? "а" : "ов"}
        </span>
      </div>
    </motion.button>
  );
}

function VisitCard({ visit, doctor }: { visit: Visit; doctor?: Doctor }) {
  const [open, setOpen] = useState(false);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex gap-3"
    >
      <div className="flex flex-col items-center w-5 shrink-0">
        <div
          className="w-5 h-5 rounded-full shrink-0 flex items-center justify-center"
          style={{ background: doctor?.color ?? "hsl(var(--sleep))" }}
        >
          <Stethoscope className="w-3 h-3 text-white" />
        </div>
        <div className="flex-1 w-0.5 mt-1" style={{ background: "hsl(var(--border))" }} />
      </div>

      <div className="flex-1 pb-4 min-w-0">
        <motion.button
          onClick={() => setOpen((v) => !v)}
          className="w-full rounded-2xl p-4 text-left"
          style={{
            background: `${hca(doctor?.color ?? "hsl(var(--sleep))", 0.06)}`,
            border: `1px solid ${hca(doctor?.color ?? "hsl(var(--sleep))", 0.15)}`,
          }}
          whileTap={{ scale: 0.98 }}
        >
          <div className="flex items-start gap-2">
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground">
                {new Date(visit.date).toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" })}
              </p>
              <p className="text-sm font-bold text-foreground mt-0.5">{visit.reason}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{doctor?.name} · {doctor?.spec}</p>
            </div>
            <motion.div animate={{ rotate: open ? 90 : 0 }}>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </motion.div>
          </div>
        </motion.button>

        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden mt-2 flex flex-col gap-2"
            >
              <div className="p-3 rounded-2xl" style={{ background: "hsl(var(--muted))" }}>
                <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1">Заключение</p>
                <p className="text-xs text-foreground leading-relaxed">{visit.conclusion}</p>
              </div>

              {visit.recommendations.length > 0 && (
                <div className="flex flex-col gap-1.5">
                  {visit.recommendations.map((r, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <div
                        className="w-4 h-4 rounded-full flex items-center justify-center shrink-0"
                        style={{ background: `${hca(doctor?.color ?? "hsl(var(--sleep))", 0.19)}` }}
                      >
                        <Check className="w-2.5 h-2.5" style={{ color: doctor?.color }} />
                      </div>
                      <span className="text-xs text-foreground/80">{r}</span>
                    </div>
                  ))}
                </div>
              )}

              {visit.nextDate && (
                <div
                  className="flex items-center gap-2 p-3 rounded-2xl"
                  style={{ background: `${hca(doctor?.color ?? "hsl(var(--sleep))", 0.08)}` }}
                >
                  <Calendar className="w-4 h-4" style={{ color: doctor?.color }} />
                  <p className="text-xs font-semibold" style={{ color: doctor?.color }}>
                    Следующий визит: {new Date(visit.nextDate).toLocaleDateString("ru-RU", { day: "numeric", month: "long" })}
                  </p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

function AddVisitSheet({
  onClose,
  onSave,
}: {
  onClose: () => void;
  onSave: (visit: Visit) => void;
}) {
  const [doctor, setDoctor] = useState(DOCTORS[0].id);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [reason, setReason] = useState("");
  const [conclusion, setConclusion] = useState("");

  const handleSave = () => {
    if (!reason.trim()) return;
    onSave({
      id: `visit-${Date.now()}`,
      doctorId: doctor,
      date,
      reason: reason.trim(),
      conclusion: conclusion.trim() || "Осмотр завершён",
      recommendations: [],
    });
    toast({ title: "Визит сохранён" });
    onClose();
  };

  return (
    <motion.div
      initial={{ y: "100%" }}
      animate={{ y: 0 }}
      exit={{ y: "100%" }}
      transition={{ type: "spring", stiffness: 300, damping: 32 }}
      className="fixed inset-x-0 bottom-0 z-40 max-w-md mx-auto rounded-t-3xl overflow-hidden"
      style={{ background: "hsl(var(--background))", border: "1px solid hsl(var(--border))" }}
    >
      <div className="flex justify-center pt-3 pb-1">
        <div className="w-10 h-1 rounded-full bg-white/20" />
      </div>
      <div className="px-5 pb-10 flex flex-col gap-4 max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold">Новый визит</h3>
          <button onClick={onClose}><X className="w-5 h-5 text-muted-foreground" /></button>
        </div>

        <div>
          <p className="text-xs text-muted-foreground mb-2">Врач</p>
          <div className="flex gap-2 overflow-x-auto scrollbar-hide">
            {DOCTORS.map((d) => (
              <button
                key={d.id}
                onClick={() => setDoctor(d.id)}
                className="flex items-center gap-2 px-3 py-2 rounded-2xl shrink-0 transition-all"
                style={doctor === d.id
                  ? { background: `${hca(d.color, 0.15)}`, border: `1.5px solid ${d.color}`, color: d.color }
                  : { background: "hsl(var(--muted))", border: "1.5px solid transparent", color: "hsl(var(--muted-foreground))" }
                }
              >
                <span className="text-lg">{d.emoji}</span>
                <span className="text-xs font-semibold">{d.name.split(" ")[0]}</span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="text-xs text-muted-foreground mb-1">Дата</p>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full h-12 px-4 rounded-2xl bg-muted text-foreground text-sm focus:outline-none"
            style={{ border: "1px solid hsl(var(--border))" }}
          />
        </div>

        <input
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Причина визита"
          className="w-full h-12 px-4 rounded-2xl bg-muted text-foreground text-sm focus:outline-none"
          style={{ border: "1px solid hsl(var(--border))" }}
        />

        <textarea
          value={conclusion}
          onChange={(e) => setConclusion(e.target.value)}
          placeholder="Заключение врача"
          rows={3}
          className="w-full px-4 py-3 rounded-2xl bg-muted text-foreground text-sm focus:outline-none resize-none"
          style={{ border: "1px solid hsl(var(--border))" }}
        />

        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={handleSave}
          className="w-full h-14 rounded-2xl font-bold text-white"
          style={{ background: "linear-gradient(135deg, hsl(var(--feeding)), hsl(var(--feeding) / 0.45))" }}
        >
          Сохранить визит
        </motion.button>
      </div>
    </motion.div>
  );
}

export default function DoctorVisits() {
  const [selDoctor, setSelDoctor] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [visits, setVisits] = useState<Visit[]>(() => loadVisits());

  const handleSave = (visit: Visit) => {
    const next = [visit, ...visits];
    saveVisits(next);
    eventsDB.create({
      type: "activity",
      title: "Визит к врачу",
      description: visit.conclusion,
      timestamp: `${visit.date}T12:00:00.000Z`,
      data: {
        eventSubType: "doctor",
        doctorName: doctorFromVisit(visit)?.name,
        specialty: doctorFromVisit(visit)?.spec,
      },
      favorite: false,
    });
    setVisits(loadVisits());
  };

  const filtered = selDoctor ? visits.filter((v) => v.doctorId === selDoctor) : visits;
  const nextVisit = visits
    .filter((v) => v.nextDate && new Date(v.nextDate) > new Date())
    .sort((a, b) => new Date(a.nextDate!).getTime() - new Date(b.nextDate!).getTime())[0];

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
            <AddVisitSheet onClose={() => setShowAdd(false)} onSave={handleSave} />
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
            <h1 className="text-2xl font-bold text-foreground">Врачи</h1>
            <p className="text-sm text-muted-foreground mt-0.5">{visits.length} визита · {DOCTORS.length} врача</p>
          </div>
          <motion.button
            whileTap={{ scale: 0.88 }}
            onClick={() => setShowAdd(true)}
            className="w-10 h-10 rounded-2xl flex items-center justify-center"
            style={{ background: "hsl(var(--feeding) / 0.15)" }}
          >
            <Plus className="w-5 h-5 text-green-400" />
          </motion.button>
        </motion.header>

        {nextVisit && (() => {
          const doc = doctorFromVisit(nextVisit);
          const targetDate = new Date(`${nextVisit.nextDate}T11:00:00`);
          const formattedDate = targetDate.toLocaleDateString("ru-RU", { day: "numeric", month: "long" });
          return (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mx-4 md:mx-6"
            >
              <CountdownBanner
                targetDate={targetDate}
                badge="Следующий визит"
                eyebrow={doc ? `${doc.name} · ${doc.spec}` : "Плановый осмотр"}
                title="До следующего приёма"
                description={`Запланирован визит ${formattedDate}. Отсчёт обновляется в реальном времени, чтобы следующая консультация не терялась в списке визитов.`}
                accent={doc?.color ?? "hsl(var(--sleep))"}
                secondaryAccent="hsl(var(--feeding))"
                icon={<Calendar className="h-3.5 w-3.5" style={{ color: doc?.color ?? "hsl(var(--sleep))" }} />}
                footer={(
                  <div className="flex flex-wrap gap-2">
                    <div className="rounded-full border border-white/10 bg-white/6 px-3 py-1.5 text-xs font-medium text-foreground/85">
                      {formattedDate}
                    </div>
                    {doc ? (
                      <div
                        className="rounded-full border px-3 py-1.5 text-xs font-semibold"
                        style={{ borderColor: hca(doc.color, 0.2), color: doc.color, background: hca(doc.color, 0.12) }}
                      >
                        {doc.spec}
                      </div>
                    ) : null}
                  </div>
                )}
                visual={(
                  <motion.div
                    animate={{ rotate: [0, -2, 2, 0], y: [0, -4, 0] }}
                    transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                    className="relative flex w-full max-w-[270px] flex-col gap-3 rounded-[28px] border border-white/10 bg-black/15 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]"
                  >
                    <div
                      className="absolute -right-4 top-0 h-20 w-20 rounded-full blur-3xl"
                      style={{ background: doc?.color ?? "hsl(var(--sleep))", opacity: 0.16 }}
                    />
                    <div className="flex items-center gap-3">
                      <div
                        className="flex h-12 w-12 items-center justify-center rounded-2xl text-2xl"
                        style={{ background: hca(doc?.color ?? "hsl(var(--sleep))", 0.14) }}
                      >
                        {doc?.emoji ?? "👩‍⚕️"}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-foreground">{doc?.name ?? "Педиатр"}</p>
                        <p className="text-xs text-muted-foreground">{doc?.clinic ?? "Детская клиника"}</p>
                      </div>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/6 px-3 py-3">
                      <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-muted-foreground">Следующий слот</p>
                      <p className="mt-1 text-sm font-semibold text-foreground">{formattedDate}</p>
                    </div>
                  </motion.div>
                )}
              />
            </motion.div>
          );
        })()}

        <div>
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest px-4 mb-2">👨‍⚕️ Наши врачи</p>
          <div className="flex gap-3 px-4 overflow-x-auto scrollbar-hide pb-1">
            {DOCTORS.map((doctor) => (
              <DoctorCard
                key={doctor.id}
                doctor={doctor}
                visitCount={visits.filter((visit) => visit.doctorId === doctor.id).length}
                isSelected={selDoctor === doctor.id}
                onSelect={() => setSelDoctor(selDoctor === doctor.id ? null : doctor.id)}
              />
            ))}
          </div>
        </div>

        <div className="px-4 md:px-6">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">
            📋 История визитов
            {selDoctor && (
              <button onClick={() => setSelDoctor(null)} className="ml-2 text-purple-400">× сброс</button>
            )}
          </p>
          <div className="flex flex-col">
            {filtered.map((visit) => (
              <VisitCard key={visit.id} visit={visit} doctor={doctorFromVisit(visit)} />
            ))}
            {filtered.length === 0 && (
              <div className="text-center py-10">
                <span className="text-4xl">🏥</span>
                <p className="text-muted-foreground text-sm mt-2">Нет визитов</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
