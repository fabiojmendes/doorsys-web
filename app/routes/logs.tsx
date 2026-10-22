import TuneIcon from "@mui/icons-material/Tune";
import {
  Alert,
  Autocomplete,
  Button,
  Chip,
  List,
  ListItem,
  MenuItem,
  Link as MuiLink,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useState } from "react";
import {
  Link,
  type ShouldRevalidateFunctionArgs,
  useNavigation,
  useSearchParams,
} from "react-router";
import { ErrorPage } from "../components/error-page";
import { EmptyState, PageHeader } from "../components/page";
import { TaskSheet } from "../components/task-sheet";
import { api } from "../lib/api";
import { datePreset, logFilters, logQuery } from "../lib/logs";
import type { Customer, Device, EntryLog } from "../lib/types";
import type { Route } from "./+types/logs";

export async function clientLoader({ request }: Route.ClientLoaderArgs) {
  const filters = logFilters(new URL(request.url).searchParams);
  const [customers, devices, entries] = await Promise.all([
    api<Customer[]>("/customers", {
      query: { active: true },
      signal: request.signal,
    }),
    api<Device[]>("/devices", { signal: request.signal }),
    filters.error
      ? Promise.resolve([] as EntryLog[])
      : api<EntryLog[]>("/entry_logs", {
          query: logQuery(filters),
          signal: request.signal,
        }),
  ]);
  return { filters, customers, devices, entries };
}

export function shouldRevalidate({
  currentUrl,
  nextUrl,
  formMethod,
  defaultShouldRevalidate,
}: ShouldRevalidateFunctionArgs) {
  if (
    !formMethod &&
    currentUrl.pathname === nextUrl.pathname &&
    currentUrl.search !== nextUrl.search &&
    JSON.stringify(logQuery(logFilters(currentUrl.searchParams))) ===
      JSON.stringify(logQuery(logFilters(nextUrl.searchParams)))
  )
    return false;
  return defaultShouldRevalidate;
}

