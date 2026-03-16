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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send } from "lucide-react";

type ChatThread = {
  id: string;
  parentName?: string;
  parentEmail?: string;
  lastMessage?: string;
  updatedAt?: number;
  unreadForAdmin?: number;
};

type ChatMessage = {
  id: string;
  text: string;
  senderRole: "parent" | "admin";
  createdAt?: number;
  seenByParentAt?: number;
  seenByAdminAt?: number;
};

export default function AdminChatsPage() {
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [messageText, setMessageText] = useState("");
  const [sending, setSending] = useState(false);
  const messagesRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const q = query(collection(db, "admin_chats"), orderBy("updatedAt", "desc"));
    const unsub = onSnapshot(
      q,
      (snap) => {
        const rows = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<ChatThread, "id">) }));
        setThreads(rows);
        if (!selectedThreadId && rows.length > 0) {
          setSelectedThreadId(rows[0].id);
        }
      },
      () => setThreads([])
    );
    return () => unsub();
  }, [selectedThreadId]);

  useEffect(() => {
    if (!selectedThreadId) {
      setMessages([]);
      return;
    }
    const q = query(
      collection(db, "admin_chats", selectedThreadId, "messages"),
      orderBy("createdAt", "asc"),
      limit(200)
    );
    const unsub = onSnapshot(
      q,
      (snap) => setMessages(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<ChatMessage, "id">) }))),
      () => setMessages([])
    );
    return () => unsub();
  }, [selectedThreadId]);

  useEffect(() => {
    const el = messagesRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages, selectedThreadId]);

  useEffect(() => {
    if (!selectedThreadId || messages.length === 0) return;
    const unseenFromParent = messages.filter((m) => m.senderRole === "parent" && !m.seenByAdminAt);
    if (unseenFromParent.length === 0) return;
    const batch = writeBatch(db);
    unseenFromParent.forEach((m) => {
      batch.update(doc(db, "admin_chats", selectedThreadId, "messages", m.id), {
        seenByAdminAt: Date.now(),
        seenByAdminAtServer: serverTimestamp(),
      });
    });
    batch
      .commit()
      .then(() =>
        setDoc(
          doc(db, "admin_chats", selectedThreadId),
          { unreadForAdmin: 0, updatedAt: Date.now(), updatedAtServer: serverTimestamp() },
          { merge: true }
        )
      )
      .catch(() => {});
  }, [messages, selectedThreadId]);

  async function sendAdminMessage() {
    if (!selectedThreadId || !messageText.trim() || sending) return;
    setSending(true);
    try {
      const content = messageText.trim();
      const thread = threads.find((t) => t.id === selectedThreadId);
      await addDoc(collection(db, "admin_chats", selectedThreadId, "messages"), {
        senderRole: "admin",
        text: content,
        createdAt: Date.now(),
        createdAtServer: serverTimestamp(),
      });
      await setDoc(
        doc(db, "admin_chats", selectedThreadId),
        {
          parentId: selectedThreadId,
          parentEmail: thread?.parentEmail || "",
          parentName: thread?.parentName || "",
          status: "open",
          lastMessage: content,
          lastMessageAt: Date.now(),
          updatedAt: Date.now(),
          unreadForParent: increment(1),
          updatedAtServer: serverTimestamp(),
        },
        { merge: true }
      );
      setMessageText("");
    } finally {
      setSending(false);
    }
  }

  const unreadThreads = useMemo(() => threads.filter((t) => Number(t.unreadForAdmin ?? 0) > 0).length, [threads]);
  const unreadMessages = useMemo(
    () => threads.reduce((sum, t) => sum + Number(t.unreadForAdmin ?? 0), 0),
    [threads]
  );
  const selectedThread = useMemo(
    () => threads.find((t) => t.id === selectedThreadId) ?? null,
    [threads, selectedThreadId]
  );

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border bg-white p-4 shadow-sm">
        <h1 className="text-2xl font-semibold text-zinc-900">Chaty z rodzicami</h1>
        <div className="mt-2 text-sm text-zinc-600">
          Nieodczytane wątki: <span className="font-medium">{unreadThreads}</span> • Nieodczytane wiadomości:{" "}
          <span className="font-medium">{unreadMessages}</span>
        </div>
      </section>
      <div className="grid gap-4 lg:grid-cols-[360px_1fr]">
        <div className="rounded-2xl border bg-white shadow-sm">
          <div className="divide-y">
            {threads.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setSelectedThreadId(t.id)}
                className={`flex w-full items-center justify-between gap-3 px-4 py-3 text-left hover:bg-zinc-50 ${
                  selectedThreadId === t.id ? "bg-zinc-50" : ""
                }`}
              >
                <div>
                  <div className="font-medium">{t.parentName || t.parentEmail || t.id}</div>
                  <div className="text-sm text-zinc-600">{t.lastMessage || "Brak wiadomości"}</div>
                </div>
                <div className="text-right text-xs text-zinc-500">
                  <div>{t.updatedAt ? new Date(t.updatedAt).toLocaleString("pl-PL") : "—"}</div>
                  {(t.unreadForAdmin ?? 0) > 0 ? (
                    <span className="mt-1 inline-flex rounded-full bg-red-100 px-2 py-0.5 text-red-700">
                      nieodczytane: {t.unreadForAdmin}
                    </span>
                  ) : null}
                </div>
              </button>
            ))}
            {threads.length === 0 ? <div className="px-4 py-6 text-sm text-zinc-500">Brak chatów.</div> : null}
          </div>
        </div>
        <div className="rounded-2xl border bg-white shadow-sm">
          {selectedThread ? (
            <>
              <div className="border-b px-4 py-3">
                <div className="font-medium">{selectedThread.parentName || selectedThread.parentEmail || selectedThread.id}</div>
                <div className="text-xs text-zinc-500">Wątek: {selectedThread.id}</div>
              </div>
              <div ref={messagesRef} className="h-[480px] space-y-2 overflow-y-auto bg-zinc-50 p-3">
                {messages.length === 0 ? (
                  <div className="text-sm text-zinc-500">Brak wiadomości.</div>
                ) : (
                  messages.map((m) => {
                    const isAdmin = m.senderRole === "admin";
                    return (
                      <div key={m.id} className={isAdmin ? "ml-auto w-fit max-w-[85%]" : "w-fit max-w-[85%]"}>
                        <div className={`rounded-2xl px-3 py-2 text-sm ${isAdmin ? "bg-zinc-900 text-white" : "border bg-white text-zinc-800"}`}>
                          <p>{m.text}</p>
                          <div className={`mt-1 text-[11px] ${isAdmin ? "text-white/70" : "text-zinc-500"}`}>
                            {m.createdAt ? new Date(m.createdAt).toLocaleString("pl-PL") : "teraz"}
                            {isAdmin ? ` • ${m.seenByParentAt ? "odczytano" : "wysłano"}` : ""}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
              <div className="flex gap-2 border-t p-3">
                <Input
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      void sendAdminMessage();
                    }
                  }}
                  placeholder="Napisz odpowiedź jako admin..."
                />
                <Button type="button" onClick={() => void sendAdminMessage()} disabled={sending || !messageText.trim()}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </>
          ) : (
            <div className="px-4 py-6 text-sm text-zinc-500">Wybierz czat z listy.</div>
          )}
        </div>
      </div>
    </div>
  );
}
