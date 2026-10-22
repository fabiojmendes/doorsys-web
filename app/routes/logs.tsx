import {
  Alert,
  Box,
  Chip,
  List,
  ListItem,
  MenuItem,
  Link as MuiLink,
  Paper,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";
import { Link, useNavigation, useSearchParams } from "react-router";
import { ErrorPage } from "../components/error-page";
import { EmptyState, PageHeader } from "../components/page";
import { api } from "../lib/api";
import { logFilters, logQuery } from "../lib/logs";
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

export default function Logs({
  loaderData: { filters: loadedFilters, customers, devices, entries },
}: Route.ComponentProps) {
  const [search, setSearch] = useSearchParams();
  const navigation = useNavigation();
  const pendingSearch =
    navigation.location?.pathname === "/logs"
      ? navigation.location.search
      : undefined;
  const filters =
    pendingSearch === undefined
      ? loadedFilters
      : logFilters(new URLSearchParams(pendingSearch));
  function change(key: string, value: string) {
    const next = new URLSearchParams(pendingSearch ?? search);
    if (!next.has("startDate")) next.set("startDate", filters.startDate);
    if (!next.has("endDate")) next.set("endDate", filters.endDate);
    if (value) next.set(key, value);
    else next.delete(key);
    setSearch(next, { replace: true });
  }
  const grouped = new Map<string, EntryLog[]>();
  for (const entry of entries) {
    const date = new Date(entry.eventDate).toLocaleDateString(undefined, {
      dateStyle: "medium",
    });
    const group = grouped.get(date) ?? [];
    group.push(entry);
    grouped.set(date, group);
  }
  const customerExists = customers.some(
    (customer) => String(customer.id) === filters.customerId,
  );
  const deviceExists = devices.some(
    (device) => String(device.id) === filters.deviceId,
  );
  return (
    <>
      <PageHeader title="Entry logs" />
      <Paper variant="outlined" sx={{ p: 2 }}>
        <Stack spacing={2}>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <TextField
              label="Start date"
              type="date"
              value={filters.startDate}
              slotProps={{ inputLabel: { shrink: true } }}
              onChange={(event) => {
                if (event.target.value) change("startDate", event.target.value);
              }}
            />
            <TextField
              label="End date"
              type="date"
              value={filters.endDate}
              error={Boolean(filters.error)}
              helperText={filters.error}
              slotProps={{ inputLabel: { shrink: true } }}
              onChange={(event) => {
                if (event.target.value) change("endDate", event.target.value);
              }}
            />
          </Stack>
          <TextField
            select
            label="Customer"
            value={filters.customerId}
            onChange={(event) => change("customerId", event.target.value)}
          >
            <MenuItem value="">All customers</MenuItem>
            {filters.customerId && !customerExists && (
              <MenuItem value={filters.customerId}>
                Customer {filters.customerId} (unavailable)
              </MenuItem>
            )}
            {customers.map((customer) => (
              <MenuItem key={customer.id} value={String(customer.id)}>
                {customer.name}
              </MenuItem>
            ))}
          </TextField>
        </Stack>
      </Paper>
      <Box sx={{ minWidth: 0, maxWidth: "100%" }}>
        <Tabs
          value={filters.deviceId}
          onChange={(_, id: string) => change("deviceId", id)}
          variant="scrollable"
          scrollButtons="auto"
          allowScrollButtonsMobile
          aria-label="Filter by device"
        >
          <Tab label="All devices" value="" />
          {filters.deviceId && !deviceExists && (
            <Tab
              label={`Device ${filters.deviceId}`}
              value={filters.deviceId}
            />
          )}
          {devices.map((device) => (
            <Tab
              key={device.id}
              label={device.name}
              value={String(device.id)}
            />
          ))}
        </Tabs>
      </Box>
      {filters.error ? (
        <Alert severity="error">
          Choose a valid date range to load entries.
        </Alert>
      ) : entries.length ? (
        <Stack spacing={2}>
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
          <EmptyState>No entries found for these filters.</EmptyState>
        </Paper>
      )}
    </>
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
