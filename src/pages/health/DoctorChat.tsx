import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Send, Paperclip, Stethoscope, FileText, Image, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";

interface Message {
  id: string;
  text: string;
  sender: "user" | "doctor";
  time: string;
  attachment?: { type: "pdf" | "image"; name: string };
  typing?: boolean;
}

const CHAT_STORAGE_KEY = "babytrack_doctor_chat_messages";

const initialMessages: Message[] = [
  { id: "1", text: "Здравствуйте! Как проходит развитие малыша?", sender: "doctor", time: "10:30" },
  { id: "2", text: "Добрый день! Всё хорошо, но немного беспокоит температура — 37.4 вечером", sender: "user", time: "10:32" },
  { id: "3", text: "Это может быть связано с прорезыванием зубов. Следите за динамикой. Если поднимется выше 38 — дайте жаропонижающее и свяжитесь со мной.", sender: "doctor", time: "10:35" },
  { id: "4", text: "Отправляю отчёт за последний месяц 📎", sender: "user", time: "10:36", attachment: { type: "pdf", name: "report_jan.pdf" } },
  { id: "5", text: "Спасибо, посмотрю. Вес и рост в пределах нормы по WHO-кривым. Продолжайте в том же духе! 👍", sender: "doctor", time: "10:40" },
];

const doctorReplies: Record<string, string> = {
  температура: "Если температура ниже 38°C — это нормально при прорезывании зубов. Давайте обильное питьё, проветривайте комнату. При повышении выше 38.5°C — дайте Нурофен по весу.",
  сон: "Норма сна в этом возрасте — 12-15 часов в сутки. Если малыш спит меньше 10 часов, попробуйте скорректировать режим: ранний отбой (19:00-20:00), затемнение комнаты.",
  кормлен: "Обычно к 6 месяцам вводят прикорм. Начинайте с овощных пюре (кабачок, цветная капуста), по одному новому продукту в 3-5 дней. Следите за реакцией.",
  зуб: "Зубы обычно появляются в 6-8 месяцев. Признаки: обильное слюноотделение, капризность, температура до 37.5. Используйте охлаждающие прорезыватели.",
  вес: "Нормальная прибавка веса — 600-800 г в месяц до 6 месяцев, затем 300-400 г. Если отклонение более 10% от нормы — запишитесь на приём.",
  прививк: "Следуйте национальному календарю прививок. Перед вакцинацией убедитесь, что малыш здоров, температура нормальная. После прививки может быть лёгкая реакция 1-2 дня.",
  стул: "Нормальный стул у грудничка — от нескольких раз в день до 1 раза в 3-5 дней. Если стул зелёный, пенистый или с кровью — обратитесь ко мне.",
  аллерги: "При появлении сыпи, покраснений или расстройства стула после нового продукта — исключите его на 2 недели. Ведите пищевой дневник.",
  колик: "Колики обычно проходят к 3-4 месяцам. Помогает: выкладывание на живот, массаж по часовой стрелке, тёплая пелёнка на живот, «велосипед» ножками.",
};

function getDoctorReply(userMessage: string): string {
  const lower = userMessage.toLowerCase();
  for (const [keyword, reply] of Object.entries(doctorReplies)) {
    if (lower.includes(keyword)) return reply;
  }
  return "Спасибо за информацию. Продолжайте наблюдать за малышом. Если что-то будет беспокоить — пишите, я на связи. На следующем приёме обсудим подробнее 🩺";
}

function loadMessages(): Message[] {
  try {
    const raw = localStorage.getItem(CHAT_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Message[];
      return parsed.filter((message) => !message.typing);
    }
  } catch {
    return initialMessages;
  }
  return initialMessages;
}

