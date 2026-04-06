import { parse } from "@typescript-eslint/typescript-estree";
import type { TSESTree } from "@typescript-eslint/typescript-estree";
import * as fs from "fs";
import type { FunctionMetric } from "../types";

// Nodes that add +1 to cyclomatic complexity
const BRANCHING_TYPES = new Set([
  "IfStatement",
  "ConditionalExpression",
  "SwitchCase",
  "ForStatement",
  "ForInStatement",
  "ForOfStatement",
  "WhileStatement",
  "DoWhileStatement",
  "CatchClause",
  "LogicalExpression", // && and || create branches
]);

function getFunctionName(node: TSESTree.Node): string {
  switch (node.type) {
    case "FunctionDeclaration":
      return (node as TSESTree.FunctionDeclaration).id?.name ?? "(anonymous)";
    case "MethodDefinition":
      return (node as TSESTree.MethodDefinition).key.type === "Identifier"
        ? ((node as TSESTree.MethodDefinition).key as TSESTree.Identifier).name
        : "(computed)";
    case "ArrowFunctionExpression":
    case "FunctionExpression": {
      const parent = (node as any).parent;
      if (parent?.type === "VariableDeclarator" && parent.id?.type === "Identifier") {
        return parent.id.name;
      }
      return "(anonymous)";
    }
    default:
      return "(unknown)";
  }
}

function countComplexity(node: TSESTree.Node): number {
  let complexity = 1; // base path

  function visit(n: TSESTree.Node): void {
    if (BRANCHING_TYPES.has(n.type)) {
      // For LogicalExpression, only count && and ||
      if (n.type === "LogicalExpression") {
        const op = (n as TSESTree.LogicalExpression).operator;
        if (op === "&&" || op === "||") complexity++;
      } else if (n.type === "SwitchCase") {
        // Don't count default case
        if ((n as TSESTree.SwitchCase).test !== null) complexity++;
      } else {
        complexity++;
      }
    }
    for (const key of Object.keys(n)) {
      if (key === "parent") continue;
      const child = (n as any)[key];
      if (child && typeof child === "object") {
        if (Array.isArray(child)) {
          for (const item of child) {
            if (item && typeof item.type === "string") visit(item);
          }
        } else if (typeof child.type === "string") {
          visit(child);
        }
      }
    }
  }

  visit(node);
  return complexity;
}

function isFunctionNode(node: TSESTree.Node): boolean {
  return [
    "FunctionDeclaration",
    "FunctionExpression",
    "ArrowFunctionExpression",
    "MethodDefinition",
  ].includes(node.type);
}

export function analyzeComplexity(filePath: string): FunctionMetric[] {
  const code = fs.readFileSync(filePath, "utf-8");
  const metrics: FunctionMetric[] = [];

  let ast: TSESTree.Program;
  try {
    ast = parse(code, {
      loc: true,
      range: true,
      jsx: true,
    });
  } catch {
    // Can't parse this file — skip
    return [];
  }

  function visit(node: TSESTree.Node, parent?: TSESTree.Node): void {
    // Attach parent for name resolution
    (node as any).parent = parent;

    if (isFunctionNode(node)) {
      const fnNode =
        node.type === "MethodDefinition"
          ? (node as TSESTree.MethodDefinition).value
          : node;
      const bodyNode = (fnNode as any).body;
      const startLine = node.loc?.start.line ?? 0;
      const endLine = bodyNode?.loc?.end.line ?? startLine;

      metrics.push({
        name: getFunctionName(node),
        file: filePath,
        line: startLine,
        complexity: countComplexity(fnNode),
        lineCount: endLine - startLine + 1,
      });
    }

    for (const key of Object.keys(node)) {
      if (key === "parent") continue;
      const child = (node as any)[key];
      if (child && typeof child === "object") {
        if (Array.isArray(child)) {
          for (const item of child) {
            if (item && typeof item.type === "string") visit(item, node);
          }
        } else if (typeof child.type === "string") {
          visit(child, node);
        }
      }
    }
  }

  visit(ast);
  return metrics;
}
