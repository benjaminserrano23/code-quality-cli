import * as fs from "fs";
import * as path from "path";
import ignore from "ignore";

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

/**
 * Load .gitignore patterns from the root directory.
 */
function loadGitignore(root: string): ReturnType<typeof ignore> {
  const ig = ignore();
  const gitignorePath = path.join(root, ".gitignore");
  try {
    const content = fs.readFileSync(gitignorePath, "utf-8");
    ig.add(content);
  } catch {
    // No .gitignore — that's fine
  }
  return ig;
}

/**
 * Recursively scan a directory for source files.
 * Respects .gitignore patterns and skips common non-source directories.
 */
export function scanFiles(
  root: string,
  extensions: string[] = [".ts", ".tsx", ".js", ".jsx"]
): string[] {
  if (!fs.existsSync(root)) {
    throw new Error(`Directory does not exist: ${root}`);
  }

  const stat = fs.statSync(root);
  if (!stat.isDirectory()) {
    throw new Error(`Not a directory: ${root}`);
  }

  const ig = loadGitignore(root);
  const results: string[] = [];

  function walk(dir: string): void {
    let entries;
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      // Permission denied or other read error — skip
      return;
    }

    for (const entry of entries) {
      if (DEFAULT_IGNORE.includes(entry.name)) continue;
      if (entry.name.startsWith(".")) continue;

      const fullPath = path.join(dir, entry.name);
      const relPath = path.relative(root, fullPath);

      // Check .gitignore
      if (ig.ignores(relPath)) continue;

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
