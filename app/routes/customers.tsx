import AddIcon from "@mui/icons-material/Add";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import {
  Button,
  Chip,
  FormControlLabel,
  List,
  ListItemButton,
  ListItemText,
  Paper,
  Stack,
  Switch,
} from "@mui/material";
import { Link, useSearchParams } from "react-router";
import { ErrorPage } from "../components/error-page";
import { EmptyState, PageHeader } from "../components/page";
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

export default function Customers({
  loaderData: { active, customers },
}: Route.ComponentProps) {
  const [, setSearch] = useSearchParams();
  return (
    <>
      <PageHeader
        title="Customers"
        action={
          <Button
            component={Link}
            to="/customers/new"
            variant="contained"
            startIcon={<AddIcon />}
          >
            Add
          </Button>
        }
      />
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Chip
          label={`${customers.length} ${customers.length === 1 ? "customer" : "customers"}`}
          size="small"
        />
        <FormControlLabel
          control={
            <Switch
              checked={active}
              onChange={(_, checked) => setSearch({ active: String(checked) })}
            />
          }
          label="Active"
        />
      </Stack>
      <Paper variant="outlined">
        {customers.length ? (
          <List disablePadding aria-label="Customers">
            {customers.map((customer) => (
              <ListItemButton
                key={customer.id}
                component={Link}
                to={`/customers/${customer.id}`}
                divider
              >
                <ListItemText
                  primary={customer.name}
                  secondary={customer.email}
                  slotProps={{
                    primary: {
                      sx: {
                        fontWeight: 500,
                        overflowWrap: "anywhere",
                        textDecoration: customer.active
                          ? undefined
                          : "line-through",
                      },
                    },
                    secondary: { sx: { overflowWrap: "anywhere" } },
                  }}
                />
                <ChevronRightIcon color="action" />
              </ListItemButton>
            ))}
          </List>
        ) : (
          <EmptyState>
            No {active ? "active" : "inactive"} customers found.
          </EmptyState>
        )}
      </Paper>
    </>
  );
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  return <ErrorPage error={error} />;
}
