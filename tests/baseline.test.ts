import { describe, expect, it } from "vitest";
import { formatRpFull, getPlan } from "../src/lib/plans";

describe("Vitest baseline", () => {
  it("can execute TypeScript tests against application code", () => {
    expect(getPlan("starter")?.price).toBe(350000);
    expect(formatRpFull(500000)).toBe("Rp 500.000");
  });
});
