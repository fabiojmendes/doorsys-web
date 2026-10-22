export type Id = string | number;

export interface Customer {
  id: Id;
  name: string;
  email: string;
  notes?: string | null;
  active: boolean;
}

export interface Staff {
  id: Id;
  customerId: Id;
  name: string;
  phone: string;
  fob?: number | null;
  pin?: string | number | null;
  active: boolean;
}

export interface Device {
  id: Id;
  name: string;
}

export interface EntryLog {
  id?: Id;
  eventDate: string;
  customerId?: Id | null;
  customerName?: string | null;
  staffId?: Id | null;
  staffName?: string | null;
  staffDeleted?: string | null;
  code: string | number;
  codeType: string;
  success: boolean;
}

export type FieldErrors = Record<string, string>;
export type MutationResult =
  | { ok: true; message: string }
  | { ok: false; error?: string; fields?: FieldErrors };
