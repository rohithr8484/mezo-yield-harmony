import React, { useState, useRef, useEffect, useCallback } from "react";
import { MessageCircle, X, Send, Bot, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Msg = { role: "user" | "assistant"; content: string };

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/governance-chat`;

const WELCOME = `👋 Hey! I'm the **Mezo Governance Agent**.

Ask me anything about governance — who participates, how voting works, proposal types, veMEZO boosts, and more!`;

export default function GovernanceChatBot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([
    { role: "assistant", content: WELCOME },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  const send = useCallback(async () => {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg: Msg = { role: "user", content: text };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    let assistantSoFar = "";
    const allMessages = [...messages, userMsg];

    try {
      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: allMessages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      if (!resp.ok || !resp.body) {
        const err = await resp.json().catch(() => ({ error: "Failed" }));
        throw new Error(err.error || "Request failed");
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        let idx: number;
        while ((idx = buffer.indexOf("\n")) !== -1) {
          let line = buffer.slice(0, idx);
          buffer = buffer.slice(idx + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line.startsWith("data: ")) continue;
          const json = line.slice(6).trim();
          if (json === "[DONE]") break;
          try {
            const parsed = JSON.parse(json);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              assistantSoFar += content;
              setMessages((prev) => {
                const last = prev[prev.length - 1];
                if (last?.role === "assistant" && prev.length > 1 && prev[prev.length - 2]?.role === "user") {
                  return prev.map((m, i) =>
                    i === prev.length - 1
                      ? { ...m, content: assistantSoFar }
                      : m
                  );
                }
                return [...prev, { role: "assistant", content: assistantSoFar }];
              });
            }
          } catch {
            buffer = line + "\n" + buffer;
            break;
          }
        }
      }
    } catch (e: any) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `⚠️ ${e.message || "Something went wrong. Please try again."}`,
        },
      ]);
    } finally {
      setLoading(false);
    }
  }, [input, loading, messages]);

  return (
    <>
      {/* Floating bubble */}
      <button
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full shadow-lg transition-all duration-300 hover:scale-110",
          "bg-gradient-to-br from-primary to-accent text-white",
          open && "scale-0 opacity-0 pointer-events-none"
        )}
        aria-label="Open governance chat"
      >
        <MessageCircle className="h-6 w-6" />
      </button>

      {/* Chat panel */}
      <div
        className={cn(
          "fixed bottom-6 right-6 z-50 flex w-[380px] flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl transition-all duration-300",
          open
            ? "h-[520px] opacity-100 scale-100"
            : "h-0 opacity-0 scale-95 pointer-events-none"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between bg-gradient-to-r from-primary to-accent px-4 py-3">
          <div className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-white" />
            <div>
              <p className="text-sm font-semibold text-white">
                Governance Agent
              </p>
              <p className="text-[10px] text-white/70">
                Powered by Lovable AI
              </p>
            </div>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="rounded-full p-1 text-white/80 hover:bg-white/20 hover:text-white transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
          {messages.map((m, i) => (
            <div
              key={i}
              className={cn(
                "flex gap-2",
                m.role === "user" ? "justify-end" : "justify-start"
              )}
            >
              {m.role === "assistant" && (
                <div className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
                  <Bot className="h-3.5 w-3.5" />
                </div>
              )}
              <div
                className={cn(
                  "max-w-[80%] rounded-2xl px-3 py-2 text-sm leading-relaxed whitespace-pre-wrap",
                  m.role === "user"
                    ? "bg-primary text-primary-foreground rounded-br-md"
                    : "bg-muted text-foreground rounded-bl-md"
                )}
              >
                {m.content}
              </div>
              {m.role === "user" && (
                <div className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent/15 text-accent">
                  <User className="h-3.5 w-3.5" />
                </div>
              )}
            </div>
          ))}
          {loading && (
            <div className="flex gap-2">
              <div className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
                <Bot className="h-3.5 w-3.5" />
              </div>
              <div className="flex items-center gap-1 rounded-2xl bg-muted px-4 py-2 rounded-bl-md">
                <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/40 [animation-delay:0ms]" />
                <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/40 [animation-delay:150ms]" />
                <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/40 [animation-delay:300ms]" />
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="border-t border-border px-3 py-2">
          <form
            className="flex items-center gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              send();
            }}
          >
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about governance..."
              className="flex-1 rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground"
              disabled={loading}
            />
            <Button
              type="submit"
              size="icon"
              disabled={!input.trim() || loading}
              className="h-9 w-9 rounded-xl"
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
          <p className="mt-1 text-center text-[10px] text-muted-foreground">
            Ask about proposals, voting, veMEZO, delegates & more
          </p>
        </div>
      </div>
    </>
  );
}
