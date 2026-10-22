import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import HistoryIcon from "@mui/icons-material/History";
import {
  Alert,
  Button,
  Chip,
  Link as MuiLink,
  Paper,
  Stack,
  Tab,
  Tabs,
  Typography,
} from "@mui/material";
import { useState } from "react";
import { Link } from "react-router";
import { ConfirmAction } from "../components/confirm-action";
import { CustomerForm } from "../components/customer-form";
import { ErrorPage } from "../components/error-page";
import { PageHeader } from "../components/page";
import { RecordAvatar } from "../components/record-avatar";
import { StaffList } from "../components/staff-list";
import { TaskSheet } from "../components/task-sheet";
import { api, errorMessage } from "../lib/api";
import { customerFields, staffFields, value } from "../lib/forms";
import type { Customer, MutationResult, Staff } from "../lib/types";
import type { Route } from "./+types/customer";

export async function clientLoader({
  params,
  request,
}: Route.ClientLoaderArgs) {
  const [customer, staff] = await Promise.all([
    api<Customer>(`/customers/${params.id}`, { signal: request.signal }),
    api<Staff[]>(`/customers/${params.id}/staff`, { signal: request.signal }),
  ]);
  return { customer, staff };
}

export async function clientAction({
  params,
  request,
}: Route.ClientActionArgs): Promise<MutationResult> {
  const form = await request.formData();
  const path = `/customers/${params.id}`;
  const signal = request.signal;
  try {
    switch (value(form, "intent")) {
      case "save": {
        const { body, fields } = customerFields(form);
        if (Object.keys(fields).length) return { ok: false, fields };
        const current = await api<Customer>(path, { signal });
        await api<Customer>(path, {
          method: "PUT",
          body: { ...current, ...body },
          signal,
        });
        return { ok: true, message: "Customer saved." };
      }
      case "status": {
        await api<Customer>(`${path}/status`, {
          method: "PUT",
          body: value(form, "active") === "true",
          signal,
        });
        return { ok: true, message: "Customer status updated." };
      }
      case "add-staff": {
        const { body, fields } = staffFields(form);
        if (Object.keys(fields).length) return { ok: false, fields };
        const customer = await api<Customer>(path, { signal });
        if (!customer.active)
          return {
            ok: false,
            error: "Activate this customer before adding staff.",
          };
        await api<Staff>("/staff", {
          method: "POST",
          body: { ...body, customerId: customer.id },
          signal,
        });
        return { ok: true, message: "Staff member added." };
      }
      default:
        return { ok: false, error: "This action is not supported." };
    }
  } catch (error) {
    return { ok: false, error: errorMessage(error) };
  }
}

export default function CustomerPage({ loaderData }: Route.ComponentProps) {
  return <CustomerDetail key={loaderData.customer.id} {...loaderData} />;
}

function CustomerDetail({
  customer,
  staff,
}: {
  customer: Customer;
  staff: Staff[];
}) {
  const [editing, setEditing] = useState(false);
  const [tab, setTab] = useState("staff");
  return (
    <>
      <PageHeader
        title={customer.name}
        back="/customers"
        action={
          <Button
            startIcon={<EditOutlinedIcon />}
            onClick={() => setEditing(true)}
          >
            Edit
          </Button>
        }
      />
      {!customer.active && (
        <Alert severity="info">
          This customer is inactive. Existing staff are listed below.
        </Alert>
      )}
      <Paper variant="outlined" sx={{ p: 2 }}>
        <Stack direction="row" spacing={2} alignItems="center">
          <RecordAvatar name={customer.name} large />
          <Stack spacing={0.5} sx={{ minWidth: 0 }}>
            <Chip
              size="small"
              label={customer.active ? "Active" : "Inactive"}
              color={customer.active ? "success" : "default"}
              variant="outlined"
              sx={{ alignSelf: "flex-start" }}
            />
            <MuiLink
              href={`mailto:${customer.email}`}
              variant="body2"
              sx={{ overflowWrap: "anywhere" }}
            >
              {customer.email}
            </MuiLink>
            <Typography variant="caption" color="text.secondary">
              {staff.filter((member) => member.active).length} active of{" "}
              {staff.length} staff members
            </Typography>
          </Stack>
        </Stack>
        <Button
          component={Link}
          to={`/logs?customerId=${encodeURIComponent(customer.id)}`}
          startIcon={<HistoryIcon />}
          sx={{ mt: 1 }}
        >
          View activity
        </Button>
      </Paper>
      <Tabs
        value={tab}
        onChange={(_, value: string) => setTab(value)}
        aria-label="Customer workspace"
      >
        <Tab
          label="Staff"
          value="staff"
          id="customer-staff-tab"
          aria-controls="customer-staff-panel"
        />
        <Tab
          label="Details"
          value="details"
          id="customer-details-tab"
          aria-controls="customer-details-panel"
        />
      </Tabs>
      <Stack
        role="tabpanel"
        id={tab === "staff" ? "customer-staff-panel" : "customer-details-panel"}
        aria-labelledby={
          tab === "staff" ? "customer-staff-tab" : "customer-details-tab"
        }
        spacing={2}
      >
        {tab === "staff" ? (
          <StaffList customer={customer} staff={staff} />
        ) : (
          <>
            <Paper variant="outlined" sx={{ p: 2 }}>
              <Stack spacing={1}>
                <Typography variant="h2">Notes</Typography>
                <Typography
                  color={customer.notes ? "text.primary" : "text.secondary"}
                  sx={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}
                >
                  {customer.notes || "No notes added."}
                </Typography>
              </Stack>
            </Paper>
            <Paper variant="outlined" sx={{ p: 2 }}>
              <Stack spacing={1.5}>
                <Typography variant="h2">Account status</Typography>
                <Typography variant="body2" color="text.secondary">
                  {customer.active
                    ? "Deactivate this account when it should no longer be in use."
                    : "Activate this account to add staff and manage their access."}
                </Typography>
                <Stack direction="row">
                  <ConfirmAction
                    label={customer.active ? "Deactivate" : "Activate"}
                    description={`${customer.active ? "Deactivate" : "Activate"} ${customer.name}?`}
                    intent="status"
                    fields={{ active: String(!customer.active) }}
                  />
                </Stack>
              </Stack>
            </Paper>
          </>
        )}
      </Stack>
      {editing && (
        <TaskSheet
          title="Edit customer"
          description="Update contact information without leaving this workspace."
          onClose={() => setEditing(false)}
        >
          <CustomerForm
            customer={customer}
            onCancel={() => setEditing(false)}
            onSaved={() => setEditing(false)}
          />
        </TaskSheet>
      )}
    </>
  );
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  return <ErrorPage error={error} />;
}
