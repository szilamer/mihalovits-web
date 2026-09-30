import { NextResponse } from "next/server";
import { validateContact, type ContactPayload } from "@/lib/contact-schema";

/** Used only by `next dev`. Production static hosting uses /contact.php. */
export const dynamic = "force-static";

/**
 * Contact form endpoint. Currently validates and acknowledges the request;
 * wire `deliver()` to an e-mail provider (e.g. Resend) or CRM before launch.
 */
export async function POST(req: Request) {
  let body: Partial<ContactPayload>;
  try {
    body = (await req.json()) as Partial<ContactPayload>;
  } catch {
    return NextResponse.json({ ok: false, error: "Hibás kérés." }, { status: 400 });
  }

  // Honeypot: bots fill every field, humans never see this one.
  if (body.company) {
    return NextResponse.json({ ok: true });
  }

  const errors = validateContact(body);
  if (Object.keys(errors).length > 0) {
    return NextResponse.json({ ok: false, errors }, { status: 422 });
  }

  await deliver(body as ContactPayload);
  return NextResponse.json({ ok: true });
}

async function deliver(payload: ContactPayload) {
  // Placeholder transport – replace with a real integration.
  console.info("[contact] new enquiry", {
    name: payload.name,
    topic: payload.topic,
    at: new Date().toISOString(),
  });
}
