import { ThemeProvider } from "@mui/material";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import {
  createMemoryRouter,
  type RouteObject,
  RouterProvider,
} from "react-router";
import { afterEach } from "vitest";
import { FeedbackProvider } from "../app/components/feedback";
import { theme } from "../app/theme";

const mounted: {
  root: Root;
  router: ReturnType<typeof createMemoryRouter>;
  container: HTMLDivElement;
}[] = [];

afterEach(async () => {
  for (const item of mounted.splice(0)) {
    await act(async () => {
      item.root.unmount();
      item.router.dispose();
    });
    item.container.remove();
  }
});

export async function renderRouter(routes: RouteObject[], initial: string) {
  const container = document.createElement("div");
  document.body.append(container);
  const router = createMemoryRouter(
    routes.map((route) => ({
      HydrateFallback: () => <span>Loading</span>,
      ...route,
    })),
    { initialEntries: [initial] },
  );
  const root = createRoot(container);
  mounted.push({ root, router, container });
  await act(async () => {
    root.render(
      <ThemeProvider theme={theme}>
        <FeedbackProvider>
          <RouterProvider router={router} />
        </FeedbackProvider>
      </ThemeProvider>,
    );
  });
  await settle(() => router.state.initialized);
  return router;
}

export async function settle(condition: () => boolean) {
  for (let attempt = 0; attempt < 100; attempt++) {
    if (condition()) return;
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 10));
    });
  }
  throw new Error(`UI did not settle: ${document.body.textContent}`);
}

export function button(
  text: string,
  root: ParentNode = document,
): HTMLButtonElement {
  const result = Array.from(root.querySelectorAll("button")).find(
    (element) => element.textContent?.trim() === text,
  );
  if (!result) throw new Error(`Button '${text}' not found`);
  return result;
}

export async function click(element: HTMLElement) {
  await act(async () => {
    element.click();
  });
}

export function input(name: string): HTMLInputElement {
  const element = document.querySelector<HTMLInputElement>(
    `input[name="${name}"]`,
  );
  if (!element) throw new Error(`Input '${name}' not found`);
  return element;
}

export async function fill(element: HTMLInputElement, value: string) {
  await act(async () => {
    const setter = Object.getOwnPropertyDescriptor(
      HTMLInputElement.prototype,
      "value",
    )?.set;
    setter?.call(element, value);
    element.dispatchEvent(new Event("input", { bubbles: true }));
    element.dispatchEvent(new Event("change", { bubbles: true }));
  });
}
