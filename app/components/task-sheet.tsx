import CloseIcon from "@mui/icons-material/Close";
import {
  Alert,
  Box,
  Button,
  Drawer,
  IconButton,
  Stack,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { type ReactNode, useId, useState } from "react";
import { useFetchers } from "react-router";

export function TaskSheet({
  title,
  description,
  onClose,
  children,
}: {
  title: string;
  description?: string;
  onClose: () => void;
  children: ReactNode;
}) {
  const theme = useTheme();
  const desktop = useMediaQuery(theme.breakpoints.up("sm"));
  const titleId = useId();
  const [dirty, setDirty] = useState(false);
  const [warn, setWarn] = useState(false);
  const busy = useFetchers().some((fetcher) => fetcher.state !== "idle");
  function dismiss() {
    if (busy) return;
    if (dirty) setWarn(true);
    else onClose();
  }
  return (
    <Drawer
      open
      anchor={desktop ? "right" : "bottom"}
      onClose={dismiss}
      slotProps={{
        paper: {
          role: "dialog",
          "aria-modal": true,
          "aria-labelledby": titleId,
          sx: {
            width: desktop ? 440 : "100%",
            maxWidth: "100%",
            maxHeight: desktop ? "100dvh" : "92dvh",
            borderRadius: desktop ? "20px 0 0 20px" : "20px 20px 0 0",
            pb: "env(safe-area-inset-bottom)",
          },
        },
      }}
    >
      <Stack
        direction="row"
        alignItems="flex-start"
        justifyContent="space-between"
        gap={1}
        sx={{ px: 3, pt: 2, pb: 2 }}
      >
        <Stack spacing={0.5}>
          <Typography id={titleId} variant="h2">
            {title}
          </Typography>
          {description && (
            <Typography variant="body2" color="text.secondary">
              {description}
            </Typography>
          )}
        </Stack>
        <IconButton
          aria-label={`Close ${title.toLowerCase()}`}
          disabled={busy}
          onClick={dismiss}
        >
          <CloseIcon />
        </IconButton>
      </Stack>
      <Box
        sx={{ px: 3, pb: 3, overflowY: "auto" }}
        onChangeCapture={() => setDirty(true)}
      >
        {warn && (
          <Alert
            severity="warning"
            sx={{ mb: 2 }}
            action={
              <Button color="inherit" disabled={busy} onClick={onClose}>
                Discard
              </Button>
            }
          >
            You have unsaved changes.
          </Alert>
        )}
        {children}
      </Box>
    </Drawer>
  );
}
