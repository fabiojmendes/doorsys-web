import AddIcon from "@mui/icons-material/Add";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import CloseIcon from "@mui/icons-material/Close";
import SearchIcon from "@mui/icons-material/Search";
import {
  Button,
  Chip,
  IconButton,
  InputAdornment,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Paper,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import { useState } from "react";
import {
  Link,
  type ShouldRevalidateFunctionArgs,
  useNavigation,
  useSearchParams,
} from "react-router";
import { CustomerForm } from "../components/customer-form";
import { ErrorPage } from "../components/error-page";
import { EmptyState, PageHeader } from "../components/page";
import { RecordAvatar } from "../components/record-avatar";
import { TaskSheet } from "../components/task-sheet";
import { api } from "../lib/api";
import type { Customer } from "../lib/types";
import type { Route } from "./+types/customers";

export async function clientLoader({ request }: Route.ClientLoaderArgs) {
  const active = new URL(request.url).searchParams.get("active") !== "false";
  return {
    active,
    customers: await api<Customer[]>("/customers", {
      query: { active },
      signal: request.signal,
    }),
  };
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
    (currentUrl.searchParams.get("active") !== "false") ===
      (nextUrl.searchParams.get("active") !== "false")
  )
    return false;
  return defaultShouldRevalidate;
}

export default function Customers({
  loaderData: { active: loadedActive, customers },
}: Route.ComponentProps) {
  const [search, setSearch] = useSearchParams();
  const navigation = useNavigation();
  const pending =
    navigation.location?.pathname === "/customers"
      ? new URLSearchParams(navigation.location.search)
      : search;
  const active =
    navigation.location?.pathname === "/customers"
      ? pending.get("active") !== "false"
      : loadedActive;
  const query = search.get("q") || "";
  const [creating, setCreating] = useState(false);
  const visible = customers.filter((customer) =>
    `${customer.name} ${customer.email}`
      .toLocaleLowerCase()
      .includes(query.trim().toLocaleLowerCase()),
  );
  function filter(key: string, value: string) {
    const next = new URLSearchParams(pending);
    if (value) next.set(key, value);
    else next.delete(key);
    setSearch(next, { replace: true });
  }
  return (
    <>
      <PageHeader
        title="Customers"
        description="People, teams, and their access."
        action={
          <Button
            aria-label="New customer"
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setCreating(true)}
          >
            New
          </Button>
        }
      />
      <TextField
        label="Search customers"
        placeholder="Name or email"
        value={query}
        onChange={(event) => filter("q", event.target.value)}
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon color="action" />
              </InputAdornment>
            ),
            endAdornment: query ? (
              <InputAdornment position="end">
                <IconButton
                  aria-label="Clear search"
                  size="small"
                  onClick={() => filter("q", "")}
                >
                  <CloseIcon fontSize="small" />
                </IconButton>
              </InputAdornment>
            ) : undefined,
          },
        }}
      />
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        gap={1}
      >
        <ToggleButtonGroup
          exclusive
          value={active ? "true" : "false"}
          size="small"
          aria-label="Customer status"
          onChange={(_, value: string | null) => {
            if (value) filter("active", value);
          }}
        >
          <ToggleButton value="true">Active</ToggleButton>
          <ToggleButton value="false">Inactive</ToggleButton>
        </ToggleButtonGroup>
        <Typography variant="body2" color="text.secondary" aria-live="polite">
          {visible.length} {visible.length === 1 ? "customer" : "customers"}
        </Typography>
      </Stack>
      <Paper variant="outlined" aria-busy={navigation.state !== "idle"}>
        {visible.length ? (
          <List disablePadding aria-label="Customers">
            {visible.map((customer) => (
              <ListItem key={customer.id} disablePadding>
                <ListItemButton
                  key={customer.id}
                  component={Link}
                  to={`/customers/${customer.id}`}
                  divider
                  sx={{ gap: 1.5, py: 1.5 }}
                >
                  <RecordAvatar name={customer.name} />
                  <ListItemText
                    primary={customer.name}
                    secondary={customer.email}
                    slotProps={{
                      primary: {
                        sx: { fontWeight: 600, overflowWrap: "anywhere" },
                      },
                      secondary: { sx: { overflowWrap: "anywhere" } },
                    }}
                  />
                  {!customer.active && <Chip label="Inactive" size="small" />}
                  <ChevronRightIcon color="action" fontSize="small" />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        ) : (
          <Stack alignItems="center" sx={{ py: 2 }}>
            <EmptyState>
              {query
                ? `No customers match “${query}”.`
                : `No ${active ? "active" : "inactive"} customers yet.`}
            </EmptyState>
            {query ? (
              <Button onClick={() => filter("q", "")}>Clear search</Button>
            ) : (
              <Button onClick={() => setCreating(true)} startIcon={<AddIcon />}>
                Create your first customer
              </Button>
            )}
          </Stack>
        )}
      </Paper>
      {creating && (
        <TaskSheet
          title="New customer"
          description="Start with contact details. Add staff next."
          onClose={() => setCreating(false)}
        >
          <CustomerForm
            action="/customers/new"
            onCancel={() => setCreating(false)}
          />
        </TaskSheet>
      )}
    </>
  );
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  return <ErrorPage error={error} />;
}
