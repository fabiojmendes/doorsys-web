import { Alert, Button, Stack, Typography } from "@mui/material";
import { useState } from "react";
import { isRouteErrorResponse, Link, useRevalidator } from "react-router";
import { ApiError, errorMessage } from "../lib/api";
import { signIn } from "../lib/auth";

export function ErrorPage({ error }: { error: unknown }) {
  const revalidator = useRevalidator();
  const [loginError, setLoginError] = useState("");
  const status = isRouteErrorResponse(error)
    ? error.status
    : error instanceof ApiError
      ? error.status
      : undefined;
  const message = isRouteErrorResponse(error)
    ? typeof error.data === "string"
      ? error.data
      : error.statusText
    : errorMessage(error);
  return (
    <Stack
      spacing={2}
      sx={{ p: 2, maxWidth: "45rem", mx: "auto", width: "100%" }}
    >
      <Typography variant="h1">
        {status === 404
          ? "Page or record not found"
          : "Unable to load this page"}
      </Typography>
      <Alert severity="error">
        {message || "Something went wrong. Please try again."}
      </Alert>
      {loginError && <Alert severity="error">{loginError}</Alert>}
      <Stack direction="row" flexWrap="wrap" gap={1}>
        <Button
          variant="contained"
          disabled={revalidator.state !== "idle"}
          onClick={() => revalidator.revalidate()}
        >
          Try again
        </Button>
        <Button component={Link} to="/customers">
          Customers
        </Button>
        <Button
          onClick={() => {
            setLoginError("");
            signIn().catch((failure: unknown) =>
              setLoginError(errorMessage(failure)),
            );
          }}
        >
          Sign in
        </Button>
      </Stack>
    </Stack>
  );
}
