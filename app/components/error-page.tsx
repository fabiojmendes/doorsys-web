import { Alert, Button, Stack, Typography } from "@mui/material";
import { isRouteErrorResponse, Link, useRevalidator } from "react-router";
import { ApiError, errorMessage } from "../lib/api";
import { AuthenticationRequiredError } from "../lib/auth-state";
import { SignInPage } from "./sign-in-page";

export function ErrorPage({ error }: { error: unknown }) {
  const revalidator = useRevalidator();
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
  if (error instanceof AuthenticationRequiredError || status === 401)
    return <SignInPage />;
  return (
    <Stack
      spacing={2}
      sx={{ p: 2, maxWidth: "45rem", mx: "auto", width: "100%" }}
    >
      <Typography variant="h1">
        {status === 404
          ? "Page or record not found"
          : status === 403
            ? "Access denied"
            : "Unable to load this page"}
      </Typography>
      <Alert severity="error">
        {message || "Something went wrong. Please try again."}
      </Alert>
      <Stack direction="row" flexWrap="wrap" gap={1}>
        {status === 404 || status === 403 ? (
          <Button variant="contained" component={Link} to="/customers">
            Customers
          </Button>
        ) : (
          <Button
            variant="contained"
            disabled={revalidator.state !== "idle"}
            onClick={() => revalidator.revalidate()}
          >
            Try again
          </Button>
        )}
      </Stack>
    </Stack>
  );
}
