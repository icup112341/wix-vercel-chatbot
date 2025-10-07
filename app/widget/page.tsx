"use client";
import { useRef, useState, useEffect } from "react";

type Msg = { role: "user" | "assistant"; content: string };

export default function WidgetPage() {
  const [messages, setMessages] = useState<Msg[]>([
    { role: "assistant", content: "Hi! Ask me anything." }
  ]);
  const [input, setInput] = useState("");
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    boxRef.current?.scrollTo({ top: boxRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  async function send() {
    const text = input.trim();
    if (!text) return;
    setInput("");

    const next = [...messages, { role: "user", content: text } as const];
    setMessages(next);

    // If you call from Wix JS (not iframe), use the full URL:
    // const API_URL = "https://wix-vercel-chatbot.vercel.app/api/chat";
    const API_URL = "/api/chat";

    try {
      const resp = await fetch(API_URL, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ messages: next })
      });

      // Surface server/upstream errors (e.g., 429 insufficient_quota)
      if (!resp.ok) {
        const detail = await resp.text().catch(() => "");
        setMessages([
          ...next,
          { role: "assistant", content: `Error ${resp.status}: ${detail || "request failed"}` }
        ]);
        return;
      }

      const data = await resp.json();
      const content =
        data?.choices?.[0]?.message?.content ??
        data?.message?.content ??
        "(no content)";

      setMessages([...next, { role: "assistant", content }]);
    } catch (e: any) {
      setMessages([
        ...next,
        { role: "assistant", content: `Network error: ${String(e?.message || e)}` }
      ]);
    }
  }

  return (
    <main style={{ maxWidth: 720, margin: "40px auto", padding: 16, color: "white", fontFamily: "Inter, system-ui, sans-serif" }}>
      <div ref={boxRef} style={{ height: 420, overflowY: "auto", padding: 12, borderRadius: 12, background: "#111827" }}>
        {messages.map((m, i) => (
          <div key={i} style={{ margin: "12px 0" }}>
            <div style={{ opacity: 0.7, fontWeight: 600 }}>{m.role === "user" ? "You" : "Wabot"}</div>
            <div style={{ whiteSpace: "pre-wrap" }}>{m.content}</div>
          </div>
        ))}
      </div>
      <form onSubmit={(e) => { e.preventDefault(); send(); }} style={{ marginTop: 12, display: "flex", gap: 8 }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your question…"
          style={{ flex: 1, padding: "10px 12px", borderRadius: 8, border: "1px solid #374151", background: "#0b1220", color: "white" }}
        />
        <button type="submit" style={{ padding: "10px 14px", borderRadius: 8, background: "#2563eb", color: "white", border: 0 }}>
          Send
        </button>
      </form>
    </main>
  );
}