export default function Logs({
  loaderData: { filters: loadedFilters, customers, devices, entries },
}: Route.ComponentProps) {
  const [search, setSearch] = useSearchParams();
  const navigation = useNavigation();
  const [filtering, setFiltering] = useState(false);
  const pendingSearch =
    navigation.location?.pathname === "/logs"
      ? navigation.location.search
      : undefined;
  const current = new URLSearchParams(pendingSearch ?? search);
  const filters =
    pendingSearch === undefined ? loadedFilters : logFilters(current);
  const requestedOutcome = current.get("outcome");
  const outcome =
    requestedOutcome === "denied" || requestedOutcome === "success"
      ? requestedOutcome
      : "all";
  function change(values: Record<string, string>) {
    const next = new URLSearchParams(current);
    if (!next.has("startDate")) next.set("startDate", filters.startDate);
    if (!next.has("endDate")) next.set("endDate", filters.endDate);
    for (const [key, value] of Object.entries(values)) {
      if (value) next.set(key, value);
      else next.delete(key);
    }
    setSearch(next, { replace: true });
  }
  const visible = entries.filter((entry) =>
    outcome === "denied"
      ? !entry.success
      : outcome === "success"
        ? entry.success
        : true,
  );
  const grouped = new Map<string, EntryLog[]>();
  for (const entry of visible) {
    const date = new Date(entry.eventDate).toLocaleDateString(undefined, {
      dateStyle: "medium",
    });
    const group = grouped.get(date) ?? [];
    group.push(entry);
    grouped.set(date, group);
  }
  const presets = [
    { key: "today", label: "Today" },
    { key: "yesterday", label: "Yesterday" },
    { key: "week", label: "Last 7 days" },
  ] as const;
  return (
    <>
      <PageHeader
        title="Activity"
        description="Door entries and access attempts."
        action={
          <Button
            startIcon={<TuneIcon />}
            variant="outlined"
            onClick={() => setFiltering(true)}
          >
            Filters
          </Button>
        }
      />
      <Stack
        direction="row"
        gap={1}
        sx={{ overflowX: "auto", py: 0.5 }}
        aria-label="Date presets"
      >
        {presets.map(({ key, label }) => {
          const range = datePreset(key);
          const selected =
            range.startDate === filters.startDate &&
            range.endDate === filters.endDate;
          return (
            <Chip
              key={key}
              label={label}
              clickable
              color={selected ? "primary" : "default"}
              variant={selected ? "filled" : "outlined"}
              onClick={() => change(range)}
              aria-pressed={selected}
              sx={{ minHeight: 40 }}
            />
          );
        })}
      </Stack>
      <Typography variant="caption" color="text.secondary">
        {filters.startDate === filters.endDate
          ? filters.startDate
          : `${filters.startDate} – ${filters.endDate}`}
      </Typography>
      <Typography variant="caption" color="text.secondary" aria-live="polite">
        {visible.length} {visible.length === 1 ? "entry" : "entries"}
        {outcome === "denied"
          ? " denied"
          : outcome === "success"
            ? " successful"
            : " in this period"}
      </Typography>
      {filters.error ? (
        <Alert severity="error">
          Choose a valid date range to load entries. Open Filters to adjust it.
        </Alert>
      ) : visible.length ? (
        <Stack
          spacing={2}
          aria-busy={navigation.state !== "idle"}
          sx={{ opacity: navigation.state === "idle" ? 1 : 0.6 }}
        >
          {Array.from(grouped, ([date, group]) => (
            <Paper key={date} variant="outlined" sx={{ overflow: "hidden" }}>
              <Typography
                component="h2"
                variant="subtitle2"
                sx={{ px: 2, py: 1, bgcolor: "action.hover" }}
              >
                {date}
              </Typography>
              <List disablePadding aria-label={`Entries for ${date}`}>
                {group.map((entry, index) => (
                  <LogEntry
                    key={entry.id ?? `${entry.eventDate}-${index}`}
                    entry={entry}
                  />
                ))}
              </List>
            </Paper>
          ))}
        </Stack>
      ) : (
        <Paper variant="outlined">
          <Stack alignItems="center" sx={{ pb: 2 }}>
            <EmptyState>
              {outcome === "denied"
                ? "No denied attempts in this period."
                : "No entries match these filters."}
            </EmptyState>
            <Button onClick={() => setFiltering(true)}>Adjust filters</Button>
          </Stack>
        </Paper>
      )}
      {filtering && (
        <TaskSheet
          title="Filter activity"
          description="Choose dates, customer, device, and entry outcome."
          onClose={() => setFiltering(false)}
        >
          <LogFilterForm
            filters={filters}
            outcome={outcome}
            customers={customers}
            devices={devices}
            onCancel={() => setFiltering(false)}
            onApply={(values) => {
              change(values);
              setFiltering(false);
            }}
          />
        </TaskSheet>
      )}
    </>
  );
}

