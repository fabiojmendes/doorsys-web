import {
  Alert,
  Button,
  Divider,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { replace, useFetcher } from "react-router";
import { ConfirmAction } from "../components/confirm-action";
import { ErrorPage } from "../components/error-page";
import { RequestError, useMutationFeedback } from "../components/feedback";
import { PageHeader } from "../components/page";
import { api, errorMessage } from "../lib/api";
import { FOB_MAX, staffFields, value } from "../lib/forms";
import type { MutationResult, Staff } from "../lib/types";
import type { Route } from "./+types/staff";

export async function clientLoader({
  params,
  request,
}: Route.ClientLoaderArgs) {
  return {
    staff: await api<Staff>(`/staff/${params.id}`, { signal: request.signal }),
  };
}

export async function clientAction({
  params,
  request,
}: Route.ClientActionArgs): Promise<MutationResult | Response> {
  const form = await request.formData();
  const path = `/staff/${params.id}`;
  const signal = request.signal;
  try {
    switch (value(form, "intent")) {
      case "save": {
        const { body, fields } = staffFields(form);
        if (Object.keys(fields).length) return { ok: false, fields };
        const staff = await api<Staff>(path, { signal });
        await api<Staff>(path, {
          method: "PUT",
          body: { ...staff, ...body },
          signal,
        });
        return { ok: true, message: "Staff member saved." };
      }
      case "pin":
        await api<Staff>(`${path}/pin`, { method: "POST", signal });
        return { ok: true, message: "PIN reset." };
      case "status":
        await api<Staff>(`${path}/status`, {
          method: "PUT",
          body: value(form, "active") === "true",
          signal,
        });
        return { ok: true, message: "Staff status updated." };
      case "delete": {
        const staff = await api<Staff>(path, { signal });
        await api<void>(path, { method: "DELETE", signal });
        return replace(
          staff.customerId != null
            ? `/customers/${encodeURIComponent(staff.customerId)}`
            : "/customers",
        );
      }
      default:
        return { ok: false, error: "This action is not supported." };
    }
  } catch (error) {
    return { ok: false, error: errorMessage(error) };
  }
}

export default function StaffPage({
  loaderData: { staff },
}: Route.ComponentProps) {
  return <StaffDetail key={staff.id} staff={staff} />;
}

function StaffDetail({ staff }: { staff: Staff }) {
  const fetcher = useFetcher<MutationResult>();
  const error = useMutationFeedback(fetcher);
  const busy = fetcher.state !== "idle";
  const back =
    staff.customerId != null ? `/customers/${staff.customerId}` : "/customers";
  return (
    <>
      <PageHeader title="Staff member" back={back} />
      {!staff.active && (
        <Alert severity="info">This staff member is inactive.</Alert>
      )}
      <Paper variant="outlined" sx={{ p: 2 }}>
        <Stack spacing={2}>
          <Typography variant="h2" sx={{ overflowWrap: "anywhere" }}>
            {staff.name}
          </Typography>
          <Stack
            component={fetcher.Form}
            method="post"
            noValidate
            spacing={2}
            aria-label="Edit staff"
          >
            <input type="hidden" name="intent" value="save" />
            <RequestError message={error?.error} />
            <TextField
              label="Name"
              name="name"
              defaultValue={staff.name}
              required
              autoComplete="name"
              disabled={busy}
              error={Boolean(error?.fields?.name)}
              helperText={error?.fields?.name}
            />
            <TextField
              label="Phone"
              name="phone"
              type="tel"
              defaultValue={staff.phone}
              required
              autoComplete="tel"
              disabled={busy}
              error={Boolean(error?.fields?.phone)}
              helperText={error?.fields?.phone}
            />
            <TextField
              label="Fob (optional)"
              name="fob"
              type="number"
              defaultValue={staff.fob ?? ""}
              disabled={busy}
              slotProps={{ htmlInput: { min: 0, max: FOB_MAX, step: 1 } }}
              error={Boolean(error?.fields?.fob)}
              helperText={error?.fields?.fob}
            />
            <Button
              variant="contained"
              type="submit"
              disabled={busy}
              sx={{ alignSelf: "flex-end" }}
            >
              {busy ? "Saving…" : "Save"}
            </Button>
          </Stack>
          <Divider />
          <TextField
            label="PIN"
            value={staff.pin ?? ""}
            slotProps={{ input: { readOnly: true } }}
            helperText="Reset to generate a new PIN."
          />
          <Stack direction="row" flexWrap="wrap" gap={1}>
            <ConfirmAction
              label="Reset PIN"
              description={`Generate a new PIN for ${staff.name}? The current PIN will stop working.`}
              intent="pin"
              disabled={busy}
            />
            <ConfirmAction
              label={staff.active ? "Deactivate" : "Activate"}
              description={`${staff.active ? "Deactivate" : "Activate"} ${staff.name}?`}
              intent="status"
              fields={{ active: String(!staff.active) }}
              disabled={busy}
            />
            <ConfirmAction
              label="Delete"
              description={`Permanently delete ${staff.name}? This cannot be undone.`}
              intent="delete"
              danger
              disabled={busy}
            />
          </Stack>
        </Stack>
      </Paper>
    </>
  );
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  return <ErrorPage error={error} />;
}
