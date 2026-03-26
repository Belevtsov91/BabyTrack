/**
 * ФАЙЛ: src/pages/social/Chat.tsx
 */

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Send, Activity, Zap, Smile, Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { AppLayout } from "@/components/layout/AppLayout";
import AvatarBorder, { type AvatarBorderBadge, type AvatarBorderSize } from "@/components/ui/avatar-border";

const hc  = (v: string) => `hsl(var(${v}))`;
const hca = (v: string, a: number) => `hsl(var(${v}) / ${a})`;

function memberBadge(member: Member): AvatarBorderBadge {
  if (member.online) return "online";
  if (member.id === "doc") return "verified";
  return "none";
}

function MemberAvatar({
  member,
  size = "md",
  className,
}: {
  member: Member;
  size?: AvatarBorderSize;
  className?: string;
}) {
  return (
    <AvatarBorder
      name={member.name}
      emoji={member.avatar}
      accentVar={member.colorVar}
      badge={memberBadge(member)}
      size={size}
      className={className}
    />
  );
}

function RoomMemberStack({ room }: { room: Room }) {
  const roomMembers = room.members
    .map((id) => MEMBERS.find((member) => member.id === id))
    .filter((member): member is Member => Boolean(member))
    .slice(0, 3);

  return (
    <div className="flex min-w-[64px] items-center">
      {roomMembers.map((member, index) => (
        <div
          key={member.id}
          className={cn(index > 0 ? "-ml-2.5" : "", "rounded-full bg-background")}
        >
          <MemberAvatar member={member} size="xs" />
        </div>
      ))}
    </div>
  );
}

// ─── Типы ─────────────────────────────────────────────────────────────────────

interface Member {
  id: string;
  name: string;
  avatar: string;
  role: string;
  online: boolean;
  lastSeen?: string;
  colorVar: string;
}

interface ChatMessage {
  id: string;
  senderId: string;
  text?: string;
  eventCard?: EventSnippet;
  timestamp: Date;
  reactions: { emoji: string; count: number; mine: boolean }[];
  smartReplies?: string[];
}

interface EventSnippet {
  type: string;
  emoji: string;
  title: string;
  value: string;
  colorVar: string;
  time: string;
}

interface Room {
  id: string;
  name: string;
  emoji: string;
  lastMsg: string;
  time: string;
  unread: number;
  colorVar: string;
  members: string[];
}

// ─── Данные ───────────────────────────────────────────────────────────────────

const MEMBERS: Member[] = [
  { id: "me",  name: "Я",      avatar: "🧑", role: "Мама",   online: true,  colorVar: "--sleep" },
  { id: "dad", name: "Папа",   avatar: "👨", role: "Папа",   online: true,  colorVar: "--activity" },
  { id: "gma", name: "Бабуля", avatar: "👵", role: "Бабушка",online: false, lastSeen: "10м назад", colorVar: "--mood" },
  { id: "doc", name: "Доктор", avatar: "👨‍⚕️", role: "Педиатр",online: false, lastSeen: "вчера",     colorVar: "--feeding" },
];

const ROOMS: Room[] = [
  { id: "family", name: "Семья",       emoji: "👨‍👩‍👧", lastMsg: "Покормил в 09:15",   time: "09:17", unread: 2, colorVar: "--sleep",   members: ["me","dad","gma"] },
  { id: "doc",    name: "Педиатр",     emoji: "👨‍⚕️",  lastMsg: "Жаропонижающее можно", time: "вчера", unread: 0, colorVar: "--feeding", members: ["me","doc"] },
  { id: "notes",  name: "Мои заметки", emoji: "📝",  lastMsg: "Режутся зубки...",     time: "2 дня", unread: 0, colorVar: "--diaper",  members: ["me"] },
];

