"use client";

import Link from "next/link";
import { useRef, useState, type FormEvent } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowUpRight, CheckCircle, WarningCircle } from "@phosphor-icons/react";
import { requestToken, submitContact, type FormToken } from "@/lib/contact-client";
import {
  validateContact,
  type ContactErrors,
  type ContactPayload,
} from "@/lib/contact-schema";

type Status = "idle" | "submitting" | "success" | "error";

const initial: ContactPayload = {
  name: "",
  email: "",
  phone: "",
  topic: "",
  message: "",
  consent: false,
  company: "",
};

const ease = [0.32, 0.72, 0, 1] as const;

const fieldBase =
  "w-full rounded-2xl bg-paper px-4 py-3.5 text-[15px] text-ink placeholder:text-muted-soft ring-1 transition-[box-shadow,background-color] duration-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky";

function Field({
  id,
  label,
  error,
  hint,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-[13px] font-medium tracking-tight text-ink">
        {label}
      </label>
      {children}
      {error ? (
        <p id={`${id}-error`} role="alert" className="flex items-center gap-1.5 text-[12.5px] text-[#b4432f]">
          <WarningCircle size={14} weight="fill" /> {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="text-[12px] text-muted-soft">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

type ContactFormProps = {
  topics: string[];
  defaultTopic?: string;
  phone: string;
  phoneHref: string;
  texts: { successTitle: string; successText: string; responseNote: string };
};

export function ContactForm({ topics, defaultTopic, phone, phoneHref, texts }: ContactFormProps) {
  const [data, setData] = useState<ContactPayload>({ ...initial, topic: defaultTopic ?? "" });
  const [errors, setErrors] = useState<ContactErrors>({});
  const [status, setStatus] = useState<Status>("idle");
  const [failure, setFailure] = useState<string | undefined>();
  const token = useRef<Promise<FormToken> | null>(null);

  // Requested on first interaction so the server-side time trap measures real typing time.
  const getToken = (fresh = false) => {
    if (fresh || !token.current) {
      token.current = requestToken().catch((err: unknown) => {
        token.current = null;
        throw err;
      });
    }
    return token.current;
  };

  const update = <K extends keyof ContactPayload>(key: K, value: ContactPayload[K]) => {
    setData((d) => ({ ...d, [key]: value }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }));
  };

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const v = validateContact(data);
    setErrors(v);
    if (Object.keys(v).length > 0) {
      const first = document.querySelector<HTMLElement>("[aria-invalid='true']");
      first?.focus();
      return;
    }
    setStatus("submitting");
    setFailure(undefined);
    try {
      const result = await submitContact(data, getToken);
      if (result.kind === "sent") {
        token.current = null;
        setStatus("success");
      } else if (result.kind === "invalid") {
        setErrors(result.errors);
        setStatus("idle");
      } else {
        setFailure(result.message);
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  }

  const invalid = (k: keyof ContactPayload) => (errors[k] ? "ring-[#b4432f]/60" : "ring-ink/10");

  return (
    <div className="rounded-[2rem] bg-ink/5 p-2 ring-1 ring-ink/6">
      <div className="relative overflow-hidden rounded-[calc(2rem-0.5rem)] bg-white p-6 shadow-ambient sm:p-8">
        <AnimatePresence mode="wait" initial={false}>
          {status === "success" ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease }}
              className="flex min-h-[420px] flex-col items-start justify-center"
            >
              <span className="arch grid h-16 w-12 place-items-end justify-items-center bg-sky pb-3 text-ink">
                <CheckCircle size={26} weight="bold" />
              </span>
              <h3 className="mt-6 font-display text-3xl font-medium tracking-tight text-ink">
                {texts.successTitle}
              </h3>
              <p className="mt-3 max-w-[46ch] text-[15px] leading-relaxed text-muted">
                {texts.successText}
              </p>
              <button
                type="button"
                onClick={() => {
                  setData({ ...initial, topic: defaultTopic ?? "" });
                  setStatus("idle");
                }}
                className="mt-8 text-[13.5px] font-medium text-sky-deep underline-offset-4 hover:underline"
              >
                Új üzenet írása
              </button>
            </motion.div>
          ) : (
            <motion.form
              key="form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.5, ease }}
              onSubmit={onSubmit}
              onFocusCapture={() => void getToken().catch(() => undefined)}
              noValidate
              className="grid gap-5"
            >
              <div className="grid gap-5 sm:grid-cols-2">
                <Field id="name" label="Teljes név" error={errors.name}>
                  <input
                    id="name"
                    name="name"
                    autoComplete="name"
                    maxLength={120}
                    value={data.name}
                    onChange={(e) => update("name", e.target.value)}
                    aria-invalid={!!errors.name}
                    aria-describedby={errors.name ? "name-error" : undefined}
                    className={`${fieldBase} ${invalid("name")}`}
                    placeholder="Példa Katalin"
                  />
                </Field>
                <Field id="email" label="E-mail cím" error={errors.email}>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    maxLength={254}
                    value={data.email}
                    onChange={(e) => update("email", e.target.value)}
                    aria-invalid={!!errors.email}
                    aria-describedby={errors.email ? "email-error" : undefined}
                    className={`${fieldBase} ${invalid("email")}`}
                    placeholder="nev@ceg.hu"
                  />
                </Field>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <Field id="phone" label="Telefonszám" error={errors.phone} hint="Opcionális – sürgős ügyben gyorsabb egyeztetéshez.">
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    autoComplete="tel"
                    maxLength={40}
                    value={data.phone}
                    onChange={(e) => update("phone", e.target.value)}
                    aria-invalid={!!errors.phone}
                    aria-describedby={errors.phone ? "phone-error" : "phone-hint"}
                    className={`${fieldBase} ${invalid("phone")}`}
                    placeholder="+36 30 123 4567"
                  />
                </Field>
                <Field id="topic" label="Miben segíthetek?" error={errors.topic}>
                  <div className="relative">
                    <select
                      id="topic"
                      name="topic"
                      value={data.topic}
                      onChange={(e) => update("topic", e.target.value)}
                      aria-invalid={!!errors.topic}
                      aria-describedby={errors.topic ? "topic-error" : undefined}
                      className={`${fieldBase} ${invalid("topic")} appearance-none pr-10`}
                    >
                      <option value="">Válasszon témát…</option>
                      {topics.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                    <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-muted" aria-hidden>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="m6 9 6 6 6-6" />
                      </svg>
                    </span>
                  </div>
                </Field>
              </div>

              <Field id="message" label="Az ügy rövid leírása" error={errors.message} hint="Az üzenet tartalmát ügyvédi titok védi.">
                <textarea
                  id="message"
                  name="message"
                  rows={5}
                  maxLength={4000}
                  value={data.message}
                  onChange={(e) => update("message", e.target.value)}
                  aria-invalid={!!errors.message}
                  aria-describedby={errors.message ? "message-error" : "message-hint"}
                  className={`${fieldBase} ${invalid("message")} resize-y`}
                  placeholder="Írja le röviden, milyen ügyben keres, és mikor lenne alkalmas az egyeztetés."
                />
              </Field>

              {/* Honeypot – visually hidden, ignored by humans */}
              <div className="absolute -left-[9999px] top-auto h-px w-px overflow-hidden" aria-hidden>
                <label htmlFor="company">Cég</label>
                <input
                  id="company"
                  name="company"
                  tabIndex={-1}
                  autoComplete="off"
                  value={data.company}
                  onChange={(e) => update("company", e.target.value)}
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="flex items-start gap-3 text-[13px] leading-snug text-muted">
                  <input
                    type="checkbox"
                    name="consent"
                    checked={data.consent}
                    onChange={(e) => update("consent", e.target.checked)}
                    aria-invalid={!!errors.consent}
                    className="mt-0.5 size-4 shrink-0 rounded border-ink/20 accent-sky-deep"
                  />
                  <span>
                    Elolvastam és elfogadom az{" "}
                    <Link href="/adatkezeles" className="font-medium text-ink underline decoration-sky decoration-2 underline-offset-4">
                      adatkezelési tájékoztatót
                    </Link>
                    , és hozzájárulok adataim kapcsolatfelvétel céljából történő kezeléséhez.
                  </span>
                </label>
                {errors.consent && (
                  <p role="alert" className="flex items-center gap-1.5 text-[12.5px] text-[#b4432f]">
                    <WarningCircle size={14} weight="fill" /> {errors.consent}
                  </p>
                )}
              </div>

              {status === "error" && (
                <div role="alert" className="flex items-start gap-3 rounded-2xl bg-[#fdf1ee] px-4 py-3 text-[13.5px] text-[#8f3423] ring-1 ring-[#b4432f]/20">
                  <WarningCircle size={18} weight="fill" className="mt-0.5 shrink-0" />
                  <p>
                    {failure ?? "Az üzenet küldése nem sikerült. Kérem, próbálja újra."} Sürgős ügyben
                    hívjon a{" "}
                    <a href={phoneHref} className="font-semibold underline underline-offset-2">
                      {phone}
                    </a>{" "}
                    számon.
                  </p>
                </div>
              )}

              <div className="mt-2 flex flex-col-reverse items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-[12px] text-muted-soft">{texts.responseNote}</p>
                <button
                  type="submit"
                  disabled={status === "submitting"}
                  className="group relative inline-flex h-13 items-center gap-4 rounded-full bg-ink pl-6 pr-2 text-[15px] font-medium text-white transition-[background-color,transform] duration-500 ease-soft hover:bg-ink-700 active:scale-[0.98] disabled:cursor-wait disabled:opacity-80"
                >
                  <span className="relative overflow-hidden">
                    {status === "submitting" ? "Küldés folyamatban…" : "Üzenet küldése"}
                    {status === "submitting" && (
                      <span
                        aria-hidden
                        className="absolute inset-0 -skew-x-12 animate-shimmer bg-gradient-to-r from-transparent via-white/25 to-transparent"
                      />
                    )}
                  </span>
                  <span
                    aria-hidden
                    className="grid size-9 place-items-center rounded-full bg-white/10 transition-transform duration-500 ease-soft group-hover:-translate-y-px group-hover:translate-x-0.5 group-hover:scale-105"
                  >
                    <ArrowUpRight size={16} weight="bold" />
                  </span>
                </button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
