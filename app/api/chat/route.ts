// Minimal OpenAI proxy with streaming for Wix widget
export async function POST(req: Request): Promise<Response> {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return new Response("Bad request: invalid JSON", { status: 400 });
  }

  const { messages, model = "gpt-4o-mini" } = body ?? {};
  if (!Array.isArray(messages)) {
    return new Response("Bad request: expected { messages: [...] }", { status: 400 });
  }

  const apiKey = process.env.OPENAI_API_KEY ?? "";
  if (!apiKey) {
    return new Response("Server misconfigured: missing OPENAI_API_KEY", { status: 500 });
  }

  const upstream = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model,
      stream: true,
      messages
    })
  });

  if (!upstream.ok || !upstream.body) {
    const text = await upstream.text();
    return new Response(text || "OpenAI upstream error", { status: 502 });
  }

  // Stream SSE directly back to the client (TS-safe)
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const reader = upstream.body!.getReader();
      (async () => {
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) {
              controller.close();
              break;
            }
            if (value) controller.enqueue(value);
          }
        } catch (err) {
          controller.error(err);
        }
      })();
    },
    cancel() {
      try { upstream.body?.cancel(); } catch {}
    }
  });

  return new Response(stream, {
    status: 200,
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      "Connection": "keep-alive"
    }
  });
}
