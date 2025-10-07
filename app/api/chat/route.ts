// app/api/chat/route.ts
import { NextResponse } from "next/server";

export const runtime = "nodejs";        // avoid Edge pitfalls
export const dynamic = "force-dynamic"; // no caching

// IMPORTANT: no trailing slashes in origins
const ALLOWED_ORIGINS = [
  "https://wix-vercel-chatbot.vercel.app", // your Vercel app (fallback)
  "https://editor.wix.com",                // Wix Editor / Preview
  "https://*.wixsite.com",                 // Wix published sites
  "https://*.wixstudio.io",                // Wix Studio (if used)
  // "https://your-custom-domain.com"       // <- uncomment if you have one
];

// Robust CORS helper: supports wildcards like https://*.wixsite.com
function cors(origin: string | null) {
  let allow = false;

  if (origin) {
    try {
      const u = new URL(origin);
      const host = u.hostname;

      allow = ALLOWED_ORIGINS.some((p) => {
        if (p.includes("*")) {
          // e.g. "https://*.wixsite.com" -> "wixsite.com"
          const suffix = p.replace(/^https?:\/\/\*\./, "");
          return host.endsWith(suffix);
        }
        // exact origin match
        return origin === p;
      });
    } catch {
      // invalid Origin header -> disallow
    }
  }

  const headers: Record<string, string> = {
    Vary: "Origin",
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Allow-Headers": "content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Origin": allow ? (origin as string) : ALLOWED_ORIGINS[0],
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
  return NextResponse.json(
    { error: "upstream", status: r.status, detail: text },
    { status: r.status, headers }
  );
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
