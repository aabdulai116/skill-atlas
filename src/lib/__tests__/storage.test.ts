import { describe, expect, it } from "vitest";
import { createEmptyProgress, exportProgress, importProgress } from "../storage";

describe("export / import", () => {
  it("round-trips progress", () => {
    const state = createEmptyProgress();
    state.checked = { python: ["Syntax, variables and types"] };
    state.notes = { python: "hello" };
    state.activity = { "2026-01-14": 2 };
    state.settings = { selectedPath: "quant-trader", hoursPerWeek: 12, targetDate: "2026-08-01" };
    expect(importProgress(exportProgress(state))).toEqual(state);
  });

  it("rejects invalid JSON and wrong versions", () => {
    expect(() => importProgress("not json")).toThrow(/valid JSON/);
    expect(() => importProgress(JSON.stringify({ version: 99 }))).toThrow(/version/);
  });

  it("drops malformed fields and falls back to defaults", () => {
    const parsed = importProgress(
      JSON.stringify({
        version: 1,
        checked: { a: ["x", 3], b: "bad" },
        notes: { a: 5 },
        activity: { "2026-01-01": "x", "2026-01-02": 2 },
        settings: { selectedPath: "nope", hoursPerWeek: -1, targetDate: "soon" },
      }),
    );
    expect(parsed.checked).toEqual({ a: ["x"] });
    expect(parsed.notes).toEqual({});
    expect(parsed.activity).toEqual({ "2026-01-02": 2 });
    expect(parsed.settings).toEqual(createEmptyProgress().settings);
  });
});
