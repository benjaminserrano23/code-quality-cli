import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { analyzeComplexity } from "../src/analyzers/complexity";
import { scanFiles } from "../src/analyzers/file-scanner";
import { findCircularDeps } from "../src/analyzers/dependencies";

describe("edge cases", () => {
  it("handles an empty file", () => {
    const tmpDir = os.tmpdir();
    const file = path.join(tmpDir, `cq-empty-${Date.now()}.ts`);
    fs.writeFileSync(file, "", "utf-8");

    const metrics = analyzeComplexity(file);
    expect(metrics).toHaveLength(0);
    fs.unlinkSync(file);
  });

  it("throws for non-existent directory", () => {
    expect(() => scanFiles("/this/does/not/exist")).toThrow("does not exist");
  });

  it("throws for a file path instead of directory", () => {
    const tmpFile = path.join(os.tmpdir(), `cq-file-${Date.now()}.ts`);
    fs.writeFileSync(tmpFile, "const x = 1;", "utf-8");

    expect(() => scanFiles(tmpFile)).toThrow("Not a directory");
    fs.unlinkSync(tmpFile);
  });

  it("handles self-referencing circular dependency", () => {
    const graph = new Map([["a.ts", ["a.ts"]]]);
    const cycles = findCircularDeps(graph);
    expect(cycles.length).toBeGreaterThan(0);
  });

  it("respects .gitignore patterns", () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "cq-gitignore-"));
    fs.writeFileSync(path.join(tmpDir, ".gitignore"), "ignored/\n", "utf-8");
    fs.mkdirSync(path.join(tmpDir, "ignored"));
    fs.writeFileSync(path.join(tmpDir, "ignored", "skip.ts"), "const x = 1;", "utf-8");
    fs.writeFileSync(path.join(tmpDir, "keep.ts"), "const y = 2;", "utf-8");

    const files = scanFiles(tmpDir);
    const relFiles = files.map((f) => path.relative(tmpDir, f));

    expect(relFiles).toContain("keep.ts");
    expect(relFiles).not.toContain(path.join("ignored", "skip.ts"));

    fs.rmSync(tmpDir, { recursive: true });
  });
});
