import { afterEach, vi } from "vitest";

Object.defineProperty(globalThis, "IS_REACT_ACT_ENVIRONMENT", {
  value: true,
  writable: true,
});

afterEach(() => {
  vi.unstubAllEnvs();
});
