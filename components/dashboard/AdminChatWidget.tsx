"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  addDoc,
  collection,
  doc,
  increment,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  writeBatch,
} from "firebase/firestore";
import { MessageCircle, Send, X } from "lucide-react";
import { db } from "@/lib/firebase/client";
import { useAuth } from "@/components/auth/AuthProvider";
import { Button } from "@/components/ui/button";

type ChatMessage = {
  id: string;
  text: string;
  senderRole: "parent" | "admin";
  createdAt?: number;
  seenByParentAt?: number;
  seenByAdminAt?: number;
};

function formatMessageTime(ts?: number) {
  if (!ts) return "teraz";
  return new Date(ts).toLocaleTimeString("pl-PL", { hour: "2-digit", minute: "2-digit" });
}

function formatMessageDate(ts?: number) {
  if (!ts) return "Dziś";
  return new Date(ts).toLocaleDateString("pl-PL", { day: "2-digit", month: "long" });
}

function dayKey(ts?: number) {
  if (!ts) return "now";
  const d = new Date(ts);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

export function AdminChatWidget() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const messagesRef = useRef<HTMLDivElement | null>(null);

  const threadId = useMemo(() => user?.uid ?? null, [user?.uid]);

  useEffect(() => {
    const handler = () => setOpen(true);
    window.addEventListener("open-admin-chat", handler);
    return () => window.removeEventListener("open-admin-chat", handler);
  }, []);

  useEffect(() => {
    if (!threadId) return;
    const q = query(
      collection(db, "admin_chats", threadId, "messages"),
      orderBy("createdAt", "asc"),
      limit(100)
    );
    const unsub = onSnapshot(q, (snap) => {
      const rows = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<ChatMessage, "id">) }));
      setMessages(rows);
    });
    return () => unsub();
  }, [threadId]);

  useEffect(() => {
    if (!open) return;
    const el = messagesRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages, open]);

  const unreadFromAdmin = useMemo(
    () => messages.filter((m) => m.senderRole === "admin" && !m.seenByParentAt).length,
    [messages]
  );

  const lastMessageAt = messages.length ? messages[messages.length - 1]?.createdAt : undefined;

  useEffect(() => {
    if (!threadId || !open || unreadFromAdmin === 0) return;
    const unseenAdmin = messages.filter((m) => m.senderRole === "admin" && !m.seenByParentAt);
    if (unseenAdmin.length === 0) return;

    const batch = writeBatch(db);
    for (const msg of unseenAdmin) {
      batch.update(doc(db, "admin_chats", threadId, "messages", msg.id), {
        seenByParentAt: Date.now(),
        seenByParentAtServer: serverTimestamp(),
      });
    }
    batch
      .commit()
      .then(() =>
        setDoc(
          doc(db, "admin_chats", threadId),
          { unreadForParent: 0, updatedAt: Date.now(), updatedAtServer: serverTimestamp() },
          { merge: true }
        )
      )
      .catch(() => {});
  }, [db, messages, open, threadId, unreadFromAdmin]);

  async function sendMessage() {
    if (!threadId || !text.trim() || sending) return;
    setSending(true);
    try {
      const threadRef = doc(db, "admin_chats", threadId);
      const content = text.trim();

      await setDoc(
        threadRef,
        {
          parentId: threadId,
          parentEmail: user?.email ?? "",
          parentName: user?.displayName ?? "",
          status: "open",
          lastMessage: content,
          lastMessageAt: Date.now(),
          updatedAt: Date.now(),
          unreadForAdmin: increment(1),
          updatedAtServer: serverTimestamp(),
        },
        { merge: true }
      );

      await addDoc(collection(db, "admin_chats", threadId, "messages"), {
        senderRole: "parent",
        text: content,
        createdAt: Date.now(),
        createdAtServer: serverTimestamp(),
      });

      setText("");
    } finally {
      setSending(false);
    }
  }

  if (!user) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {open ? (
        <div className="w-[92vw] max-w-sm overflow-hidden rounded-2xl border bg-white shadow-2xl">
          <div className="flex items-center justify-between border-b bg-zinc-900 px-3 py-2 text-white">
            <div>
              <p className="text-sm font-medium">Skontaktuj się z adminem</p>
              <p className="text-[11px] text-white/75">
                {lastMessageAt ? `Ostatnia wiadomość: ${formatMessageDate(lastMessageAt)} ${formatMessageTime(lastMessageAt)}` : "Rozpocznij rozmowę"}
              </p>
            </div>
            <button type="button" onClick={() => setOpen(false)} className="rounded-md p-1 hover:bg-white/15">
              <X className="h-4 w-4" />
            </button>
          </div>

          <div ref={messagesRef} className="h-72 space-y-2 overflow-y-auto bg-zinc-50 p-3">
            {messages.length === 0 ? (
              <p className="text-xs text-zinc-500">Napisz wiadomość, a admin odpowie w panelu.</p>
            ) : (
              messages.map((m, idx) => {
                const prev = messages[idx - 1];
                const showDate = !prev || dayKey(prev.createdAt) !== dayKey(m.createdAt);
                const isOwn = m.senderRole === "parent";
                const showAvatar = !prev || prev.senderRole !== m.senderRole || showDate;
                const ownInitial = (user.displayName?.trim()?.[0] || user.email?.[0] || "U").toUpperCase();

                return (
                  <div key={m.id}>
                    {showDate ? (
                      <div className="my-2 text-center text-[11px] text-zinc-500">
                        {formatMessageDate(m.createdAt)}
                      </div>
                    ) : null}
                    <div className={isOwn ? "ml-auto flex w-fit items-end gap-2" : "flex w-fit items-end gap-2"}>
                      {!isOwn && showAvatar ? (
                        <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-zinc-900 text-xs font-semibold text-white">
                          A
                        </span>
                      ) : !isOwn ? (
                        <span className="inline-flex h-7 w-7 shrink-0" />
                      ) : null}
                      <div
                        className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm shadow-sm ${
                          isOwn
                            ? "bg-zinc-900 text-white"
                            : "border bg-white text-zinc-800"
                        }`}
                      >
                        <p>{m.text}</p>
                        <div className={`mt-1 text-[11px] ${isOwn ? "text-white/70" : "text-zinc-500"}`}>
                          {formatMessageTime(m.createdAt)}
                          {isOwn ? ` • ${m.seenByAdminAt ? "odczytano" : "wysłano"}` : ""}
                        </div>
                      </div>
                      {isOwn && showAvatar ? (
                        <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-full bg-zinc-200 text-xs font-semibold text-zinc-700">
                          {user.photoURL ? (
                            <img src={user.photoURL} alt="Twoje konto" className="h-full w-full object-cover" />
                          ) : (
                            ownInitial
                          )}
                        </span>
                      ) : isOwn ? (
                        <span className="inline-flex h-7 w-7 shrink-0" />
                      ) : null}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="flex gap-2 border-t p-2">
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  void sendMessage();
                }
              }}
              placeholder="Napisz wiadomość..."
              className="w-full rounded-lg border px-3 py-2 text-sm"
            />
            <Button type="button" onClick={() => void sendMessage()} disabled={sending || !text.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ) : (
        <Button type="button" className="relative rounded-full shadow-lg" onClick={() => setOpen(true)}>
          {unreadFromAdmin > 0 ? (
            <span className="absolute -right-1 -top-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[11px] text-white">
              {unreadFromAdmin > 9 ? "9+" : unreadFromAdmin}
            </span>
          ) : null}
          <MessageCircle className="mr-2 h-4 w-4" />
          Czat z adminem
        </Button>
      )}
    </div>
  );
}
