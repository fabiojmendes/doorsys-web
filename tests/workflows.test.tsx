import { act } from "react";
import {
  type ActionFunction,
  type LoaderFunction,
  useLoaderData,
} from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "../app/lib/api";
import { requireSession } from "../app/lib/auth";
import App, { clientLoader as rootLoader } from "../app/root";
import CustomerPage, {
  clientAction as customerAction,
  clientLoader as customerLoader,
} from "../app/routes/customer";
import NewCustomer, {
  clientAction as newCustomerAction,
} from "../app/routes/customer-new";
import Home from "../app/routes/home";
import Logs, { clientLoader as logsLoader } from "../app/routes/logs";
import StaffPage, {
  clientAction as staffAction,
  clientLoader as staffLoader,
} from "../app/routes/staff";
import { button, click, fill, input, renderRouter, settle } from "./render";

vi.mock("../app/lib/api", async (original) => ({
  ...(await original<typeof import("../app/lib/api")>()),
  api: vi.fn(),
}));
vi.mock("../app/lib/auth", () => ({
  requireSession: vi.fn(),
  signIn: vi.fn(),
  signOut: vi.fn(),
  accessToken: vi.fn(),
}));

const customer = {
  id: 7,
  name: "Acme",
  email: "acme@example.com",
  active: true,
  notes: "Original notes",
};
const staff = {
  id: 8,
  customerId: 7,
  name: "Alex",
  phone: "555-0100",
  fob: 42,
  pin: "1234",
  active: true,
};
const mockApi = vi.mocked(api);

function CustomerRoute() {
  return (
    <CustomerPage
      {...({ loaderData: useLoaderData() } as Parameters<
        typeof CustomerPage
      >[0])}
    />
  );
}
function StaffRoute() {
  return (
    <StaffPage
      {...({ loaderData: useLoaderData() } as Parameters<typeof StaffPage>[0])}
    />
  );
}
function LogsRoute() {
  return (
    <Logs
      {...({ loaderData: useLoaderData() } as Parameters<typeof Logs>[0])}
    />
  );
}

function RootRoute() {
  return (
    <App {...({ loaderData: useLoaderData() } as Parameters<typeof App>[0])} />
  );
}

const customerRoutes = [
  {
    path: "/customers/new",
    Component: NewCustomer,
    action: newCustomerAction as ActionFunction,
  },
  {
    path: "/customers/:id",
    Component: CustomerRoute,
    loader: customerLoader as LoaderFunction,
    action: customerAction as ActionFunction,
  },
];
const staffRoutes = [
  {
    path: "/staff/:id",
    Component: StaffRoute,
    loader: staffLoader as LoaderFunction,
    action: staffAction as ActionFunction,
  },
  ...customerRoutes,
];

beforeEach(() => {
  mockApi.mockReset();
  mockApi.mockImplementation(async (path, options) => {
    if (path === "/customers/7/staff") return [staff];
    if (path === "/customers/7") return customer;
    if (path === "/staff/8" && options?.method !== "DELETE") return staff;
    if (path === "/customers") return [customer];
    if (path === "/devices") return [{ id: 2, name: "Front door" }];
    if (path === "/entry_logs") return [];
    return undefined;
  });
});

describe("customer workflows", () => {
  it("cancels edits without changing saved customer values", async () => {
    await renderRouter(customerRoutes, "/customers/7");
    await click(button("Edit"));
    await fill(input("name"), "Unsaved change");
    await click(button("Cancel"));
    expect(document.body.textContent).toContain("Acme");
    expect(document.body.textContent).not.toContain("Unsaved change");
    await click(button("Edit"));
    expect(input("name").value).toBe("Acme");
    expect(
      mockApi.mock.calls.some(([, options]) => options?.method === "PUT"),
    ).toBe(false);
  });

  it("keeps failed creation errors and entered values inline, then redirects after retry", async () => {
    let fail = true;
    mockApi.mockImplementation(async (path, options) => {
      if (path === "/customers" && options?.method === "POST") {
        if (fail) throw new Error("Email is already registered");
        return customer;
      }
      if (path.endsWith("/staff")) return [];
      return customer;
    });
    const router = await renderRouter(customerRoutes, "/customers/new");
    await fill(input("name"), "Acme");
    await fill(input("email"), "acme@example.com");
    await click(button("Save"));
    await settle(() => Boolean(document.querySelector('[role="alert"]')));
    expect(document.querySelector('[role="alert"]')?.textContent).toContain(
      "Email is already registered",
    );
    expect(input("email").value).toBe("acme@example.com");
    expect(document.querySelector(".MuiSnackbar-root")).toBeNull();
    await fill(input("name"), "Acme updated");
    expect(document.querySelector('[role="alert"]')?.textContent).toContain(
      "Email is already registered",
    );
    fail = false;
    await click(button("Save"));
    await settle(() => router.state.location.pathname === "/customers/7");
    expect(document.querySelector('[role="alert"]')).toBeNull();
  });

  it("shows accessible field validation without making a request", async () => {
    await renderRouter(customerRoutes, "/customers/new");
    await click(button("Save"));
    await settle(() => input("name").getAttribute("aria-invalid") === "true");
    const helper = input("name").getAttribute("aria-describedby");
    expect(helper && document.getElementById(helper)?.textContent).toBe(
      "Enter a name.",
    );
    expect(mockApi).not.toHaveBeenCalled();
  });

  it("confirms a status change and sends a raw boolean", async () => {
    await renderRouter(customerRoutes, "/customers/7");
    await click(button("Deactivate"));
    const dialog = document.querySelector<HTMLElement>('[role="dialog"]');
    expect(dialog).not.toBeNull();
    if (!dialog) return;
    await click(button("Deactivate", dialog));
    await settle(() =>
      mockApi.mock.calls.some(([path]) => path.endsWith("/status")),
    );
    expect(mockApi).toHaveBeenCalledWith(
      "/customers/7/status",
      expect.objectContaining({ method: "PUT", body: false }),
    );
  });
});