const ACTIVITY_FEED = [
  { id: "a1", member: MEMBERS[1], action: "покормил бутылочкой", value: "120 мл", emoji: "🍼", time: "08:45", colorVar: "--feeding" },
  { id: "a2", member: MEMBERS[0], action: "сменила подгузник",   value: "мокрый", emoji: "👶", time: "09:10", colorVar: "--diaper"  },
  { id: "a3", member: MEMBERS[1], action: "уложил спать",        value: "дневной",emoji: "🌙", time: "09:15", colorVar: "--sleep"   },
];

const MOCK_MESSAGES: ChatMessage[] = [
  {
    id: "msg1", senderId: "dad", timestamp: new Date(Date.now() - 3600000),
    reactions: [{ emoji: "❤️", count: 1, mine: true }],
    eventCard: { type: "feeding", emoji: "🍼", title: "Бутылочка", value: "120 мл", colorVar: "--feeding", time: "08:45" },
  },
  {
    id: "msg2", senderId: "me", timestamp: new Date(Date.now() - 3000000),
    text: "Отлично! Хорошо поел 👍",
    reactions: [],
    smartReplies: ["Сколько минут?", "Какая смесь?", "Правая или левая?"],
  },
  {
    id: "msg3", senderId: "gma", timestamp: new Date(Date.now() - 1800000),
    text: "Как малыш? Всё хорошо? 🤗",
    reactions: [{ emoji: "😊", count: 1, mine: false }],
  },
  {
    id: "msg4", senderId: "me", timestamp: new Date(Date.now() - 900000),
    text: "Да, спит сейчас. Дневной сон начался в 13:00",
    reactions: [],
    eventCard: { type: "sleep", emoji: "🌙", title: "Сон", value: "дневной · 13:00", colorVar: "--sleep", time: "13:00" },
  },
];

const EMOJI_CHOICES = ["❤️", "😊", "👍", "😂", "🙏", "🎉", "✨", "😴"];

// ─── Утилиты ─────────────────────────────────────────────────────────────────

function timeGroup(d: Date): string {
  const h = d.getHours();
  if (h >= 5  && h < 12) return "🌅 Утро";
  if (h >= 12 && h < 18) return "☀️ День";
  if (h >= 18 && h < 22) return "🌆 Вечер";
  return "🌙 Ночь";
}

function fmtTime(d: Date): string {
  return d.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
}

// ─── Индикаторы присутствия ───────────────────────────────────────────────────

function PresenceRow({ members }: { members: Member[] }) {
  return (
    <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide px-4 py-2">
      {members.map((m, i) => (
        <motion.div
          key={m.id}
          initial={{ opacity: 0, scale: 0.7 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: i * 0.07 }}
          className="flex flex-col items-center gap-1 shrink-0"
        >
          <div className="relative">
            <MemberAvatar member={m} size="lg" />
            {m.online ? (
              <motion.div
                className="pointer-events-none absolute inset-0 rounded-full"
                animate={{ boxShadow: [`0 0 0 0 ${hca("--feeding", 0)}`, `0 0 0 6px ${hca("--feeding", 0.16)}`, `0 0 0 0 ${hca("--feeding", 0)}`] }}
                transition={{ duration: 2.1, repeat: Infinity }}
              />
            ) : null}
          </div>
          <span className="text-[9px] text-muted-foreground font-medium">{m.name}</span>
        </motion.div>
      ))}
    </div>
  );
}

// ─── Лента активности ─────────────────────────────────────────────────────────

