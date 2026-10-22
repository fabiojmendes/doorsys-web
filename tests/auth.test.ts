import { beforeEach, describe, expect, it, vi } from "vitest";

const client = vi.hoisted(() => ({
  getUser: vi.fn(),
  isAuthenticated: vi.fn(),
  handleRedirectCallback: vi.fn(),
  loginWithRedirect: vi.fn(),
  logout: vi.fn(),
  getTokenSilently: vi.fn(),
}));
const createClient = vi.hoisted(() => vi.fn());
vi.mock("@auth0/auth0-spa-js", () => ({ createAuth0Client: createClient }));

describe("authentication", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.resetAllMocks();
    vi.stubEnv("VITE_AUTH0_DOMAIN", "tenant.us.auth0.com");
    vi.stubEnv("VITE_AUTH0_CLIENT_ID", "client-id");
    vi.stubEnv("VITE_AUTH0_CALLBACK_URL", "");
    window.history.replaceState(null, "", "/customers");
    createClient.mockResolvedValue(client);
    client.getUser.mockResolvedValue({ name: "Operator" });
    client.isAuthenticated.mockResolvedValue(true);
    client.loginWithRedirect.mockResolvedValue(undefined);
  });

  it("handles a callback once before providing a token and restores the internal path", async () => {
    window.history.replaceState({ idx: 0 }, "", "/?code=one-time&state=state");
    client.handleRedirectCallback.mockResolvedValue({
      appState: { returnTo: "/staff/8" },
    });
    client.getTokenSilently.mockResolvedValue("token");
    const auth = await import("../app/lib/auth");
    const [session, token] = await Promise.all([
      auth.getSession(),
      auth.accessToken(),
    ]);
    expect(session.returnTo).toBe("/staff/8");
    expect(token).toBe("token");
    expect(client.handleRedirectCallback).toHaveBeenCalledTimes(1);
    expect(window.location.search).toBe("");
    expect(window.history.state).toEqual({ idx: 0 });
    expect(createClient).toHaveBeenCalledWith(
      expect.objectContaining({
        cacheLocation: "localstorage",
        useRefreshTokens: true,
        authorizationParams: {
          audience: "doorsys-api",
          redirect_uri: window.location.origin,
        },
      }),
    );
  });

  it("shares initialization and redirects unauthenticated users with their requested path", async () => {
    client.isAuthenticated.mockResolvedValue(false);
    const auth = await import("../app/lib/auth");
    await expect(auth.requireSession("/logs?deviceId=2")).rejects.toThrow(
      "Redirecting",
    );
    expect(client.loginWithRedirect).toHaveBeenCalledWith({
      appState: { returnTo: "/logs?deviceId=2" },
    });
    expect(createClient).toHaveBeenCalledTimes(1);
  });

  it("reports callback failures without repeatedly consuming the callback", async () => {
    window.history.replaceState(null, "", "/?error=access_denied&state=state");
    client.handleRedirectCallback.mockRejectedValue(new Error("Access denied"));
    const auth = await import("../app/lib/auth");
    await expect(auth.getSession()).rejects.toThrow("Access denied");
    await auth.getSession();
    expect(client.handleRedirectCallback).toHaveBeenCalledTimes(1);
    expect(window.location.search).toBe("");
  });

  it("rejects external redirect destinations and logs out to the origin", async () => {
    const auth = await import("../app/lib/auth");
    expect(auth.internalPath("//attacker.example/path")).toBe("/customers");
    expect(auth.internalPath("/\\attacker.example/path")).toBe("/customers");
    expect(auth.internalPath("https://attacker.example")).toBe("/customers");
    await auth.signOut();
    expect(client.logout).toHaveBeenCalledWith({
      logoutParams: { returnTo: window.location.origin },
    });
  });
});
