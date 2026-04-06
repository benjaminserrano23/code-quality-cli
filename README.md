# Code Quality CLI

CLI tool that analyzes code quality metrics for TypeScript and JavaScript projects. Built from scratch — no plugins, no configuration files, just AST-based analysis.

## Features

- **Cyclomatic complexity** per function via AST parsing (`@typescript-eslint/typescript-estree`)
- **God file detection** — flags files exceeding configurable line/function thresholds
- **Circular dependency detection** — DFS-based cycle detection on the import graph
- **Coupling analysis** — ranks files by how many other files import them
- **JSON export** — machine-readable output for CI integration

## Installation

```bash
npm install
npm run build
```

## Usage

```bash
# Analyze current directory
npx cq .

# Analyze a specific directory
npx cq ./src

# Custom thresholds
npx cq ./src --max-lines 300 --max-functions 10

# Export JSON report
npx cq ./src --json report.json

# Scan specific extensions
npx cq ./src --ext .ts,.tsx
```

## Development

```bash
# Run in dev mode (no build needed)
npm run dev -- ./src

# Run tests
npm test

# Watch tests
npm run test:watch
```

## How it works

1. **File scanning** — recursively finds `.ts/.tsx/.js/.jsx` files, skipping `node_modules`, `dist`, etc.
2. **AST parsing** — each file is parsed into an AST using `@typescript-eslint/typescript-estree`
3. **Complexity analysis** — walks function nodes counting branching statements (if, for, while, switch, &&, ||, catch)
4. **Dependency graph** — extracts `import`/`require` statements, resolves relative paths, builds a directed graph
5. **Cycle detection** — DFS with a recursion stack to find circular dependencies
6. **Coupling** — inverts the dependency graph to count how many files import each module

## Output example

```
═══════════════════════════════════════════
  Code Quality Report
═══════════════════════════════════════════

📊 Summary
   Files scanned: 8
   Total lines:   625
   Functions:     32

🔥 Most Complex Functions
   [28] extractImports  analyzers/dependencies.ts:11
   [16] countComplexity analyzers/complexity.ts:41

✅ No god files detected
✅ No circular dependencies

🔗 Most Coupled Files (imported by)
   [5] types.ts
```

## Tech stack

- TypeScript
- Node.js
- `@typescript-eslint/typescript-estree` (AST parsing)
- `commander` (CLI framework)
- `chalk` (terminal colors)
- `vitest` (testing)
