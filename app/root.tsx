import { CssBaseline, ThemeProvider } from "@mui/material";
import type { ReactNode } from "react";
import {
  Links,
  Meta,
  Outlet,
  replace,
  Scripts,
  ScrollRestoration,
} from "react-router";
import type { Route } from "./+types/root";
import { ErrorPage } from "./components/error-page";
import { LoadingPage } from "./components/page";
import { Shell } from "./components/shell";
import { requireSession } from "./lib/auth";
import { theme } from "./theme";

export function meta() {
  return [
    { title: "Doorsys" },
    { name: "description", content: "Doorsys access management" },
  ];
}

export function links() {
  return [{ rel: "icon", type: "image/png", href: "/favicon.png" }];
}

export async function clientLoader({ request }: Route.ClientLoaderArgs) {
  const url = new URL(request.url);
  const session = await requireSession(
    `${url.pathname}${url.search}${url.hash}`,
  );
  if (session.returnTo) {
    const returnTo = session.returnTo;
    session.returnTo = undefined;
    return replace(returnTo);
  }
  return { user: session.user };
}

export function Layout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, viewport-fit=cover"
        />
        <Meta />
        <Links />
      </head>
      <body>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          {children}
        </ThemeProvider>
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export function HydrateFallback() {
  return <LoadingPage />;
}

export default function App({ loaderData }: Route.ComponentProps) {
  return (
    <Shell user={loaderData.user}>
      <Outlet />
    </Shell>
  );
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  return <ErrorPage error={error} />;
}