function ActivityFeedRow() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-4 rounded-3xl overflow-hidden"
      style={{ background: hc("--card"), border: `1px solid ${hc("--border")}` }}
    >
      <div className="px-4 pt-3 pb-1 flex items-center gap-2">
        <Activity className="w-3.5 h-3.5 text-muted-foreground" />
        <p className="text-[11px] uppercase tracking-widest text-muted-foreground font-bold">
          Активность сегодня
        </p>
      </div>
      <div className="flex flex-col">
        {ACTIVITY_FEED.map((a, i) => (
          <motion.div
            key={a.id}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.08 }}
            className="flex items-center gap-3 px-4 py-2.5 border-t border-white/[0.04]"
          >
            <MemberAvatar member={a.member} size="xs" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-foreground">
                <span className="font-bold">{a.member.name}</span>
                {" "}{a.action}
              </p>
            </div>
            <div
              className="flex items-center gap-1 px-2 py-1 rounded-xl shrink-0"
              style={{ background: hca(a.colorVar, 0.12) }}
            >
              <span className="text-sm">{a.emoji}</span>
              <span className="text-[10px] font-bold" style={{ color: hc(a.colorVar) }}>{a.value}</span>
            </div>
            <span className="text-[10px] text-muted-foreground/50 shrink-0">{a.time}</span>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

// ─── Быстрая трансляция события ───────────────────────────────────────────────

function QuickBroadcast({ onSend }: { onSend: (snippet: EventSnippet) => void }) {
  const [open, setOpen] = useState(false);

  const events = [
    { type: "feeding", emoji: "🍼", title: "Покормил",  value: "сейчас",  colorVar: "--feeding" },
    { type: "sleep",   emoji: "🌙", title: "Уснул",     value: "сейчас",  colorVar: "--sleep"   },
    { type: "diaper",  emoji: "👶", title: "Подгузник", value: "сменил",  colorVar: "--diaper"  },
    { type: "mood",    emoji: "😊", title: "Настроение",value: "хорошее", colorVar: "--mood"    },
  ];

  const now = new Date().toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });

  return (
    <div className="relative">
      <motion.button
        whileTap={{ scale: 0.88 }}
        onClick={() => setOpen((v) => !v)}
        className="w-9 h-9 rounded-2xl flex items-center justify-center"
        style={{ background: open ? hca("--sleep", 0.22) : hc("--muted") }}
      >
        <Zap className={cn("w-4 h-4", open ? "text-purple-400" : "text-muted-foreground")} />
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.85, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.85, y: 8 }}
            className="absolute bottom-12 left-0 z-30 flex flex-col gap-1.5 p-2 rounded-2xl"
            style={{ background: hc("--muted"), border: `1px solid ${hc("--border")}`, minWidth: 180 }}
          >
            {events.map((e, i) => (
              <motion.button
                key={e.type}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => {
                  onSend({ ...e, time: now });
                  setOpen(false);
                }}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all"
                style={{ background: hca(e.colorVar, 0.06) }}
                whileTap={{ scale: 0.95 }}
              >
                <span className="text-lg">{e.emoji}</span>
                <span className="text-sm font-semibold text-foreground">{e.title}</span>
                <span className="text-[10px] text-muted-foreground ml-auto">{now}</span>
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function MemberSheet({
  room,
  onClose,
  onMention,
}: {
  room: Room;
  onClose: () => void;
  onMention: (member: Member) => void;
}) {
  const roomMembers = room.members
    .map((id) => MEMBERS.find((member) => member.id === id))
    .filter((member): member is Member => Boolean(member));

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-40 flex items-end justify-center bg-black/45 px-4 pb-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 24, opacity: 0.8 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 24, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-[28px] p-4"
        style={{ background: hc("--card"), border: `1px solid ${hc("--border")}` }}
      >
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-sm font-bold text-foreground">{room.name}</p>
            <p className="text-[11px] text-muted-foreground">Участники чата · {roomMembers.length}</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background: hc("--muted") }}
          >
            <span className="text-lg leading-none text-muted-foreground">×</span>
          </button>
        </div>

        <div className="flex flex-col gap-2">
          {roomMembers.map((member) => (
            <motion.button
              key={member.id}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                onMention(member);
                onClose();
              }}
              className="flex items-center gap-3 p-3 rounded-2xl text-left"
              style={{ background: hca(member.colorVar, 0.06), border: `1px solid ${hca(member.colorVar, 0.18)}` }}
            >
              <MemberAvatar member={member} size="md" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground">{member.name}</p>
                <p className="text-[10px] text-muted-foreground">{member.role}</p>
              </div>
              <span
                className="text-[10px] font-semibold px-2 py-1 rounded-full"
                style={{
                  color: member.online ? hc("--feeding") : hc("--muted-foreground"),
                  background: hc("--muted"),
                }}
              >
                {member.online ? "online" : (member.lastSeen ?? "offline")}
              </span>
            </motion.button>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Карточка события в чате ──────────────────────────────────────────────────

function EventCardBubble({ card }: { card: EventSnippet }) {
  return (
    <div
      className="flex items-center gap-3 p-3 rounded-2xl"
      style={{
        background: hca(card.colorVar, 0.06),
        border: `1px solid ${hca(card.colorVar, 0.19)}`,
      }}
    >
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0"
        style={{ background: hca(card.colorVar, 0.14) }}
      >
        {card.emoji}
      </div>
      <div>
        <p className="text-xs font-bold" style={{ color: hc(card.colorVar) }}>{card.title}</p>
        <p className="text-sm text-foreground font-medium">{card.value}</p>
        <p className="text-[10px] text-muted-foreground">{card.time}</p>
      </div>
    </div>
  );
}

// ─── Пузырь сообщения ─────────────────────────────────────────────────────────

function MessageBubble({
  msg,
  isMe,
  member,
  showTimeGroup,
  group,
  onReact,
  onSmartReply,
}: {
  msg: ChatMessage;
  isMe: boolean;
  member?: Member;
  showTimeGroup: boolean;
  group: string;
  onReact: (msgId: string, emoji: string) => void;
  onSmartReply: (text: string) => void;
}) {
  const [showReactions, setShowReactions] = useState(false);
  const REACTION_OPTS = ["❤️", "😊", "👍", "😂", "🙏", "🎉"];

  return (
    <div>
      {showTimeGroup && (
        <div className="flex items-center justify-center my-3">
          <span className="text-[10px] text-muted-foreground/60 px-3 py-1 rounded-full bg-white/[0.04]">
            {group}
          </span>
        </div>
      )}

        <div className={cn("flex gap-2 mb-2", isMe ? "flex-row-reverse" : "flex-row")}>
          {!isMe && (
            member ? (
              <MemberAvatar member={member} size="xs" className="self-end" />
            ) : (
              <AvatarBorder name="Гость" emoji="👤" size="xs" className="self-end" />
            )
          )}

        <div className={cn("flex flex-col gap-1 max-w-[78%]", isMe ? "items-end" : "items-start")}>
          {!isMe && (
            <span className="text-[10px] font-semibold px-1" style={{ color: member ? hc(member.colorVar) : undefined }}>
              {member?.name}
            </span>
          )}

          <motion.div
            initial={{ opacity: 0, scale: 0.85, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 22 }}
            onClick={() => setShowReactions((v) => !v)}
            className="relative"
          >
            <div
              className="px-4 py-3 rounded-3xl"
              style={{
                background: isMe
                  ? `linear-gradient(135deg, ${hc("--sleep")}, ${hc("--milestone")})`
                  : hc("--muted"),
                borderBottomRightRadius: isMe ? 6 : undefined,
                borderBottomLeftRadius:  !isMe ? 6 : undefined,
              }}
            >
              {msg.eventCard && <EventCardBubble card={msg.eventCard} />}
              {msg.text && (
                <p className={cn("text-sm text-white leading-relaxed", msg.eventCard ? "mt-2" : "")}>
                  {msg.text}
                </p>
              )}
            </div>

            <p className={cn(
              "text-[9px] text-muted-foreground/50 mt-0.5 px-1",
              isMe ? "text-right" : "text-left"
            )}>
              {fmtTime(msg.timestamp)}
            </p>

            {msg.reactions.length > 0 && (
              <div className={cn("flex gap-1 mt-0.5", isMe ? "justify-end" : "justify-start")}>
                {msg.reactions.map((r, i) => (
                  <button
                    key={i}
                    onClick={() => onReact(msg.id, r.emoji)}
                    className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-xs"
                    style={{
                      background: r.mine ? hca("--sleep", 0.22) : hc("--muted"),
                      border: r.mine ? `1px solid ${hc("--sleep")}` : "1px solid transparent",
                    }}
                  >
                    <span>{r.emoji}</span>
                    {r.count > 1 && <span className="text-[10px] text-muted-foreground">{r.count}</span>}
                  </button>
                ))}
              </div>
            )}
          </motion.div>

          {msg.smartReplies && msg.smartReplies.length > 0 && !isMe && (
            <div className="flex gap-1.5 flex-wrap mt-0.5">
              {msg.smartReplies.map((r) => (
                <motion.button
                  key={r}
                  onClick={() => onSmartReply(r)}
                  whileTap={{ scale: 0.92 }}
                  className="px-3 py-1.5 rounded-2xl text-xs font-semibold"
                  style={{
                    background: hc("--muted"),
                    border: `1px solid ${hca("--sleep", 0.25)}`,
                    color: hc("--sleep"),
                  }}
                >
                  {r}
                </motion.button>
              ))}
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {showReactions && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className={cn(
              "flex gap-1 px-3 py-2 rounded-2xl mb-2",
              isMe ? "ml-auto w-fit mr-10" : "ml-10 w-fit"
            )}
            style={{ background: hc("--muted"), border: `1px solid ${hc("--border")}` }}
          >
            {REACTION_OPTS.map((e) => (
              <button
                key={e}
                onClick={() => { onReact(msg.id, e); setShowReactions(false); }}
                className="text-xl hover:scale-125 transition-transform"
              >
                {e}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Экран чата ───────────────────────────────────────────────────────────────

function ChatScreen({
  room,
  onBack,
}: {
  room: Room;
  onBack: () => void;
}) {
  const chatKey = `babytrack_chat_${room.id}`;

  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const stored = localStorage.getItem(chatKey);
      if (stored) {
        const parsed = JSON.parse(stored) as ChatMessage[];
        // Restore Date objects from stored ISO strings
        return parsed.map((m) => ({ ...m, timestamp: new Date(m.timestamp) }));
      }
    } catch {}
    return MOCK_MESSAGES;
  });
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [showMembers, setShowMembers] = useState(false);
  const [showEmojiMenu, setShowEmojiMenu] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const closePickers = () => {
    setShowMembers(false);
    setShowEmojiMenu(false);
  };
  const insertText = (value: string) => {
    setInput((prev) => {
      if (!prev.trim()) return value;
      const spacing = prev.endsWith(" ") ? "" : " ";
      return `${prev}${spacing}${value}`;
    });
    inputRef.current?.focus();
  };

  // Persist messages to localStorage on every change
  useEffect(() => {
    try { localStorage.setItem(chatKey, JSON.stringify(messages)); } catch {}
  }, [messages, chatKey]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const t  = setTimeout(() => setTyping(true),  3000);
    const t2 = setTimeout(() => {
      setTyping(false);
      setMessages((prev) => [...prev, {
        id:        `auto-${Date.now()}`,
        senderId:  "dad",
        text:      "Понял! Слежу за малышом 👀",
        timestamp: new Date(),
        reactions: [],
      }]);
    }, 6000);
    return () => { clearTimeout(t); clearTimeout(t2); };
  }, []);

  const sendMessage = (text: string) => {
    if (!text.trim()) return;
    setMessages((prev) => [...prev, {
      id:        `msg-${Date.now()}`,
      senderId:  "me",
      text,
      timestamp: new Date(),
      reactions: [],
    }]);
    setInput("");
    closePickers();
  };

  const handleEventBroadcast = (snippet: EventSnippet) => {
    setMessages((prev) => [...prev, {
      id:        `ev-${Date.now()}`,
      senderId:  "me",
      eventCard: snippet,
      timestamp: new Date(),
      reactions: [],
    }]);
    closePickers();
  };

  const handleReact = (msgId: string, emoji: string) => {
    setMessages((prev) => prev.map((m) => {
      if (m.id !== msgId) return m;
      const existing = m.reactions.find((r) => r.emoji === emoji);
      if (existing) {
        return { ...m, reactions: m.reactions.map((r) =>
          r.emoji === emoji ? { ...r, count: r.count + 1, mine: !r.mine } : r
        )};
      }
      return { ...m, reactions: [...m.reactions, { emoji, count: 1, mine: true }] };
    }));
  };

  return (
    <div className="relative flex flex-col h-screen max-w-md mx-auto md:max-w-none bg-background">
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="flex items-center gap-3 px-4 py-3 border-b border-white/[0.06] bg-background/90 backdrop-blur-xl"
      >
        <button
          onClick={() => {
            closePickers();
            onBack();
          }}
          className="w-9 h-9 rounded-full bg-muted flex items-center justify-center"
        >
          <ArrowLeft className="w-5 h-5 text-muted-foreground" />
        </button>

        <div
          className="w-10 h-10 rounded-2xl flex items-center justify-center text-xl"
          style={{ background: hca(room.colorVar, 0.12) }}
        >
          {room.emoji}
        </div>

        <div className="flex-1">
          <p className="text-sm font-bold text-foreground">{room.name}</p>
          <div className="flex items-center gap-1">
            <motion.div
              className="w-1.5 h-1.5 rounded-full bg-green-400"
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            <p className="text-[10px] text-muted-foreground">
              {room.members.length} участника · онлайн
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            setShowEmojiMenu(false);
            setShowMembers((value) => !value);
          }}
          className="w-9 h-9 rounded-full bg-muted flex items-center justify-center"
          aria-pressed={showMembers}
        >
          <Users className="w-4 h-4 text-muted-foreground" />
        </button>
      </motion.header>

      <div className="flex-1 overflow-y-auto px-4 py-3">
        {messages.map((msg, index) => {
          const isMe   = msg.senderId === "me";
          const member = MEMBERS.find((m) => m.id === msg.senderId);
          const group  = timeGroup(msg.timestamp);
          const previousGroup = index > 0 ? timeGroup(messages[index - 1].timestamp) : undefined;
          const showGroup = index === 0 || previousGroup !== group;

          return (
            <MessageBubble
              key={msg.id}
              msg={msg}
              isMe={isMe}
              member={member}
              showTimeGroup={showGroup}
              group={group}
              onReact={handleReact}
              onSmartReply={(t) => sendMessage(t)}
            />
          );
        })}

        <AnimatePresence>
          {typing && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex gap-2 items-end mb-2"
            >
              <MemberAvatar member={MEMBERS[1]} size="xs" />
              <div className="px-4 py-3 rounded-3xl rounded-bl-md bg-card flex gap-1">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    className="w-2 h-2 rounded-full bg-muted-foreground/60"
                    animate={{ scaleY: [1, 2, 1] }}
                    transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
                  />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div ref={bottomRef} />
      </div>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="px-4 py-3 border-t border-white/[0.06] bg-background/90 backdrop-blur-xl"
      >
        <div className="flex items-center gap-2">
          <QuickBroadcast onSend={handleEventBroadcast} />

          <div
            className="flex-1 flex items-center gap-2 px-4 py-2.5 rounded-2xl"
            style={{ background: hc("--muted"), border: `1px solid ${hc("--border")}` }}
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage(input)}
              placeholder="Сообщение..."
              className="flex-1 bg-transparent text-foreground text-sm placeholder:text-muted-foreground focus:outline-none"
              ref={inputRef}
            />
            <button
              onClick={() => {
                setShowMembers(false);
                setShowEmojiMenu((value) => !value);
              }}
              className="text-muted-foreground"
              aria-pressed={showEmojiMenu}
            >
              <Smile className="w-4 h-4" />
            </button>
          </div>

          <motion.button
            whileTap={{ scale: 0.85 }}
            onClick={() => sendMessage(input)}
            disabled={!input.trim()}
            className="w-10 h-10 rounded-2xl flex items-center justify-center transition-all"
            style={{
              background: input.trim()
                ? `linear-gradient(135deg, ${hc("--sleep")}, ${hc("--milestone")})`
                : hc("--muted"),
            }}
          >
            <Send className="w-4 h-4 text-white" />
          </motion.button>
        </div>
      </motion.div>

      <AnimatePresence>
        {showMembers && (
          <MemberSheet
            room={room}
            onClose={() => setShowMembers(false)}
            onMention={(member) => insertText(`@${member.name} `)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showEmojiMenu && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.96 }}
            className="absolute bottom-20 left-4 right-20 z-30 flex flex-wrap gap-2 p-2 rounded-2xl"
            style={{ background: hc("--card"), border: `1px solid ${hc("--border")}` }}
          >
            {EMOJI_CHOICES.map((emoji) => (
              <motion.button
                key={emoji}
                whileTap={{ scale: 0.9 }}
                onClick={() => {
                  insertText(emoji);
                  setShowEmojiMenu(false);
                }}
                className="w-9 h-9 rounded-xl flex items-center justify-center text-lg"
                style={{ background: hc("--muted") }}
              >
                {emoji}
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Список комнат ────────────────────────────────────────────────────────────

function RoomList({ onOpen }: { onOpen: (room: Room) => void }) {
  return (
    <AppLayout>
      <div className="flex flex-col gap-4 pt-safe pb-8 xl:max-w-4xl xl:mx-auto">

        <motion.header
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          className="px-4 md:px-6 pt-4"
        >
          <h1 className="text-2xl font-bold text-foreground">Чат</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Семья и врачи</p>
        </motion.header>

        <PresenceRow members={MEMBERS} />
        <ActivityFeedRow />

        <div className="px-4 md:px-6">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">
            💬 Чаты
          </p>
          <div className="flex flex-col gap-2">
            {ROOMS.map((room, i) => (
              <motion.button
                key={room.id}
                onClick={() => onOpen(room)}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.08 }}
                whileTap={{ scale: 0.97 }}
                className="flex items-center gap-4 p-4 rounded-3xl text-left"
                style={{ background: hc("--card"), border: `1px solid ${hc("--border")}` }}
              >
                <div className="flex min-w-[84px] shrink-0 flex-col items-start gap-2">
                  <RoomMemberStack room={room} />
                  <span
                    className="inline-flex items-center rounded-full px-2 py-1 text-[10px] font-bold"
                    style={{ background: hca(room.colorVar, 0.12), color: hc(room.colorVar) }}
                  >
                    {room.emoji}
                  </span>
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-foreground">{room.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 truncate">{room.lastMsg}</p>
                </div>

                <div className="flex flex-col items-end gap-1.5 shrink-0">
                  <span className="text-[10px] text-muted-foreground">{room.time}</span>
                  {room.unread > 0 && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
                      style={{ background: hc(room.colorVar) }}
                    >
                      {room.unread}
                    </motion.div>
                  )}
                </div>
              </motion.button>
            ))}
          </div>
        </div>

      </div>
    </AppLayout>
  );
}

// ─── Главный экран ────────────────────────────────────────────────────────────

export default function Chat() {
  const [activeRoom, setActiveRoom] = useState<Room | null>(null);

  return (
    <AnimatePresence mode="wait">
      {activeRoom ? (
        <motion.div
          key="chat"
          initial={{ x: 300, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 300, opacity: 0 }}
          transition={{ type: "spring", stiffness: 260, damping: 28 }}
        >
          <ChatScreen room={activeRoom} onBack={() => setActiveRoom(null)} />
        </motion.div>
      ) : (
        <motion.div
          key="list"
          initial={{ x: -100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: -100, opacity: 0 }}
          transition={{ type: "spring", stiffness: 260, damping: 28 }}
        >
          <RoomList onOpen={(r) => setActiveRoom(r)} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
