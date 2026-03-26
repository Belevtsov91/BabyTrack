import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { motion } from "framer-motion";
import { ArrowLeft, Plus, Thermometer, AlertTriangle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  ReferenceLine,
  Tooltip,
} from "recharts";
import { eventsDB, temperatureDB } from "@/lib/crud";

interface TempRecord {
  id: string;
  value: number;
  time: string;
  date: string;
  timestamp: string;
  notes?: string;
}

function formatDate(timestamp: string) {
  return new Date(timestamp).toISOString().slice(0, 10);
}

function formatTime(timestamp: string) {
  return new Date(timestamp).toLocaleTimeString("ru-RU", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function toRecord(record: { id: string; value: number; timestamp: string; notes?: string }): TempRecord {
  return {
    id: record.id,
    value: record.value,
    timestamp: record.timestamp,
    date: formatDate(record.timestamp),
    time: formatTime(record.timestamp),
    notes: record.notes,
  };
}

function syncTemperatureRecords(): TempRecord[] {
  const known = new Set(temperatureDB.getAll().map((item) => item.timestamp));
  const eventTemps = eventsDB.getAll().filter((event) => {
    if (event.type !== "temperature") return false;
    const value = Number(event.data?.temperature ?? event.data?.value ?? event.data?.amount);
    return Number.isFinite(value) && Boolean(event.timestamp);
  });

  eventTemps.forEach((event) => {
    if (known.has(event.timestamp)) return;
    temperatureDB.create({
      value: Number(event.data?.temperature ?? event.data?.value ?? event.data?.amount),
      timestamp: event.timestamp,
      notes: event.description ?? event.data?.notes,
    });
    known.add(event.timestamp);
  });

  return temperatureDB
    .getAll()
    .map(toRecord)
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
}

function getTempColor(val: number) {
  if (val >= 38) return "text-[hsl(var(--destructive))]";
  if (val >= 37.5) return "text-[hsl(var(--diaper))]";
  return "text-[hsl(var(--feeding))]";
}

export default function Temperature() {
  const navigate = useNavigate();
  const [records] = useState<TempRecord[]>(() => syncTemperatureRecords());

  const latest = records[records.length - 1];
  const maxTemp = records.length > 0 ? Math.max(...records.map((r) => r.value)) : null;
  const chartData = records.map((r) => ({
    name: `${r.date.slice(5)} ${r.time}`,
    temp: r.value,
  }));

  return (
    <AppLayout>
      <div className="flex flex-col gap-5 pt-safe pb-6">
        <header className="px-4 md:px-6 pt-4 flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-xl bg-card flex items-center justify-center">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-foreground">Температура</h1>
            <p className="text-xs text-muted-foreground">За последние 4 дня</p>
          </div>
        </header>

        <div className="px-4 md:px-6">
          <div className="glass-card p-5 flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-[hsl(var(--growth-soft))] flex items-center justify-center">
              <Thermometer className="w-7 h-7 text-[hsl(var(--growth))]" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-muted-foreground">Последнее измерение</p>
              {latest ? (
                <>
                  <p className={`text-3xl font-bold ${getTempColor(latest.value)}`}>{latest.value}°C</p>
                  <p className="text-xs text-muted-foreground">{latest.date} в {latest.time}</p>
                </>
              ) : (
                <>
                  <p className="text-3xl font-bold text-muted-foreground">—</p>
                  <p className="text-xs text-muted-foreground">Нет сохраненных измерений</p>
                </>
              )}
            </div>
            {maxTemp !== null && maxTemp >= 37.5 && (
              <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-destructive/20">
                <AlertTriangle className="w-4 h-4 text-[hsl(var(--destructive))]" />
                <span className="text-xs text-[hsl(var(--destructive))]">Макс: {maxTemp}°</span>
              </div>
            )}
          </div>
        </div>

        <div className="px-4 md:px-6">
          <div className="glass-card p-4">
            <h2 className="text-sm font-medium text-foreground mb-4">График температуры</h2>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(240 6% 18%)" />
                  <XAxis dataKey="name" tick={{ fontSize: 9, fill: "hsl(0 0% 55%)" }} interval={2} />
                  <YAxis domain={[36, 39]} tick={{ fontSize: 10, fill: "hsl(0 0% 55%)" }} width={35} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(240 8% 10%)",
                      border: "1px solid hsl(240 6% 18%)",
                      borderRadius: "12px",
                      fontSize: "12px",
                    }}
                    labelStyle={{ color: "hsl(0 0% 55%)" }}
                  />
                  <ReferenceLine
                    y={37.5}
                    stroke="hsl(0 62% 55%)"
                    strokeDasharray="5 5"
                    label={{ value: "37.5°", position: "right", fontSize: 10, fill: "hsl(0 62% 55%)" }}
                  />
                  <Line
                    type="monotone"
                    dataKey="temp"
                    stroke="hsl(10 55% 60%)"
                    strokeWidth={2}
                    dot={{ r: 3, fill: "hsl(10 55% 60%)" }}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="py-12 text-center text-sm text-muted-foreground">
                Добавьте первое измерение в журнале температуры.
              </div>
            )}
          </div>
        </div>

        <div className="px-4 md:px-6">
          <h2 className="text-sm font-medium text-muted-foreground mb-3 uppercase tracking-wide">История</h2>
          {records.length > 0 ? (
            <div className="flex flex-col gap-2">
              {[...records].reverse().map((r, i) => (
                <motion.div
                  key={r.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="glass-card px-4 py-3 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${r.value >= 37.5 ? "bg-[hsl(var(--destructive))]" : "bg-[hsl(var(--feeding))]"}`} />
                    <span className="text-sm text-muted-foreground">{r.date} • {r.time}</span>
                  </div>
                  <span className={`font-semibold text-sm ${getTempColor(r.value)}`}>{r.value}°C</span>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="glass-card px-4 py-8 text-center text-sm text-muted-foreground">
              Пока нет сохраненных измерений.
            </div>
          )}
        </div>

        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => navigate("/event/temperature")}
          className="fixed bottom-24 right-6 w-14 h-14 rounded-full bg-[hsl(var(--growth))] text-primary-foreground flex items-center justify-center shadow-lg z-40"
          style={{ boxShadow: "0 8px 32px -4px hsl(10 55% 60% / 0.4)" }}
        >
          <Plus className="w-6 h-6" />
        </motion.button>
      </div>
    </AppLayout>
  );
}
