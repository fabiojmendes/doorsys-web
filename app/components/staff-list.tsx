import AddIcon from "@mui/icons-material/Add";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import SearchIcon from "@mui/icons-material/Search";
import {
  Button,
  Chip,
  InputAdornment,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useState } from "react";
import { Link } from "react-router";
import type { Customer, Staff } from "../lib/types";
import { EmptyState } from "./page";
import { RecordAvatar } from "./record-avatar";
import { StaffForm } from "./staff-form";
import { TaskSheet } from "./task-sheet";

export function StaffList({
  customer,
  staff,
}: {
  customer: Customer;
  staff: Staff[];
}) {
  const [adding, setAdding] = useState(false);
  const [query, setQuery] = useState("");
  const visible = staff.filter((member) =>
    `${member.name} ${member.phone}`
      .toLocaleLowerCase()
      .includes(query.trim().toLocaleLowerCase()),
  );
  return (
    <Stack spacing={2}>
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        gap={1}
      >
        <Typography variant="h2">Staff members ({staff.length})</Typography>
        {customer.active && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setAdding(true)}
          >
            Add staff
          </Button>
        )}
      </Stack>
      {staff.length > 0 && (
        <TextField
          label="Find staff"
          placeholder="Name or phone"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon color="action" />
                </InputAdornment>
              ),
            },
          }}
        />
      )}
      <Paper variant="outlined">
        {visible.length ? (
          <List disablePadding aria-label="Staff members">
            {visible.map((member) => (
              <ListItem key={member.id} disablePadding>
                <ListItemButton
                  component={Link}
                  to={`/staff/${member.id}`}
                  key={member.id}
                  divider
                  sx={{ gap: 1.5, py: 1.5 }}
                >
                  <RecordAvatar name={member.name} />
                  <Stack sx={{ flex: 1, minWidth: 0 }}>
                    <ListItemText
                      primary={member.name}
                      secondary={member.phone}
                      slotProps={{
                        primary: {
                          sx: { fontWeight: 600, overflowWrap: "anywhere" },
                        },
                        secondary: { sx: { overflowWrap: "anywhere" } },
                      }}
                    />
                    <Stack direction="row" gap={0.5} flexWrap="wrap">
                      {!member.active && <Chip size="small" label="Inactive" />}
                      {Boolean(member.fob) && (
                        <Chip size="small" label="Fob" variant="outlined" />
                      )}
                      {Boolean(member.pin) && (
                        <Chip size="small" label="PIN" variant="outlined" />
                      )}
                      {!member.fob && !member.pin && (
                        <Typography variant="caption" color="text.secondary">
                          No credentials assigned
                        </Typography>
                      )}
                    </Stack>
                  </Stack>
                  <ChevronRightIcon color="action" fontSize="small" />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        ) : (
          <EmptyState>
            {query
              ? "No staff match your search."
              : customer.active
                ? "No staff yet. Add a staff member to assign access."
                : "No staff members. Activate this customer to add staff."}
          </EmptyState>
        )}
      </Paper>
      {adding && (
        <TaskSheet
          title="Add staff"
          description={`Create access for someone at ${customer.name}.`}
          onClose={() => setAdding(false)}
        >
          <StaffForm
            onCancel={() => setAdding(false)}
            onSaved={() => setAdding(false)}
          />
        </TaskSheet>
      )}
    </Stack>
  );
}
