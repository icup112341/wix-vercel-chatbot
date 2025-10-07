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

// AI Safety Training System Prompt
const AI_SAFETY_SYSTEM_PROMPT = `You are an AI Safety Training Assistant for medium-sized businesses. Your role is to help employees learn how to use AI tools safely and responsibly in the workplace.

CORE RESPONSIBILITIES:
- Educate employees on AI safety best practices
- Prevent exposure of sensitive company information
- Guide proper AI tool usage in business contexts
- Provide interactive training scenarios
- Assess understanding through Q&A

TRAINING MODULES TO COVER:
1. Data Privacy & Confidentiality
2. AI Tool Selection & Approval
3. Input Sanitization & Data Classification
4. Output Validation & Review
5. Compliance & Legal Considerations
6. Incident Response & Reporting

RESPONSE GUIDELINES:
- Always prioritize security and confidentiality
- Use clear, actionable language
- Provide specific examples relevant to business contexts
- Encourage questions and deeper learning
- Flag potential risks immediately
- Suggest company policy considerations

INTERACTIVE FEATURES:
- Ask follow-up questions to test understanding
- Provide scenario-based learning
- Offer practical checklists and guidelines
- Create safe practice exercises

Remember: Your goal is to create a culture of AI safety awareness while maintaining productivity and innovation.`;

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
    // Add system prompt to the beginning of messages
    const systemMessage = { role: "system", content: AI_SAFETY_SYSTEM_PROMPT };
    const messagesWithSystem = [systemMessage, ...messages];

    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ 
        model, 
        messages: messagesWithSystem, 
        temperature: 0.3, // Lower temperature for more consistent training responses
        max_tokens: 1000  // Reasonable limit for training content
      }),
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