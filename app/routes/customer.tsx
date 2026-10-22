import {
  Alert,
  Button,
  Chip,
  Divider,
  Link as MuiLink,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import { useState } from "react";
import { ConfirmAction } from "../components/confirm-action";
import { CustomerForm } from "../components/customer-form";
import { ErrorPage } from "../components/error-page";
import { PageHeader } from "../components/page";
import { StaffList } from "../components/staff-list";
import { api, errorMessage } from "../lib/api";
import { customerFields, staffFields, value } from "../lib/forms";
import type { Customer, MutationResult, Staff } from "../lib/types";
import type { Route } from "./+types/customer";

export async function clientLoader({
  params,
  request,
}: Route.ClientLoaderArgs) {
  const [customer, staff] = await Promise.all([
    api<Customer>(`/customers/${params.id}`, { signal: request.signal }),
    api<Staff[]>(`/customers/${params.id}/staff`, { signal: request.signal }),
  ]);
  return { customer, staff };
}

export async function clientAction({
  params,
  request,
}: Route.ClientActionArgs): Promise<MutationResult> {
  const form = await request.formData();
  const path = `/customers/${params.id}`;
  const signal = request.signal;
  try {
    switch (value(form, "intent")) {
      case "save": {
        const { body, fields } = customerFields(form);
        if (Object.keys(fields).length) return { ok: false, fields };
        const current = await api<Customer>(path, { signal });
        await api<Customer>(path, {
          method: "PUT",
          body: { ...current, ...body },
          signal,
        });
        return { ok: true, message: "Customer saved." };
      }
      case "status": {
        await api<Customer>(`${path}/status`, {
          method: "PUT",
          body: value(form, "active") === "true",
          signal,
        });
        return { ok: true, message: "Customer status updated." };
      }
      case "add-staff": {
        const { body, fields } = staffFields(form);
        if (Object.keys(fields).length) return { ok: false, fields };
        const customer = await api<Customer>(path, { signal });
        if (!customer.active)
          return {
            ok: false,
            error: "Activate this customer before adding staff.",
          };
        await api<Staff>("/staff", {
          method: "POST",
          body: { ...body, customerId: customer.id },
          signal,
        });
        return { ok: true, message: "Staff member added." };
      }
      default:
        return { ok: false, error: "This action is not supported." };
    }
  } catch (error) {
    return { ok: false, error: errorMessage(error) };
  }
}

export default function CustomerPage({ loaderData }: Route.ComponentProps) {
  // Key the detail state by record so navigating between customers resets edits.
  return <CustomerDetail key={loaderData.customer.id} {...loaderData} />;
}

function CustomerDetail({
  customer,
  staff,
}: {
  customer: Customer;
  staff: Staff[];
}) {
  const [editing, setEditing] = useState(false);
  return (
    <>
      <PageHeader
        title={editing ? "Edit customer" : "Customer"}
        back="/customers"
      />
      {!customer.active && (
        <Alert severity="info">This customer is inactive.</Alert>
      )}
      {editing ? (
        <CustomerForm
          customer={customer}
          onCancel={() => setEditing(false)}
          onSaved={() => setEditing(false)}
        />
      ) : (
        <Paper variant="outlined" sx={{ p: 2 }}>
          <Stack spacing={2}>
            <Stack direction="row" gap={1} flexWrap="wrap" alignItems="center">
              <Typography
                variant="h2"
                sx={{ overflowWrap: "anywhere", minWidth: 0 }}
              >
                {customer.name}
              </Typography>
              <Chip
                size="small"
                label={customer.active ? "Active" : "Inactive"}
                color={customer.active ? "success" : "default"}
                variant="outlined"
              />
            </Stack>
            <MuiLink
              href={`mailto:${customer.email}`}
              sx={{ overflowWrap: "anywhere" }}
            >
              {customer.email}
            </MuiLink>
            <Divider />
            <Typography
              sx={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}
              color={customer.notes ? "text.primary" : "text.secondary"}
            >
              {customer.notes || "No notes."}
            </Typography>
            <Stack direction="row" gap={1} flexWrap="wrap">
              <Button variant="contained" onClick={() => setEditing(true)}>
                Edit
              </Button>
              <ConfirmAction
                label={customer.active ? "Deactivate" : "Activate"}
                description={`${customer.active ? "Deactivate" : "Activate"} ${customer.name}?`}
                intent="status"
                fields={{ active: String(!customer.active) }}
              />
            </Stack>
          </Stack>
        </Paper>
      )}
      <StaffList customer={customer} staff={staff} />
    </>
  );
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  return <ErrorPage error={error} />;
}
