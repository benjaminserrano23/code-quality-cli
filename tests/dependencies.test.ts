import { describe, it, expect } from "vitest";
import { findCircularDeps } from "../src/analyzers/dependencies";

describe("findCircularDeps", () => {
  it("detects a simple A -> B -> A cycle", () => {
    const graph = new Map([
      ["a.ts", ["b.ts"]],
      ["b.ts", ["a.ts"]],
    ]);
    const cycles = findCircularDeps(graph);
    expect(cycles.length).toBeGreaterThan(0);
    const flat = cycles.flatMap((c) => c.cycle);
    expect(flat).toContain("a.ts");
    expect(flat).toContain("b.ts");
  });

  it("detects A -> B -> C -> A cycle", () => {
    const graph = new Map([
      ["a.ts", ["b.ts"]],
      ["b.ts", ["c.ts"]],
      ["c.ts", ["a.ts"]],
    ]);
    const cycles = findCircularDeps(graph);
    expect(cycles.length).toBeGreaterThan(0);
  });

  it("returns empty for acyclic graph", () => {
    const graph = new Map([
      ["a.ts", ["b.ts"]],
      ["b.ts", ["c.ts"]],
      ["c.ts", []],
    ]);
    const cycles = findCircularDeps(graph);
    expect(cycles).toHaveLength(0);
  });
});
