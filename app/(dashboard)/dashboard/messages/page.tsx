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
import { db } from "@/lib/firebase/client";
import { useAuth } from "@/components/auth/AuthProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send } from "lucide-react";

type ChatMessage = {
  id: string;
  text: string;
  senderRole: "parent" | "admin";
  createdAt?: number;
  seenByParentAt?: number;
  seenByAdminAt?: number;
};

export default function ParentMessagesPage() {
  const { user } = useAuth();
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const messagesRef = useRef<HTMLDivElement | null>(null);

  const threadId = useMemo(() => user?.uid ?? null, [user?.uid]);

  useEffect(() => {
    if (!threadId) return;
    const q = query(collection(db, "admin_chats", threadId, "messages"), orderBy("createdAt", "asc"), limit(200));
    const unsub = onSnapshot(
      q,
      (snap) => setMessages(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<ChatMessage, "id">) }))),
      () => setMessages([])
    );
    return () => unsub();
  }, [threadId]);

  useEffect(() => {
    const el = messagesRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!threadId) return;
    const unseen = messages.filter((m) => m.senderRole === "admin" && !m.seenByParentAt);
    if (unseen.length === 0) return;
    const batch = writeBatch(db);
    unseen.forEach((m) => {
      batch.update(doc(db, "admin_chats", threadId, "messages", m.id), {
        seenByParentAt: Date.now(),
        seenByParentAtServer: serverTimestamp(),
      });
    });
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
  }, [messages, threadId]);

  async function sendMessage() {
    if (!threadId || !text.trim() || sending) return;
    setSending(true);
    try {
      const content = text.trim();
      await setDoc(
        doc(db, "admin_chats", threadId),
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

  return (
    <div className="flex min-h-[calc(100dvh-10.5rem)] flex-col gap-4">
      <section className="rounded-2xl border bg-white p-4 shadow-sm">
        <h1 className="text-2xl font-semibold text-zinc-900">Napisz do admina</h1>
        <p className="mt-2 text-sm text-zinc-600">Szybki kontakt z administracją w jednym miejscu.</p>
      </section>
      <div className="grid min-h-0 flex-1 grid-rows-[1fr_auto] rounded-2xl border bg-white shadow-sm">
        <div ref={messagesRef} className="min-h-0 space-y-2 overflow-y-auto bg-zinc-50 p-3">
          {messages.length === 0 ? (
            <p className="text-sm text-zinc-500">Brak wiadomości. Napisz pierwszą wiadomość.</p>
          ) : (
            messages.map((m) => {
              const isOwn = m.senderRole === "parent";
              return (
                <div key={m.id} className={isOwn ? "ml-auto w-fit max-w-[85%]" : "w-fit max-w-[85%]"}>
                  <div className={`rounded-2xl px-3 py-2 text-sm ${isOwn ? "bg-zinc-900 text-white" : "border bg-white text-zinc-800"}`}>
                    <p>{m.text}</p>
                    <div className={`mt-1 text-[11px] ${isOwn ? "text-white/70" : "text-zinc-500"}`}>
                      {m.createdAt ? new Date(m.createdAt).toLocaleString("pl-PL") : "teraz"}
                      {isOwn ? ` • ${m.seenByAdminAt ? "odczytano" : "wysłano"}` : ""}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
        <div className="flex gap-2 border-t p-3">
          <Input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                void sendMessage();
              }
            }}
            placeholder="Napisz wiadomość do admina..."
          />
          <Button type="button" onClick={() => void sendMessage()} disabled={sending || !text.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
