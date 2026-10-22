import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Button,
  Chip,
  Divider,
  IconButton,
  InputAdornment,
  Link as MuiLink,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useState } from "react";
import { replace } from "react-router";
import { ConfirmAction } from "../components/confirm-action";
import { ErrorPage } from "../components/error-page";
import { RequestError } from "../components/feedback";
import { PageHeader } from "../components/page";
import { RecordAvatar } from "../components/record-avatar";
import { StaffForm } from "../components/staff-form";
import { TaskSheet } from "../components/task-sheet";
import { api, errorMessage } from "../lib/api";
import { staffFields, value } from "../lib/forms";
import type { MutationResult, Staff } from "../lib/types";
import type { Route } from "./+types/staff";

export async function clientLoader({
  params,
  request,
}: Route.ClientLoaderArgs) {
  return {
    staff: await api<Staff>(`/staff/${params.id}`, { signal: request.signal }),
  };
}

export async function clientAction({
  params,
  request,
}: Route.ClientActionArgs): Promise<MutationResult | Response> {
  const form = await request.formData();
  const path = `/staff/${params.id}`;
  const signal = request.signal;
  try {
    switch (value(form, "intent")) {
      case "save": {
        const { body, fields } = staffFields(form);
        if (Object.keys(fields).length) return { ok: false, fields };
        const staff = await api<Staff>(path, { signal });
        await api<Staff>(path, {
          method: "PUT",
          body: { ...staff, ...body },
          signal,
        });
        return { ok: true, message: "Staff member saved." };
      }
      case "pin":
        await api<Staff>(`${path}/pin`, { method: "POST", signal });
        return { ok: true, message: "PIN reset." };
      case "status":
        await api<Staff>(`${path}/status`, {
          method: "PUT",
          body: value(form, "active") === "true",
          signal,
        });
        return { ok: true, message: "Staff status updated." };
      case "delete": {
        const staff = await api<Staff>(path, { signal });
        await api<void>(path, { method: "DELETE", signal });
        return replace(
          staff.customerId != null
            ? `/customers/${encodeURIComponent(staff.customerId)}`
            : "/customers",
        );
      }
      default:
        return { ok: false, error: "This action is not supported." };
    }
  } catch (error) {
    return { ok: false, error: errorMessage(error) };
  }
}

export default function StaffPage({
  loaderData: { staff },
}: Route.ComponentProps) {
  return <StaffDetail key={staff.id} staff={staff} />;
}

function StaffDetail({ staff }: { staff: Staff }) {
  const [editing, setEditing] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [copyResult, setCopyResult] = useState<{
    pin: string;
    error?: string;
  }>();
  const [copying, setCopying] = useState(false);
  const back =
    staff.customerId != null ? `/customers/${staff.customerId}` : "/customers";
  async function copyPin() {
    setCopyResult(undefined);
    setCopying(true);
    try {
      if (!navigator.clipboard?.writeText)
        throw new Error(
          "Your browser cannot copy the PIN. Reveal it and copy it manually.",
        );
      await navigator.clipboard.writeText(String(staff.pin));
      setCopyResult({ pin: String(staff.pin) });
    } catch (error) {
      setCopyResult({ pin: String(staff.pin), error: errorMessage(error) });
    } finally {
      setCopying(false);
    }
  }
  return (
    <>
      <PageHeader
        title={staff.name}
        back={back}
        action={
          <Button
            startIcon={<EditOutlinedIcon />}
            onClick={() => setEditing(true)}
          >
            Edit
          </Button>
        }
      />
      {!staff.active && (
        <Alert severity="info">This staff member is inactive.</Alert>
      )}
      <Paper variant="outlined" sx={{ p: 2 }}>
        <Stack direction="row" spacing={2} alignItems="center">
          <RecordAvatar name={staff.name} large />
          <Stack spacing={0.5} sx={{ minWidth: 0 }}>
            <Chip
              size="small"
              label={staff.active ? "Active" : "Inactive"}
              color={staff.active ? "success" : "default"}
              variant="outlined"
              sx={{ alignSelf: "flex-start" }}
            />
            <MuiLink
              href={`tel:${staff.phone}`}
              sx={{ overflowWrap: "anywhere" }}
            >
              {staff.phone}
            </MuiLink>
          </Stack>
        </Stack>
      </Paper>
      <Paper variant="outlined" sx={{ p: 2 }}>
        <Stack spacing={2}>
          <Stack spacing={0.5}>
            <Typography variant="h2">Access credentials</Typography>
            <Typography variant="body2" color="text.secondary">
              View, copy, or replace a credential.
            </Typography>
          </Stack>
          <TextField
            label="PIN"
            type={revealed ? "text" : "password"}
            value={staff.pin ?? ""}
            placeholder="Not assigned"
            autoComplete="off"
            slotProps={{
              input: {
                readOnly: true,
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label={revealed ? "Hide PIN" : "Reveal PIN"}
                      aria-pressed={revealed}
                      onClick={() => setRevealed(!revealed)}
                      disabled={!staff.pin}
                    >
                      {revealed ? <VisibilityOffIcon /> : <VisibilityIcon />}
                    </IconButton>
                  </InputAdornment>
                ),
              },
              htmlInput: {
                style: {
                  letterSpacing: "0.2em",
                  fontVariantNumeric: "tabular-nums",
                },
              },
            }}
          />
          <RequestError
            message={
              copyResult?.pin === String(staff.pin)
                ? copyResult.error
                : undefined
            }
          />
          {copyResult?.pin === String(staff.pin) && !copyResult.error && (
            <Typography role="status" variant="body2" color="success.main">
              PIN copied.
            </Typography>
          )}
          <Stack direction="row" flexWrap="wrap" gap={1}>
            <Button
              startIcon={<ContentCopyIcon />}
              variant="outlined"
              onClick={copyPin}
              disabled={!staff.pin || copying}
            >
              {copying ? "Copying…" : "Copy PIN"}
            </Button>
            <ConfirmAction
              label="Reset PIN"
              description={`Generate a new PIN for ${staff.name}? The current PIN will stop working.`}
              intent="pin"
            />
          </Stack>
          <Divider />
          <Stack direction="row" justifyContent="space-between" gap={1}>
            <Typography variant="body2" color="text.secondary">
              Fob
            </Typography>
            <Typography variant="body2" fontWeight={600}>
              {staff.fob || "Not assigned"}
            </Typography>
          </Stack>
        </Stack>
      </Paper>
      <Accordion
        disableGutters
        elevation={0}
        sx={{
          border: 1,
          borderColor: "divider",
          borderRadius: "16px !important",
          "&::before": { display: "none" },
        }}
      >
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography fontWeight={600}>Manage access</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Stack spacing={2}>
            <Typography variant="body2" color="text.secondary">
              Change access status or permanently remove this staff member.
            </Typography>
            <Stack direction="row" flexWrap="wrap" gap={1}>
              <ConfirmAction
                label={staff.active ? "Deactivate" : "Activate"}
                description={`${staff.active ? "Deactivate" : "Activate"} ${staff.name}?`}
                intent="status"
                fields={{ active: String(!staff.active) }}
              />
              <ConfirmAction
                label="Delete"
                description={`Permanently delete ${staff.name}? This cannot be undone.`}
                intent="delete"
                danger
              />
            </Stack>
          </Stack>
        </AccordionDetails>
      </Accordion>
      {editing && (
        <TaskSheet
          title="Edit staff"
          description="Update contact details or assign a fob."
          onClose={() => setEditing(false)}
        >
          <StaffForm
            staff={staff}
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
