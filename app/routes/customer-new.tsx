import { Paper } from "@mui/material";
import { replace } from "react-router";
import { CustomerForm } from "../components/customer-form";
import { ErrorPage } from "../components/error-page";
import { PageHeader } from "../components/page";
import { api, errorMessage } from "../lib/api";
import { requireSession } from "../lib/auth";
import { customerFields } from "../lib/forms";
import type { Customer, MutationResult } from "../lib/types";
import type { Route } from "./+types/customer-new";

export async function clientLoader() {
  await requireSession("/customers/new");
  return null;
}

export async function clientAction({
  request,
}: Route.ClientActionArgs): Promise<MutationResult | Response> {
  const { body, fields } = customerFields(await request.formData());
  if (Object.keys(fields).length) return { ok: false, fields };
  try {
    const customer = await api<Customer>("/customers", {
      method: "POST",
      body,
      signal: request.signal,
    });
    return replace(`/customers/${customer.id}`);
  } catch (error) {
    return { ok: false, error: errorMessage(error) };
  }
}

export default function NewCustomer() {
  return (
    <>
      <PageHeader
        title="New customer"
        description="Start with contact details. Add staff next."
        back="/customers"
      />
      <Paper variant="outlined" sx={{ p: 3 }}>
        <CustomerForm />
      </Paper>
    </>
  );
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  return <ErrorPage error={error} />;
}
