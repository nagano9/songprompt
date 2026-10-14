import { describe, expect, it } from "vitest";
import { planNegatives, rankedAutoNegatives, resolveNegatives } from "./negatives";
import { withDefaults } from "./defaults";

describe("negatives", () => {
  it("drops a negative that conflicts with what the user asked for", () => {
    const auto = rankedAutoNegatives(withDefaults({ genre: "hyperpop", vocal: { type: "female", timbre: "autotuned", delivery: "", accent: "", language: "" } }));
    expect(auto).not.toContain("heavy autotune");
  });

  it("does not treat 'chamber folk' as orchestral", () => {
    const auto = rankedAutoNegatives(withDefaults({ genre: "indie folk", subgenres: ["chamber folk"], negativeBudget: 0 }));
    expect(auto).not.toContain("trailer braams");
    expect(auto).toContain("synth pads");
  });

  it("ranks genre-targeted negatives above the baseline", () => {
    const auto = rankedAutoNegatives(withDefaults({ genre: "indie folk" }));
    expect(auto.indexOf("electronic drums")).toBeLessThan(auto.indexOf("heavy autotune"));
  });

  it("caps auto negatives at the budget but always keeps user negatives", () => {
    const input = withDefaults({ genre: "indie folk", instrumentsAvoid: ["808"], negativesManual: ["key change"], negativeBudget: 5 });
    const plan = planNegatives(input);
    expect(plan.sent).toHaveLength(5);
    expect(plan.sent.slice(0, 2)).toEqual(["808", "key change"]);
    expect(plan.dropped.length).toBeGreaterThan(0);
  });

  it("keeps all user negatives even when they exceed the budget", () => {
    const input = withDefaults({ negativesManual: ["a", "b", "c", "d"], negativeBudget: 2 });
    expect(resolveNegatives(input)).toEqual(["a", "b", "c", "d"]);
  });

  it("treats budget 0 as unlimited", () => {
    const capped = resolveNegatives(withDefaults({ genre: "indie folk", negativeBudget: 3 }));
    const all = resolveNegatives(withDefaults({ genre: "indie folk", negativeBudget: 0 }));
    expect(capped).toHaveLength(3);
    expect(all.length).toBeGreaterThan(10);
  });

  it("returns nothing automatic when defaults and strong mode are off", () => {
    expect(rankedAutoNegatives(withDefaults({ useDefaultNegatives: false, strongAntiSlop: false }))).toEqual([]);
  });
});
