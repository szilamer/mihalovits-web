import { NextResponse } from "next/server";
import { validateContact, type ContactPayload } from "@/lib/contact-schema";

/**
 * Used only by `next dev` (next.config.ts rewrites /contact.php here).
 * Production is served by public/contact.php, which also enforces the signed
 * time-trap token, rate limits and origin checks that this mock skips.
 */
export const dynamic = "force-static";

export async function POST(req: Request) {
  let body: Partial<ContactPayload> & { action?: string };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ ok: false, code: "bad_request", error: "Hibás kérés." }, { status: 400 });
  }

  if (body.action === "token") {
    return NextResponse.json({ ok: true, token: `dev.${Date.now()}` });
  }

  if (body.company) {
    return NextResponse.json({ ok: true });
  }

  const errors = validateContact(body);
  if (Object.keys(errors).length > 0) {
    return NextResponse.json({ ok: false, errors }, { status: 422 });
  }

  console.info("[contact:dev] enquiry accepted (not sent)", { topic: body.topic, at: new Date().toISOString() });
  return NextResponse.json({ ok: true });
}
