import type { FieldErrors } from "./types";

export const FOB_MAX = 16777216;

export function value(form: FormData, name: string): string {
  return String(form.get(name) ?? "").trim();
}

export function customerFields(form: FormData) {
  const name = value(form, "name");
  const email = value(form, "email");
  const fields: FieldErrors = {};
  if (!name) fields.name = "Enter a name.";
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    fields.email = "Enter a valid email address.";
  return { fields, body: { name, email, notes: value(form, "notes") } };
}

export function staffFields(form: FormData) {
  const name = value(form, "name");
  const phone = value(form, "phone");
  const rawFob = value(form, "fob");
  const fob = rawFob ? Number(rawFob) || null : null;
  const fields: FieldErrors = {};
  if (!name) fields.name = "Enter a name.";
  if (!phone) fields.phone = "Enter a phone number.";
  if (
    rawFob &&
    (!Number.isInteger(Number(rawFob)) ||
      Number(rawFob) < 0 ||
      Number(rawFob) > FOB_MAX)
  )
    fields.fob = `Enter a whole number between 0 and ${FOB_MAX}.`;
  return { fields, body: { name, phone, fob } };
}
