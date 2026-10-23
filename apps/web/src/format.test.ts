import { describe, expect, it } from "vitest";
import { formatCourseDate, formatMoney } from "./format";

describe("display formatting", () => {
  it("formats integer minor-unit money without dropping cents", () => {
    expect(formatMoney(2900)).toBe("$29.00");
    expect(formatMoney(199, "USD")).toBe("$1.99");
  });
  it("formats course schedule times in a stable UTC zone", () => {
    expect(formatCourseDate("2026-10-24T12:30:00.000Z")).toBe("Oct 24, 12:30 PM");
  });
});
