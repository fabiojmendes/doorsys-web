import LoginIcon from "@mui/icons-material/Login";
import { Alert, Box, Button, Paper, Stack, Typography } from "@mui/material";
import { useState } from "react";
import { errorMessage } from "../lib/api";
import { signIn } from "../lib/auth";

export function SignInPage({ message }: { message?: string }) {
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  async function authenticate() {
    setError("");
    setPending(true);
    try {
      await signIn();
    } catch (failure) {
      setError(errorMessage(failure));
    } finally {
      setPending(false);
    }
  }
  return (
    <Box
      component="main"
      sx={{ minHeight: "100dvh", display: "grid", placeItems: "center", p: 2 }}
    >
      <Paper variant="outlined" sx={{ width: "100%", maxWidth: 400, p: 3 }}>
        <Stack spacing={2}>
          <Typography variant="h2" color="primary.main">
            Doorsys
          </Typography>
          <Typography variant="h1">You are not signed in</Typography>
          <Typography color="text.secondary">
            Sign in to manage customers, staff, and access activity.
          </Typography>
          {(error || message) && (
            <Alert severity="error">{error || message}</Alert>
          )}
          <Button
            variant="contained"
            startIcon={<LoginIcon />}
            disabled={pending}
            onClick={authenticate}
          >
            {pending ? "Connecting to Auth0…" : "Sign in"}
          </Button>
        </Stack>
      </Paper>
    </Box>
  );
}
