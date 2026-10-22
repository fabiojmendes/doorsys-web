import { Button, Stack, TextField } from "@mui/material";
import { useFetcher } from "react-router";
import type { Customer, MutationResult } from "../lib/types";
import { RequestError, useMutationFeedback } from "./feedback";

export function CustomerForm({
  customer,
  onCancel,
  onSaved,
  action,
}: {
  customer?: Customer;
  onCancel?: () => void;
  onSaved?: () => void;
  action?: string;
}) {
  const fetcher = useFetcher<MutationResult>();
  const error = useMutationFeedback(fetcher, onSaved);
  const busy = fetcher.state !== "idle";
  return (
    <Stack
      component={fetcher.Form}
      action={action}
      method="post"
      noValidate
      spacing={2.5}
      aria-label={customer ? "Edit customer" : "New customer"}
    >
      <input type="hidden" name="intent" value="save" />
      <RequestError message={error?.error} />
      <TextField
        label="Name"
        name="name"
        defaultValue={customer?.name ?? ""}
        required
        autoComplete="organization"
        autoFocus
        error={Boolean(error?.fields?.name)}
        helperText={error?.fields?.name}
        disabled={busy}
      />
      <TextField
        label="Email address"
        name="email"
        type="email"
        defaultValue={customer?.email ?? ""}
        required
        autoComplete="email"
        error={Boolean(error?.fields?.email)}
        helperText={error?.fields?.email}
        disabled={busy}
      />
      <TextField
        label="Notes"
        name="notes"
        defaultValue={customer?.notes ?? ""}
        multiline
        minRows={2}
        helperText="Optional details about this customer."
        disabled={busy}
      />
      <Stack direction="row" spacing={1} justifyContent="flex-end">
        {onCancel && (
          <Button onClick={onCancel} disabled={busy}>
            Cancel
          </Button>
        )}
        <Button type="submit" variant="contained" disabled={busy}>
          {busy ? "Saving…" : customer ? "Save changes" : "Create customer"}
        </Button>
      </Stack>
    </Stack>
  );
}
