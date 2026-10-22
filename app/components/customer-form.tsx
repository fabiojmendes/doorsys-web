import { Button, Paper, Stack, TextField } from "@mui/material";
import { useFetcher } from "react-router";
import type { Customer, MutationResult } from "../lib/types";
import { RequestError, useMutationFeedback } from "./feedback";

export function CustomerForm({
  customer,
  onCancel,
  onSaved,
}: {
  customer?: Customer;
  onCancel?: () => void;
  onSaved?: () => void;
}) {
  const fetcher = useFetcher<MutationResult>();
  const error = useMutationFeedback(fetcher, onSaved);
  const busy = fetcher.state !== "idle";
  return (
    <Paper variant="outlined" sx={{ p: 2 }}>
      <Stack
        component={fetcher.Form}
        method="post"
        noValidate
        spacing={2}
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
          minRows={3}
          disabled={busy}
        />
        <Stack direction="row" spacing={1} justifyContent="flex-end">
          {onCancel && (
            <Button onClick={onCancel} disabled={busy}>
              Cancel
            </Button>
          )}
          <Button type="submit" variant="contained" disabled={busy}>
            {busy ? "Saving…" : "Save"}
          </Button>
        </Stack>
      </Stack>
    </Paper>
  );
}
