import { describe, expect, it } from "vitest";

import { calculateFine } from "../src/api/borrow-requests.js";

describe("borrow-request fine calculation", () => {
  it("charges 25 cents for each started 24-hour overdue period", () => {
    const dueAt = new Date("2026-03-10T18:45:00.000Z");

    expect(calculateFine(dueAt, new Date("2026-03-10T18:45:00.000Z"))).toBe(0);
    expect(calculateFine(dueAt, new Date("2026-03-10T18:45:01.000Z"))).toBe(0.25);
    expect(calculateFine(dueAt, new Date("2026-03-12T18:45:01.000Z"))).toBe(0.75);
  });
});
