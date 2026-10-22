import { beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "../app/lib/api";
import { accessToken, invalidateSession } from "../app/lib/auth";
import { AuthenticationRequiredError } from "../app/lib/auth-state";

vi.mock("../app/lib/auth", () => ({
  accessToken: vi.fn(),
  invalidateSession: vi.fn(),
}));

describe("API compatibility", () => {
  beforeEach(() => {
    vi.mocked(accessToken).mockResolvedValue("access-token");
  });

  it("sends authenticated boolean status bodies and propagates cancellation", async () => {
    const fetch = vi
      .fn()
      .mockResolvedValue(new Response(JSON.stringify({ active: false })));
    vi.stubGlobal("fetch", fetch);
    const controller = new AbortController();
    await api("/customers/7/status", {
      method: "PUT",
      body: false,
      signal: controller.signal,
    });
    expect(fetch).toHaveBeenCalledWith(
      "/api/customers/7/status",
      expect.objectContaining({
        method: "PUT",
        body: "false",
        signal: controller.signal,
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer access-token",
        },
      }),
    );
  });

  it("serializes false filters and omits unselected filters", async () => {
    const fetch = vi.fn().mockResolvedValue(new Response("[]"));
    vi.stubGlobal("fetch", fetch);
    await api("/customers", {
      query: { active: false, customerId: null, deviceId: "" },
    });
    expect(fetch.mock.calls[0][0]).toBe("/api/customers?active=false");
  });

  it.each([
    [
      JSON.stringify({ msg: "Customer already exists" }),
      "Customer already exists",
    ],
    ["Invalid fob", "Invalid fob"],
    ["<html>Proxy failed</html>", "The request failed. Please try again."],
  ])("preserves readable API errors (%s)", async (body, message) => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response(body, { status: 400 })),
    );
    await expect(api("/staff")).rejects.toMatchObject({ message, status: 400 });
  });

  it("handles empty delete responses", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response(null, { status: 204 })),
    );
    await expect(
      api("/staff/8", { method: "DELETE" }),
    ).resolves.toBeUndefined();
  });

  it("does not issue unauthenticated requests when token acquisition fails", async () => {
    vi.mocked(accessToken).mockRejectedValue(new Error("Login required"));
    const fetch = vi.fn();
    vi.stubGlobal("fetch", fetch);
    await expect(api("/customers")).rejects.toThrow("Login required");
    expect(fetch).not.toHaveBeenCalled();
  });

  it("provides a sign-in explanation for an empty 401 response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response(null, { status: 401 })),
    );
    await expect(api("/customers")).rejects.toBeInstanceOf(
      AuthenticationRequiredError,
    );
    expect(invalidateSession).toHaveBeenCalledWith(
      "Your session has expired. Sign in to continue.",
    );
  });
});