function LogFilterForm({
  filters,
  outcome,
  customers,
  devices,
  onCancel,
  onApply,
}: {
  filters: ReturnType<typeof logFilters>;
  outcome: string;
  customers: Customer[];
  devices: Device[];
  onCancel: () => void;
  onApply: (values: Record<string, string>) => void;
}) {
  const [draft, setDraft] = useState({
    startDate: filters.startDate,
    endDate: filters.endDate,
    customerId: filters.customerId,
    deviceId: filters.deviceId,
    outcome,
  });
  const [error, setError] = useState("");
  const selectedCustomer =
    customers.find((customer) => String(customer.id) === draft.customerId) ||
    (draft.customerId
      ? {
          id: draft.customerId,
          name: `Customer ${draft.customerId} (unavailable)`,
        }
      : null);
  const options: { id: string | number; name: string }[] = [...customers];
  if (
    selectedCustomer &&
    !options.some((customer) => String(customer.id) === draft.customerId)
  )
    options.push(selectedCustomer);
  return (
    <Stack
      component="form"
      noValidate
      spacing={2.5}
      onSubmit={(event) => {
        event.preventDefault();
        if (!draft.startDate || !draft.endDate) {
          setError("Choose both dates.");
          return;
        }
        if (draft.startDate > draft.endDate) {
          setError("The end date must be on or after the start date.");
          return;
        }
        onApply({
          ...draft,
          outcome: draft.outcome === "all" ? "" : draft.outcome,
        });
      }}
    >
      {error && <Alert severity="error">{error}</Alert>}
      <TextField
        label="Start date"
        type="date"
        value={draft.startDate}
        required
        slotProps={{ inputLabel: { shrink: true } }}
        onChange={(event) =>
          setDraft({ ...draft, startDate: event.target.value })
        }
      />
      <TextField
        label="End date"
        type="date"
        value={draft.endDate}
        required
        slotProps={{ inputLabel: { shrink: true } }}
        onChange={(event) =>
          setDraft({ ...draft, endDate: event.target.value })
        }
      />
      <Autocomplete
        options={options}
        value={selectedCustomer}
        getOptionLabel={(customer) => customer.name}
        isOptionEqualToValue={(a, b) => String(a.id) === String(b.id)}
        onChange={(_, customer) =>
          setDraft({
            ...draft,
            customerId: customer ? String(customer.id) : "",
          })
        }
        renderInput={(params) => (
          <TextField {...params} label="Customer" placeholder="All customers" />
        )}
      />
      <TextField
        select
        label="Device"
        value={draft.deviceId}
        onChange={(event) =>
          setDraft({ ...draft, deviceId: event.target.value })
        }
      >
        <MenuItem value="">All devices</MenuItem>
        {draft.deviceId &&
          !devices.some((device) => String(device.id) === draft.deviceId) && (
            <MenuItem value={draft.deviceId}>
              Device {draft.deviceId} (unavailable)
            </MenuItem>
          )}
        {devices.map((device) => (
          <MenuItem key={device.id} value={String(device.id)}>
            {device.name}
          </MenuItem>
        ))}
      </TextField>
      <TextField
        select
        label="Outcome"
        value={draft.outcome}
        onChange={(event) =>
          setDraft({ ...draft, outcome: event.target.value })
        }
      >
        <MenuItem value="all">All entries</MenuItem>
        <MenuItem value="denied">Denied</MenuItem>
        <MenuItem value="success">Successful</MenuItem>
      </TextField>
      <Stack direction="row" spacing={1} justifyContent="flex-end">
        <Button onClick={onCancel}>Cancel</Button>
        <Button variant="contained" type="submit">
          Apply filters
        </Button>
      </Stack>
    </Stack>
  );
}

function LogEntry({ entry }: { entry: EntryLog }) {
  const date = new Date(entry.eventDate);
  const time = date.toLocaleTimeString(undefined, {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
  });
  return (
    <ListItem divider sx={{ display: "block", px: 2, py: 1.5 }}>
      <Stack
        direction="row"
        justifyContent="space-between"
        gap={1}
        alignItems="flex-start"
      >
        <Stack spacing={0.5} sx={{ minWidth: 0, overflowWrap: "anywhere" }}>
          {entry.staffDeleted ? (
            <Typography
              variant="body2"
              title={`Deleted on ${entry.staffDeleted}`}
            >
              {entry.staffName || "Staff member"} (deleted)
            </Typography>
          ) : entry.staffId != null ? (
            <MuiLink
              component={Link}
              to={`/staff/${entry.staffId}`}
              underline="hover"
              fontWeight={600}
            >
              {entry.staffName || "Staff member"}
            </MuiLink>
          ) : (
            <Typography variant="body2">{entry.code}</Typography>
          )}
          {entry.customerId != null ? (
            <MuiLink
              component={Link}
              to={`/customers/${entry.customerId}`}
              variant="body2"
              color="text.secondary"
            >
              {entry.customerName || "Customer"}
            </MuiLink>
          ) : (
            <Typography variant="body2" color="text.secondary">
              No customer
            </Typography>
          )}
        </Stack>
        <Typography
          component="time"
          dateTime={entry.eventDate}
          variant="body2"
          color="text.secondary"
          title={date.toLocaleString(undefined, { hour12: false })}
          sx={{ flexShrink: 0 }}
        >
          {time}
        </Typography>
      </Stack>
      <Stack direction="row" gap={0.5} flexWrap="wrap" sx={{ mt: 1 }}>
        <Chip
          size="small"
          variant="outlined"
          label={
            entry.codeType === "pin"
              ? "PIN"
              : entry.codeType === "fob"
                ? "Fob"
                : entry.codeType || "Unknown credential"
          }
        />
        <Chip
          size="small"
          color={entry.success ? "success" : "error"}
          variant="outlined"
          label={entry.success ? "Successful entry" : "Invalid attempt"}
        />
      </Stack>
    </ListItem>
  );
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  return <ErrorPage error={error} />;
}
