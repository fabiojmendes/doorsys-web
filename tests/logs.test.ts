import { describe, expect, it } from "vitest";
import { datePreset, localDate, logFilters, logQuery } from "../app/lib/logs";

describe("log date filters", () => {
  it("uses calendar days for date presets across month and year boundaries", () => {
    const now = new Date(2026, 0, 1, 1, 30);
    expect(datePreset("today", now)).toEqual({
      startDate: "2026-01-01",
      endDate: "2026-01-01",
    });
    expect(datePreset("yesterday", now)).toEqual({
      startDate: "2025-12-31",
      endDate: "2025-12-31",
    });
    expect(datePreset("week", now)).toEqual({
      startDate: "2025-12-26",
      endDate: "2026-01-01",
    });
  });
  it("defaults to the local date and all customers/devices", () => {
    const filters = logFilters(new URLSearchParams());
    expect(filters).toEqual({
      startDate: localDate(),
      endDate: localDate(),
      customerId: "",
      deviceId: "",
      error: undefined,
    });
  });

  it("converts local day boundaries to ISO API parameters, including DST transitions", () => {
    const filters = logFilters(
      new URLSearchParams(
        "startDate=2026-03-08&endDate=2026-03-08&customerId=3&deviceId=2",
      ),
    );
    const query = logQuery(filters);
    expect(new Date(query.startDate).getHours()).toBe(0);
    expect(new Date(query.endDate).getHours()).toBe(23);
    expect(new Date(query.endDate).getMilliseconds()).toBe(999);
    expect(query).toMatchObject({ customerId: "3", deviceId: "2" });
    expect(query.startDate).toBe(new Date(2026, 2, 8, 0, 0, 0).toISOString());
    expect(query.endDate).toBe(
      new Date(2026, 2, 8, 23, 59, 59, 999).toISOString(),
    );
  });

  it("rejects inverted ranges and safely defaults malformed dates", () => {
    expect(
      logFilters(new URLSearchParams("startDate=2026-10-22&endDate=2026-10-21"))
        .error,
    ).toBeTruthy();
    expect(
      logFilters(new URLSearchParams("startDate=2026-02-31&endDate=invalid"))
        .startDate,
    ).toBe(localDate());
  });
});
