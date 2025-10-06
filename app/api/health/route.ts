import { NextResponse } from "next/server";
export const runtime = "nodejs";
export function GET() {
  return NextResponse.json({ ok: true, hasKey: !!process.env.OPENAI_API_KEY });
}
