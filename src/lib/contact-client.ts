import type { ContactErrors, ContactPayload } from "@/lib/contact-schema";

const ENDPOINT = process.env.NEXT_PUBLIC_CONTACT_ENDPOINT ?? "/contact.php";

/** Must stay above TOKEN_MIN_AGE in public/contact.php (3 s). */
const MIN_TOKEN_AGE_MS = 3500;

export type FormToken = { value: string; issuedAt: number };

export type SubmitResult =
  | { kind: "sent" }
  | { kind: "invalid"; errors: ContactErrors }
  | { kind: "failed"; message?: string };

type ServerReply = {
  ok?: boolean;
  code?: string;
  error?: string;
  token?: string;
  errors?: ContactErrors;
};

async function post(body: unknown): Promise<{ status: number; json: ServerReply }> {
  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    cache: "no-store",
    body: JSON.stringify(body),
  });
  const json = (await res.json().catch(() => ({}))) as ServerReply;
  return { status: res.status, json };
}

export async function requestToken(): Promise<FormToken> {
  const { status, json } = await post({ action: "token" });
  if (status !== 200 || typeof json.token !== "string") throw new Error("token unavailable");
  return { value: json.token, issuedAt: Date.now() };
}

async function waitUntilUsable(token: FormToken) {
  const remaining = token.issuedAt + MIN_TOKEN_AGE_MS - Date.now();
  if (remaining > 0) await new Promise((resolve) => setTimeout(resolve, remaining));
}

/**
 * Sends the enquiry. `getToken` is called again with `fresh = true` when the
 * server reports an expired/unknown token, so a tab left open for hours still works.
 */
export async function submitContact(
  data: ContactPayload,
  getToken: (fresh: boolean) => Promise<FormToken>,
): Promise<SubmitResult> {
  for (let attempt = 0; attempt < 2; attempt++) {
    const token = await getToken(attempt > 0);
    await waitUntilUsable(token);
    const { status, json } = await post({ ...data, token: token.value });

    if (status === 200 && json.ok) return { kind: "sent" };
    if (status === 422 && json.errors) return { kind: "invalid", errors: json.errors };
    if (status === 400 && json.code?.startsWith("token_")) continue;
    return { kind: "failed", message: status === 429 ? json.error : undefined };
  }
  return { kind: "failed" };
}
