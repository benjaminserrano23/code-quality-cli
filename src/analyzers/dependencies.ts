import { parse } from "@typescript-eslint/typescript-estree";
import type { TSESTree } from "@typescript-eslint/typescript-estree";
import * as fs from "fs";
import * as path from "path";
import type { CircularDependency } from "../types";

/**
 * Extract import paths from a file's AST.
 * Only resolves relative imports (starting with . or ..).
 */
export function extractImports(filePath: string, root: string): string[] {
  const code = fs.readFileSync(filePath, "utf-8");
  let ast: TSESTree.Program;
  try {
    ast = parse(code, { jsx: true });
  } catch {
    return [];
  }

  const imports: string[] = [];
  const dir = path.dirname(filePath);

  for (const node of ast.body) {
    let source: string | undefined;

    if (node.type === "ImportDeclaration") {
      source = node.source.value as string;
    } else if (
      node.type === "ExportNamedDeclaration" &&
      node.source
    ) {
      source = node.source.value as string;
    }

    if (source && (source.startsWith("./") || source.startsWith("../"))) {
      const resolved = resolveImport(dir, source, root);
      if (resolved) imports.push(resolved);
    }
  }

  // Also check for require() calls
  function visitRequires(node: TSESTree.Node): void {
    if (
      node.type === "CallExpression" &&
      node.callee.type === "Identifier" &&
      node.callee.name === "require" &&
      node.arguments.length === 1 &&
      node.arguments[0].type === "Literal" &&
      typeof node.arguments[0].value === "string"
    ) {
      const src = node.arguments[0].value;
      if (src.startsWith("./") || src.startsWith("../")) {
        const resolved = resolveImport(dir, src, root);
        if (resolved) imports.push(resolved);
      }
    }
    for (const key of Object.keys(node)) {
      const child = (node as any)[key];
      if (child && typeof child === "object") {
        if (Array.isArray(child)) {
          for (const item of child) {
            if (item && typeof item.type === "string") visitRequires(item);
          }
        } else if (typeof child.type === "string") {
          visitRequires(child);
        }
      }
    }
  }

  for (const node of ast.body) {
    visitRequires(node);
  }

  return [...new Set(imports)];
}

function resolveImport(dir: string, importPath: string, root: string): string | null {
  const extensions = [".ts", ".tsx", ".js", ".jsx", ""];
  const base = path.resolve(dir, importPath);

  for (const ext of extensions) {
    const candidate = base + ext;
    if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
      return path.relative(root, candidate);
    }
  }

  // Try index files
  for (const ext of extensions) {
    const candidate = path.join(base, "index" + ext);
    if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
      return path.relative(root, candidate);
    }
  }

  return null;
}

/**
 * Build dependency graph: { file -> [files it imports] }
 */
export function buildDependencyGraph(
  files: string[],
  root: string
): Map<string, string[]> {
  const graph = new Map<string, string[]>();
  for (const file of files) {
    const relPath = path.relative(root, file);
    const imports = extractImports(file, root);
    graph.set(relPath, imports);
  }
  return graph;
}

/**
 * Detect circular dependencies using DFS.
 */
export function findCircularDeps(
  graph: Map<string, string[]>
): CircularDependency[] {
  const cycles: CircularDependency[] = [];
  const visited = new Set<string>();
  const inStack = new Set<string>();
  const stack: string[] = [];
  const seen = new Set<string>(); // Avoid duplicate cycles

  function dfs(node: string): void {
    if (inStack.has(node)) {
      // Found a cycle — extract it
      const cycleStart = stack.indexOf(node);
      const cycle = [...stack.slice(cycleStart), node];
      const key = [...cycle].sort().join(" -> ");
      if (!seen.has(key)) {
        seen.add(key);
        cycles.push({ cycle });
      }
      return;
    }
    if (visited.has(node)) return;

    visited.add(node);
    inStack.add(node);
    stack.push(node);

    const deps = graph.get(node) ?? [];
    for (const dep of deps) {
      dfs(dep);
    }

    stack.pop();
    inStack.delete(node);
  }

  for (const node of graph.keys()) {
    dfs(node);
  }

  return cycles;
}

/**
 * Compute coupling: how many other files import each file.
 */
export function computeCoupling(
  graph: Map<string, string[]>
): Map<string, string[]> {
  const importedBy = new Map<string, string[]>();

  for (const [file, deps] of graph) {
    for (const dep of deps) {
      if (!importedBy.has(dep)) importedBy.set(dep, []);
      importedBy.get(dep)!.push(file);
    }
  }

  return importedBy;
}
