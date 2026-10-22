import { Button, Stack, TextField } from "@mui/material";
import { useFetcher } from "react-router";
import { FOB_MAX } from "../lib/forms";
import type { MutationResult, Staff } from "../lib/types";
import { RequestError, useMutationFeedback } from "./feedback";

export function StaffForm({
  staff,
  onCancel,
  onSaved,
}: {
  staff?: Staff;
  onCancel: () => void;
  onSaved: () => void;
}) {
  const fetcher = useFetcher<MutationResult>();
  const error = useMutationFeedback(fetcher, onSaved);
  const busy = fetcher.state !== "idle";
  return (
    <Stack
      component={fetcher.Form}
      method="post"
      noValidate
      spacing={2.5}
      aria-label={staff ? "Edit staff" : "Add staff"}
    >
      <input type="hidden" name="intent" value={staff ? "save" : "add-staff"} />
      <RequestError message={error?.error} />
      <TextField
        label="Name"
        name="name"
        defaultValue={staff?.name ?? ""}
        required
        autoComplete="name"
        autoFocus
        disabled={busy}
        error={Boolean(error?.fields?.name)}
        helperText={error?.fields?.name}
      />
      <TextField
        label="Phone"
        name="phone"
        type="tel"
        defaultValue={staff?.phone ?? ""}
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
        defaultValue={staff?.fob ?? ""}
        disabled={busy}
        slotProps={{ htmlInput: { min: 0, max: FOB_MAX, step: 1 } }}
        error={Boolean(error?.fields?.fob)}
        helperText={error?.fields?.fob || "You can assign a fob later."}
      />
      <Stack
        direction="row"
        spacing={1}
        justifyContent="flex-end"
        sx={{ pt: 1 }}
      >
        <Button onClick={onCancel} disabled={busy}>
          Cancel
        </Button>
        <Button type="submit" variant="contained" disabled={busy}>
          {busy ? "Saving…" : staff ? "Save changes" : "Add staff"}
        </Button>
      </Stack>
    </Stack>
  );
}
