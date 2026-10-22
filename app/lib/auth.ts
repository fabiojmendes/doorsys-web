import {
  type Auth0Client,
  createAuth0Client,
  type User,
} from "@auth0/auth0-spa-js";
import { AuthenticationRequiredError, setAuthState } from "./auth-state";

interface Session {
  client: Auth0Client;
  user: User | undefined;
  returnTo?: string;
}

let session: Promise<Session> | undefined;
let login: Promise<void> | undefined;
let invalidated = false;

export function invalidateSession(message?: string) {
  invalidated = true;
  setAuthState({ status: "unauthenticated", message });
}

function requiresAuthentication(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "error" in error &&
    [
      "login_required",
      "consent_required",
      "interaction_required",
      "missing_refresh_token",
      "invalid_grant",
      "mfa_required",
    ].includes(String(error.error))
  );
}

export function internalPath(value: unknown, fallback = "/customers"): string {
  if (typeof value !== "string" || !value.startsWith("/")) return fallback;
  const origin = "https://doorsys.invalid";
  const url = new URL(value, origin);
  return url.origin === origin
    ? `${url.pathname}${url.search}${url.hash}`
    : fallback;
}

async function initialize(): Promise<Session> {
  const domain = import.meta.env.VITE_AUTH0_DOMAIN;
  const clientId = import.meta.env.VITE_AUTH0_CLIENT_ID;
  if (!domain || !clientId) {
    throw new Error(
      "Authentication is not configured. Set VITE_AUTH0_DOMAIN and VITE_AUTH0_CLIENT_ID, then rebuild the application.",
    );
  }
  const client = await createAuth0Client({
    domain,
    clientId,
    useRefreshTokens: true,
    cacheLocation: "localstorage",
    authorizationParams: {
      audience: "doorsys-api",
      redirect_uri:
        import.meta.env.VITE_AUTH0_CALLBACK_URL || window.location.origin,
    },
  });
  const params = new URLSearchParams(window.location.search);
  let returnTo: string | undefined;
  if (params.has("state") && (params.has("code") || params.has("error"))) {
    try {
      const result = await client.handleRedirectCallback();
      returnTo = internalPath(result.appState?.returnTo);
    } catch (error) {
      invalidateSession(
        error instanceof Error
          ? `Sign-in was not completed: ${error.message}`
          : "Sign-in was not completed. Please try again.",
      );
    } finally {
      // Never leave one-time callback parameters in browser history.
      params.delete("code");
      params.delete("state");
      params.delete("error");
      params.delete("error_description");
      const search = params.toString();
      window.history.replaceState(
        window.history.state,
        "",
        `${window.location.pathname}${search ? `?${search}` : ""}${window.location.hash}`,
      );
    }
  }
  return { client, user: undefined, returnTo };
}

export async function getSession(): Promise<Session> {
  if (!session) {
    session = initialize().catch((error: unknown) => {
      session = undefined;
      throw error;
    });
  }
  const result = await session;
  const authenticated = !invalidated && (await result.client.isAuthenticated());
  const user = authenticated ? await result.client.getUser() : undefined;
  result.user = invalidated ? undefined : user;
  if (result.user) setAuthState({ status: "authenticated", user: result.user });
  else if (!invalidated) setAuthState({ status: "unauthenticated" });
  return result;
}

export async function signIn(
  returnTo = `${window.location.pathname}${window.location.search}${window.location.hash}`,
): Promise<void> {
  const { client } = await getSession();
  if (!login) {
    login = client
      .loginWithRedirect({ appState: { returnTo: internalPath(returnTo) } })
      .finally(() => {
        login = undefined;
      });
  }
  await login;
}

export async function requireSession(): Promise<Session> {
  const result = await getSession();
  if (!result.user) throw new AuthenticationRequiredError();
  return result;
}

export async function accessToken(): Promise<string> {
  const { client } = await requireSession();
  try {
    return await client.getTokenSilently();
  } catch (error) {
    if (requiresAuthentication(error)) {
      invalidateSession("Your session has expired. Sign in to continue.");
      throw new AuthenticationRequiredError(
        "Your session has expired. Sign in to continue.",
      );
    }
    throw error;
  }
}

export async function signOut(): Promise<void> {
  const { client } = await getSession();
  await client.logout({ logoutParams: { returnTo: window.location.origin } });
  invalidateSession();
}
