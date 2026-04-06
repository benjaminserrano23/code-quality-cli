import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import { analyzeComplexity } from "../src/analyzers/complexity";

function writeTempFile(code: string): string {
  const tmpDir = os.tmpdir();
  const filePath = path.join(tmpDir, `cq-test-${Date.now()}.ts`);
  fs.writeFileSync(filePath, code, "utf-8");
  return filePath;
}

describe("analyzeComplexity", () => {
  it("returns complexity 1 for a simple function", () => {
    const file = writeTempFile(`
      function greet(name: string) {
        return "Hello " + name;
      }
    `);
    const metrics = analyzeComplexity(file);
    expect(metrics).toHaveLength(1);
    expect(metrics[0].name).toBe("greet");
    expect(metrics[0].complexity).toBe(1);
    fs.unlinkSync(file);
  });

  it("increments complexity for if/else", () => {
    const file = writeTempFile(`
      function check(x: number) {
        if (x > 0) {
          return "positive";
        } else if (x < 0) {
          return "negative";
        }
        return "zero";
      }
    `);
    const metrics = analyzeComplexity(file);
    expect(metrics).toHaveLength(1);
    // base 1 + if + else if = 3
    expect(metrics[0].complexity).toBe(3);
    fs.unlinkSync(file);
  });

  it("counts loops and logical operators", () => {
    const file = writeTempFile(`
      function process(items: number[]) {
        for (const item of items) {
          if (item > 0 && item < 100) {
            console.log(item);
          }
        }
      }
    `);
    const metrics = analyzeComplexity(file);
    expect(metrics).toHaveLength(1);
    // base 1 + for-of + if + && = 4
    expect(metrics[0].complexity).toBe(4);
    fs.unlinkSync(file);
  });

  it("handles arrow functions with variable name", () => {
    const file = writeTempFile(`
      const add = (a: number, b: number) => a + b;
    `);
    const metrics = analyzeComplexity(file);
    expect(metrics).toHaveLength(1);
    expect(metrics[0].name).toBe("add");
    expect(metrics[0].complexity).toBe(1);
    fs.unlinkSync(file);
  });

  it("handles multiple functions in one file", () => {
    const file = writeTempFile(`
      function a() { return 1; }
      function b() { if (true) { return 2; } return 3; }
      const c = () => 4;
    `);
    const metrics = analyzeComplexity(file);
    expect(metrics).toHaveLength(3);
    fs.unlinkSync(file);
  });
});