describe("staff workflows", () => {
  it("adds staff to the customer, then resets the form and refreshes the list", async () => {
    let added = false;
    const newStaff = {
      ...staff,
      id: 9,
      name: "Taylor",
      phone: "555-0101",
      fob: null,
    };
    mockApi.mockImplementation(async (path, options) => {
      if (path === "/staff" && options?.method === "POST") {
        added = true;
        return newStaff;
      }
      if (path.endsWith("/staff")) return added ? [staff, newStaff] : [staff];
      return customer;
    });
    await renderRouter(customerRoutes, "/customers/7");
    await click(button("Add staff"));
    await fill(input("name"), "Taylor");
    await fill(input("phone"), "555-0101");
    await click(button("Add"));
    await settle(
      () =>
        document.body.textContent?.includes("Taylor") === true &&
        input("name").value === "",
    );
    expect(mockApi).toHaveBeenCalledWith(
      "/staff",
      expect.objectContaining({
        method: "POST",
        body: { customerId: 7, name: "Taylor", phone: "555-0101", fob: null },
      }),
    );
    expect(document.activeElement).toBe(input("name"));
  });

  it("normalizes an empty fob to null when saving", async () => {
    await renderRouter(staffRoutes, "/staff/8");
    await fill(input("fob"), "");
    await click(button("Save"));
    await settle(() =>
      mockApi.mock.calls.some(([, options]) => options?.method === "PUT"),
    );
    expect(mockApi).toHaveBeenCalledWith(
      "/staff/8",
      expect.objectContaining({ method: "PUT", body: { ...staff, fob: null } }),
    );
  });

  it("keeps failed PIN reset in its dialog, then updates the read-only PIN on retry", async () => {
    let pin = "1234";
    let fail = true;
    mockApi.mockImplementation(async (path) => {
      if (path.endsWith("/pin")) {
        if (fail) throw new Error("Device is unavailable");
        pin = "5678";
      }
      return { ...staff, pin };
    });
    await renderRouter(staffRoutes, "/staff/8");
    await click(button("Reset PIN"));
    let dialog = document.querySelector<HTMLElement>('[role="dialog"]');
    if (!dialog) throw new Error("Missing confirmation dialog");
    await click(button("Reset PIN", dialog));
    await settle(() =>
      Boolean(document.querySelector('[role="dialog"] [role="alert"]')),
    );
    expect(
      document.querySelector('[role="dialog"] [role="alert"]')?.textContent,
    ).toContain("Device is unavailable");
    expect(document.querySelector(".MuiSnackbar-root")).toBeNull();
    fail = false;
    dialog = document.querySelector<HTMLElement>('[role="dialog"]');
    if (!dialog) throw new Error("Error dismissed the dialog");
    await click(button("Reset PIN", dialog));
    await settle(() =>
      Array.from(document.querySelectorAll("input")).some(
        (element) => element.readOnly && element.value === "5678",
      ),
    );
    expect(mockApi).toHaveBeenCalledWith(
      "/staff/8/pin",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("returns to the owning customer after confirmed deletion", async () => {
    const router = await renderRouter(staffRoutes, "/staff/8");
    await click(button("Delete"));
    const dialog = document.querySelector<HTMLElement>('[role="dialog"]');
    if (!dialog) throw new Error("Missing deletion dialog");
    await click(button("Delete", dialog));
    await settle(() => router.state.location.pathname === "/customers/7");
    expect(mockApi).toHaveBeenCalledWith(
      "/staff/8",
      expect.objectContaining({ method: "DELETE" }),
    );
  });
});

describe("log workflows", () => {
  it("preserves a pending date change when a device filter is changed before loading completes", async () => {
    let release: (() => void) | undefined;
    let requests = 0;
    mockApi.mockImplementation(async (path) => {
      if (path === "/customers") return [customer];
      if (path === "/devices") return [{ id: 2, name: "Front door" }];
      if (path === "/entry_logs") {
        requests++;
        if (requests === 2)
          await new Promise<void>((resolve) => {
            release = resolve;
          });
        return [];
      }
      return undefined;
    });
    const router = await renderRouter(
      [
        {
          path: "/logs",
          Component: LogsRoute,
          loader: logsLoader as LoaderFunction,
        },
      ],
      "/logs?startDate=2026-10-20&endDate=2026-10-22",
    );
    const start =
      document.querySelector<HTMLInputElement>('input[type="date"]');
    if (!start) throw new Error("Missing start date");
    await fill(start, "2026-10-21");
    await settle(() => requests === 2);
    await click(button("Front door"));
    await settle(() => router.state.navigation.state === "idle");
    expect(router.state.location.search).toContain("startDate=2026-10-21");
    expect(router.state.location.search).toContain("deviceId=2");
    await act(async () => {
      release?.();
    });
    expect(router.state.location.search).toContain("deviceId=2");
  });

  it("shows deleted staff without a dead staff link and keeps outcome labels readable", async () => {
    mockApi.mockImplementation(async (path) => {
      if (path === "/customers") return [customer];
      if (path === "/devices") return [];
      return [
        {
          eventDate: "2026-10-22T10:00:00Z",
          staffId: 8,
          staffName: "Alex",
          staffDeleted: "2026-10-21",
          customerId: 7,
          customerName: "Acme",
          code: "1234",
          codeType: "pin",
          success: false,
        },
      ];
    });
    await renderRouter(
      [
        {
          path: "/logs",
          Component: LogsRoute,
          loader: logsLoader as LoaderFunction,
        },
      ],
      "/logs",
    );
    expect(document.body.textContent).toContain("Alex (deleted)");
    expect(document.body.textContent).toContain("Invalid attempt");
    expect(document.querySelector('a[href="/staff/8"]')).toBeNull();
    expect(document.querySelector('a[href="/customers/7"]')).not.toBeNull();
  });

  it("restores bookmarked filters and reloads when selecting a device", async () => {
    const router = await renderRouter(
      [
        {
          path: "/logs",
          Component: LogsRoute,
          loader: logsLoader as LoaderFunction,
        },
      ],
      "/logs?startDate=2026-10-21&endDate=2026-10-22&customerId=7",
    );
    expect(mockApi).toHaveBeenCalledWith(
      "/entry_logs",
      expect.objectContaining({
        query: expect.objectContaining({ customerId: "7", deviceId: null }),
      }),
    );
    await click(button("Front door"));
    await settle(() => router.state.location.search.includes("deviceId=2"));
    expect(mockApi).toHaveBeenCalledWith(
      "/entry_logs",
      expect.objectContaining({
        query: expect.objectContaining({ customerId: "7", deviceId: "2" }),
      }),
    );
    await act(async () => {
      await router.navigate(-1);
    });
  });

  it("does not query entries for an inverted range", async () => {
    await renderRouter(
      [
        {
          path: "/logs",
          Component: LogsRoute,
          loader: logsLoader as LoaderFunction,
        },
      ],
      "/logs?startDate=2026-10-22&endDate=2026-10-21",
    );
    expect(document.querySelector('[role="alert"]')?.textContent).toContain(
      "valid date range",
    );
    expect(mockApi.mock.calls.some(([path]) => path === "/entry_logs")).toBe(
      false,
    );
  });
});

describe("callback navigation", () => {
  it("restores the requested route before the home redirect can run", async () => {
    vi.mocked(requireSession).mockResolvedValue({
      user: { name: "Operator" },
      returnTo: "/staff/8",
    } as Awaited<ReturnType<typeof requireSession>>);
    const router = await renderRouter(
      [
        {
          path: "/",
          Component: RootRoute,
          loader: rootLoader as LoaderFunction,
          children: [
            { index: true, Component: Home },
            { path: "staff/8", element: <span>Requested staff route</span> },
            {
              path: "customers",
              element: <span>Default customers route</span>,
            },
          ],
        },
      ],
      "/?code=callback&state=state",
    );
    await settle(() => router.state.location.pathname === "/staff/8");
    expect(document.body.textContent).toContain("Requested staff route");
    await act(async () => {
      await router.navigate("/");
    });
    await settle(() => router.state.location.pathname === "/customers");
  });
});
