/**
 * Shared validation for the contact form – used on the client for instant
 * feedback and on the server as the authoritative check.
 */
export type ContactPayload = {
  name: string;
  email: string;
  phone: string;
  topic: string;
  message: string;
  consent: boolean;
  /** Honeypot – must stay empty. */
  company?: string;
};

export type ContactErrors = Partial<Record<keyof ContactPayload, string>>;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE = /^[+\d][\d\s()/-]{6,}$/;

export function validateContact(data: Partial<ContactPayload>): ContactErrors {
  const errors: ContactErrors = {};
  const name = data.name?.trim() ?? "";
  const email = data.email?.trim() ?? "";
  const phone = data.phone?.trim() ?? "";
  const message = data.message?.trim() ?? "";

  if (name.length < 3) errors.name = "Kérem, adja meg a teljes nevét.";
  if (!EMAIL.test(email)) errors.email = "Érvényes e-mail címet adjon meg.";
  if (phone && !PHONE.test(phone)) errors.phone = "A telefonszám formátuma nem megfelelő.";
  if (!data.topic) errors.topic = "Válasszon témát, hogy gyorsabban tudjak reagálni.";
  if (message.length < 20)
    errors.message = "Kérem, írjon legalább néhány mondatot az ügyről (min. 20 karakter).";
  if (message.length > 4000) errors.message = "Az üzenet túl hosszú (max. 4000 karakter).";
  if (!data.consent) errors.consent = "Az adatkezelési tájékoztató elfogadása szükséges.";

  return errors;
}
