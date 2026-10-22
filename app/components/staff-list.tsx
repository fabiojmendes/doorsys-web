import AddIcon from "@mui/icons-material/Add";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import {
  Button,
  Chip,
  List,
  ListItemButton,
  ListItemText,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useRef, useState } from "react";
import { Link, useFetcher } from "react-router";
import { FOB_MAX } from "../lib/forms";
import type { Customer, MutationResult, Staff } from "../lib/types";
import { RequestError, useMutationFeedback } from "./feedback";
import { EmptyState } from "./page";

export function StaffList({
  customer,
  staff,
}: {
  customer: Customer;
  staff: Staff[];
}) {
  const [adding, setAdding] = useState(false);
  const form = useRef<HTMLFormElement>(null);
  const name = useRef<HTMLInputElement>(null);
  const fetcher = useFetcher<MutationResult>();
  const busy = fetcher.state !== "idle";
  const error = useMutationFeedback(fetcher, () => {
    form.current?.reset();
    name.current?.focus();
  });
  return (
    <Paper variant="outlined" sx={{ overflow: "hidden" }}>
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        sx={{ px: 2, py: 1 }}
      >
        <Typography variant="h2">Staff members ({staff.length})</Typography>
        {customer.active && !adding && (
          <Button startIcon={<AddIcon />} onClick={() => setAdding(true)}>
            Add staff
          </Button>
        )}
      </Stack>
      {customer.active && adding && (
        <Stack
          component={fetcher.Form}
          ref={form}
          method="post"
          noValidate
          aria-label="Add staff"
          spacing={2}
          sx={{ p: 2, borderBottom: 1, borderColor: "divider" }}
        >
          <input type="hidden" name="intent" value="add-staff" />
          <RequestError message={error?.error} />
          <TextField
            inputRef={name}
            label="Name"
            name="name"
            autoComplete="name"
            required
            disabled={busy}
            error={Boolean(error?.fields?.name)}
            helperText={error?.fields?.name}
          />
          <TextField
            label="Phone"
            name="phone"
            type="tel"
            autoComplete="tel"
            required
            disabled={busy}
            error={Boolean(error?.fields?.phone)}
            helperText={error?.fields?.phone}
          />
          <TextField
            label="Fob (optional)"
            name="fob"
            type="number"
            disabled={busy}
            slotProps={{ htmlInput: { min: 0, max: FOB_MAX, step: 1 } }}
            error={Boolean(error?.fields?.fob)}
            helperText={error?.fields?.fob}
          />
          <Stack direction="row" gap={1} justifyContent="flex-end">
            <Button
              disabled={busy}
              onClick={() => {
                setAdding(false);
                fetcher.reset();
              }}
            >
              Cancel
            </Button>
            <Button
              type="reset"
              disabled={busy}
              onClick={() => fetcher.reset()}
            >
              Reset
            </Button>
            <Button variant="contained" type="submit" disabled={busy}>
              {busy ? "Adding…" : "Add"}
            </Button>
          </Stack>
        </Stack>
      )}
      {staff.length ? (
        <List disablePadding aria-label="Staff members">
          {staff.map((member) => (
            <ListItemButton
              component={Link}
              to={`/staff/${member.id}`}
              key={member.id}
              divider
              alignItems="flex-start"
            >
              <Stack sx={{ flex: 1, minWidth: 0 }}>
                <ListItemText
                  primary={member.name}
                  secondary={member.phone}
                  slotProps={{
                    primary: {
                      sx: { fontWeight: 500, overflowWrap: "anywhere" },
                    },
                    secondary: { sx: { overflowWrap: "anywhere" } },
                  }}
                />
                <Stack
                  direction="row"
                  gap={0.5}
                  flexWrap="wrap"
                  sx={{ mb: 0.5 }}
                >
                  {!member.active && <Chip size="small" label="Inactive" />}
                  {Boolean(member.fob) && (
                    <Chip size="small" label="Fob" variant="outlined" />
                  )}
                  {Boolean(member.pin) && (
                    <Chip size="small" label="PIN" variant="outlined" />
                  )}
                </Stack>
              </Stack>
              <ChevronRightIcon color="action" sx={{ mt: 1 }} />
            </ListItemButton>
          ))}
        </List>
      ) : (
        <EmptyState>No staff members yet.</EmptyState>
      )}
    </Paper>
  );
}
