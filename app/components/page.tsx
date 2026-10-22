import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import {
  Box,
  Button,
  CircularProgress,
  Stack,
  Typography,
} from "@mui/material";
import type { ReactNode } from "react";
import { Link, useNavigate } from "react-router";

export function PageHeader({
  title,
  back,
  action,
  description,
}: {
  title: string;
  back?: string;
  action?: ReactNode;
  description?: string;
}) {
  const navigate = useNavigate();
  return (
    <Stack spacing={1}>
      {back && (
        <Button
          component={Link}
          to={back}
          onClick={(event) => {
            if (
              event.button === 0 &&
              !event.metaKey &&
              !event.ctrlKey &&
              !event.shiftKey &&
              !event.altKey &&
              window.history.state?.idx > 0
            ) {
              event.preventDefault();
              navigate(-1);
            }
          }}
          startIcon={<ArrowBackIcon />}
          sx={{ alignSelf: "flex-start" }}
        >
          Back
        </Button>
      )}
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        gap={1}
      >
        <Stack spacing={0.5} sx={{ minWidth: 0, flex: 1 }}>
          <Typography variant="h1" sx={{ overflowWrap: "anywhere" }}>
            {title}
          </Typography>
          {description && (
            <Typography variant="body2" color="text.secondary">
              {description}
            </Typography>
          )}
        </Stack>
        {action}
      </Stack>
    </Stack>
  );
}

export function LoadingPage() {
  return (
    <Box
      role="status"
      aria-label="Loading"
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 2,
        p: 5,
      }}
    >
      <CircularProgress size={24} />
      <Typography>Loading Doorsys…</Typography>
    </Box>
  );
}

export function EmptyState({ children }: { children: ReactNode }) {
  return (
    <Typography color="text.secondary" sx={{ p: 3, textAlign: "center" }}>
      {children}
    </Typography>
  );
}
