"use client";
import { useEffect, useRef, useState } from "react";

type Msg = { role: "user" | "assistant"; content: string };

export default function Widget() {
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

    const next = [...messages, { role: "user", content: text }];
    setMessages(next);

    const resp = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: next.map(m => ({ role: m.role, content: m.content }))
      })
    });

    if (!resp.ok || !resp.body) {
      setMessages(prev => [...prev, { role: "assistant", content: "Server error." }]);
      return;
    }

    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    let assistant = "";
    setMessages(prev => [...prev, { role: "assistant", content: "" }]);

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value, { stream: true });
      for (const line of chunk.split("\n")) {
        if (!line.startsWith("data:")) continue;
        const data = line.slice(5).trim();
        if (!data || data === "[DONE]") continue;
        try {
          const j = JSON.parse(data);
          const delta = j.choices?.[0]?.delta?.content;
          if (delta) {
            assistant += delta;
            setMessages(prev => {
              const copy = [...prev];
              copy[copy.length - 1] = { role: "assistant", content: assistant };
              return copy;
            });
          }
        } catch {}
      }
    }
  }

  return (
    <div style={{
      height:"100vh", display:"grid", gridTemplateRows:"1fr auto",
      background:"#0b0f19", color:"#e5e7eb", fontFamily:"Inter,system-ui,sans-serif"
    }}>
      <div ref={boxRef} style={{ overflowY:"auto", padding:16 }}>
        {messages.map((m, i) => (
          <div key={i} style={{
            background: m.role === "user" ? "#1a2333" : "#0f172a",
            border:"1px solid #263044", borderRadius:12, padding:"12px 14px",
            marginBottom:8, whiteSpace:"pre-wrap"
          }}>
            <div style={{ opacity:.6, fontWeight:600 }}>{m.role === "user" ? "You" : "Wabot"}</div>
            {m.content}
          </div>
        ))}
      </div>
      <div style={{ display:"flex", gap:8, padding:12, borderTop:"1px solid #263044" }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => (e.key === "Enter" ? send() : undefined)}
          placeholder="Type your question…"
          style={{
            flex:1, padding:"12px 14px", borderRadius:12,
            border:"1px solid #263044", background:"#0f172a",
            color:"#e5e7eb", outline:"none"
          }}
        />
        <button onClick={send} style={{
          padding:"12px 16px", borderRadius:12, border:"1px solid #263044",
          background:"#1a2333", color:"#e5e7eb", cursor:"pointer"
        }}>Send</button>
      </div>
    </div>
  );
}
