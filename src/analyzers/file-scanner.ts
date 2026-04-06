import * as fs from "fs";
import * as path from "path";

const DEFAULT_IGNORE = [
  "node_modules",
  "dist",
  "build",
  ".git",
  "coverage",
  ".next",
  "__pycache__",
  ".cache",
];

export function scanFiles(
  root: string,
  extensions: string[] = [".ts", ".tsx", ".js", ".jsx"]
): string[] {
  const results: string[] = [];

  function walk(dir: string): void {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (DEFAULT_IGNORE.includes(entry.name)) continue;
      if (entry.name.startsWith(".")) continue;

      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath);
      } else if (extensions.some((ext) => entry.name.endsWith(ext))) {
        results.push(fullPath);
      }
    }
  }

  walk(root);
  return results;
}
