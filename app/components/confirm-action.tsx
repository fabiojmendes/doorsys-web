import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from "@mui/material";
import { useId, useState } from "react";
import { useFetcher } from "react-router";
import type { MutationResult } from "../lib/types";
import { RequestError, useMutationFeedback } from "./feedback";

export function ConfirmAction({
  label,
  description,
  intent,
  fields,
  danger = false,
  disabled = false,
}: {
  label: string;
  description: string;
  intent: string;
  fields?: Record<string, string>;
  danger?: boolean;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const titleId = useId();
  const fetcher = useFetcher<MutationResult>();
  const busy = fetcher.state !== "idle";
  const error = useMutationFeedback(fetcher, () => setOpen(false));
  return (
    <>
      <Button
        color={danger ? "error" : "primary"}
        variant="outlined"
        disabled={disabled || busy}
        onClick={() => {
          fetcher.reset();
          setOpen(true);
        }}
      >
        {label}
      </Button>
      <Dialog
        open={open}
        onClose={() => {
          if (!busy) setOpen(false);
        }}
        fullWidth
        maxWidth="xs"
        aria-labelledby={titleId}
      >
        <DialogTitle id={titleId}>{label}?</DialogTitle>
        <DialogContent>
          <DialogContentText
            sx={{ mb: error?.error ? 2 : 0, overflowWrap: "anywhere" }}
          >
            {description}
          </DialogContentText>
          <RequestError message={error?.error} />
        </DialogContent>
        <DialogActions>
          <Button disabled={busy} onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color={danger ? "error" : "primary"}
            disabled={busy}
            onClick={() =>
              fetcher.submit({ intent, ...fields }, { method: "post" })
            }
          >
            {busy ? "Working…" : label}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