export default function DoctorChat() {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>(() => loadMessages());
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const attachmentInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const persist = messages.filter((message) => !message.typing);
    localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(persist));
  }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;

    const userText = input.trim();
    const userMsg: Message = {
      id: `user-${Date.now()}`,
      text: userText,
      sender: "user",
      time: new Date().toLocaleTimeString("ru", { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");

    const typingId = `typing-${Date.now()}`;
    setTimeout(() => {
      setMessages((prev) => [...prev, { id: typingId, text: "", sender: "doctor", time: "", typing: true }]);
    }, 350);

    setTimeout(() => {
      setMessages((prev) => {
        const withoutTyping = prev.filter((message) => message.id !== typingId);
        return [...withoutTyping, {
          id: `reply-${Date.now()}`,
          text: getDoctorReply(userText),
          sender: "doctor",
          time: new Date().toLocaleTimeString("ru", { hour: "2-digit", minute: "2-digit" }),
        }];
      });
    }, 1400);
  };

  const handleAttachment = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
    const attachment = {
      type: isPdf ? "pdf" as const : "image" as const,
      name: file.name,
    };

    setMessages((prev) => [...prev, {
      id: `file-${Date.now()}`,
      text: isPdf ? "Отправляю документ" : "Отправляю фото",
      sender: "user",
      time: new Date().toLocaleTimeString("ru", { hour: "2-digit", minute: "2-digit" }),
      attachment,
    }]);

    window.setTimeout(() => {
      setMessages((prev) => [...prev, {
        id: `doctor-file-${Date.now()}`,
        text: isPdf ? "Документ получила, посмотрю отчёт и вернусь с комментариями." : "Фото получила. Если нужно, опишите симптомы или контекст сообщением.",
        sender: "doctor",
        time: new Date().toLocaleTimeString("ru", { hour: "2-digit", minute: "2-digit" }),
      }]);
    }, 900);

    event.target.value = "";
  };

  return (
    <AppLayout showTabBar={false}>
      <div className="flex flex-col h-screen">
        <header className="px-4 pt-safe pb-3 flex items-center gap-3 border-b border-border bg-card/80 backdrop-blur-xl">
          <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-xl bg-muted/50 flex items-center justify-center">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <div className="w-10 h-10 rounded-full bg-[hsl(var(--health-soft))] flex items-center justify-center">
            <Stethoscope className="w-5 h-5 text-[hsl(var(--health))]" />
          </div>
          <div className="flex-1">
            <h1 className="text-base font-semibold text-foreground">Др. Иванова</h1>
            <p className="text-xs text-[hsl(var(--health))]">Педиатр • Онлайн</p>
          </div>
          <button
            onClick={() => navigate("/report")}
            className="w-9 h-9 rounded-lg bg-muted/50 flex items-center justify-center text-muted-foreground"
            aria-label="Открыть отчёт"
          >
            <FileText className="w-4 h-4" />
          </button>
        </header>

        <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3">
          <div className="text-center">
            <span className="text-xs text-muted-foreground bg-muted/50 px-3 py-1 rounded-full">Сегодня</span>
          </div>
          {messages.map((message, index) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.02 }}
              className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}
            >
              {message.typing ? (
                <div className="bg-card border border-border rounded-2xl rounded-bl-md px-4 py-3 flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Печатает...</span>
                </div>
              ) : (
                <div className={`max-w-[80%] px-4 py-2.5 rounded-2xl ${
                  message.sender === "user"
                    ? "bg-primary text-primary-foreground rounded-br-md"
                    : "bg-card border border-border text-foreground rounded-bl-md"
                }`}>
                  <p className="text-sm">{message.text}</p>
                  {message.attachment && (
                    <div className="mt-2 flex items-center gap-2 bg-background/20 rounded-lg px-3 py-2">
                      {message.attachment.type === "pdf" ? <FileText className="w-4 h-4" /> : <Image className="w-4 h-4" />}
                      <span className="text-xs">{message.attachment.name}</span>
                    </div>
                  )}
                  <p className={`text-[10px] mt-1 ${message.sender === "user" ? "text-primary-foreground/60" : "text-muted-foreground"}`}>
                    {message.time}
                  </p>
                </div>
              )}
            </motion.div>
          ))}
        </div>

        <div className="px-4 pb-safe pt-3 border-t border-border bg-card/80 backdrop-blur-xl">
          <div className="flex items-center gap-2">
            <input
              ref={attachmentInputRef}
              type="file"
              accept="image/*,.pdf"
              className="hidden"
              onChange={handleAttachment}
            />
            <button
              onClick={() => attachmentInputRef.current?.click()}
              className="w-10 h-10 rounded-xl bg-muted/50 flex items-center justify-center text-muted-foreground"
              aria-label="Прикрепить файл"
            >
              <Paperclip className="w-5 h-5" />
            </button>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder="Сообщение педиатру..."
              className="flex-1 h-10 px-4 rounded-xl bg-muted/50 text-foreground text-sm placeholder:text-muted-foreground outline-none"
            />
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={handleSend}
              className="w-10 h-10 rounded-xl bg-[hsl(var(--health))] flex items-center justify-center text-primary-foreground"
            >
              <Send className="w-5 h-5" />
            </motion.button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
