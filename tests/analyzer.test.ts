import { describe, it, expect } from "vitest";
import * as path from "path";
import { analyze } from "../src/analyzers";

describe("analyze (integration)", () => {
  it("analyzes the code-quality-cli src directory itself", () => {
    const root = path.resolve(__dirname, "../src");
    const report = analyze({ root });

    expect(report.scannedFiles).toBeGreaterThan(0);
    expect(report.totalLines).toBeGreaterThan(0);
    expect(report.functions.length).toBeGreaterThan(0);
    expect(report.timestamp).toBeTruthy();
  });
});
