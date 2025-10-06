// app/api/chat/route.ts
import { NextResponse } from "next/server";

export const runtime = "nodejs";        // avoid Edge pitfalls
export const dynamic = "force-dynamic"; // no caching

const ALLOWED_ORIGINS = [
  "https://your-site.wixsite.com",   // your published Wix URL
  "https://*.wixsite.com",
  "https://editor.wix.com",
  "https://*.wixstudio.io",
  "https://your-custom-domain.com"   // if you have one
];

function cors(origin: string | null) {
  const ok =
    !!origin &&
    ALLOWED_ORIGINS.some((p) =>
      p.includes("*") ? origin.endsWith(p.replace("*.", "")) : origin === p
    );

  const headers: Record<string, string> = {
    Vary: "Origin",
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Allow-Headers": "content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Origin": ok ? origin! : ALLOWED_ORIGINS[0],
  };
  return headers;
}

export async function OPTIONS(req: Request) {
  return new Response(null, { headers: cors(req.headers.get("origin")) });
}

export async function POST(req: Request) {
  const headers = cors(req.headers.get("origin"));

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON" }, { status: 400, headers });
  }

  const { messages, model = "gpt-4o-mini" } = body ?? {};
  if (!Array.isArray(messages)) {
    return NextResponse.json({ error: "expected { messages: [...] }" }, { status: 400, headers });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.error("Missing OPENAI_API_KEY");
    return NextResponse.json({ error: "server misconfiguration" }, { status: 500, headers });
  }

  try {
    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ model, messages, temperature: 0.4 }),
    });

    const text = await r.text();
    if (!r.ok) {
      console.error("OpenAI upstream error:", r.status, text);
      return NextResponse.json({ error: "upstream", status: r.status, detail: text }, { status: 502, headers });
    }

    // Pass through JSON
    return new Response(text, {
      status: 200,
      headers: { ...headers, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Handler crash:", err);
    return NextResponse.json({ error: "unhandled server error" }, { status: 500, headers });
  }
}
