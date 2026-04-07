import * as fs from "fs";
import * as path from "path";
import { scanFiles } from "./file-scanner";
import { analyzeComplexity } from "./complexity";
import {
  buildDependencyGraph,
  findCircularDeps,
  computeCoupling,
} from "./dependencies";
import type { AnalysisReport, AnalyzerOptions, FileMetric } from "../types";

const DEFAULT_MAX_LINES = 500;
const DEFAULT_MAX_FUNCTIONS = 15;

export function analyze(options: AnalyzerOptions): AnalysisReport {
  const {
    root,
    maxLines = DEFAULT_MAX_LINES,
    maxFunctions = DEFAULT_MAX_FUNCTIONS,
    extensions,
  } = options;

  const files = scanFiles(root, extensions);
  const allFunctions = files.flatMap((f) => {
    const fns = analyzeComplexity(f);
    // Normalize to relative paths
    const rel = path.relative(root, f);
    return fns.map((fn) => ({ ...fn, file: rel }));
  });

  // Build file metrics
  const depGraph = buildDependencyGraph(files, root);
  const importedByMap = computeCoupling(depGraph);

  const fileMetrics: FileMetric[] = files.map((filePath) => {
    const relPath = path.relative(root, filePath);
    const content = fs.readFileSync(filePath, "utf-8");
    const lines = content.split("\n").length;
    const fileFunctions = allFunctions.filter((f) => f.file === relPath);
    const complexities = fileFunctions.map((f) => f.complexity);
    const imports = depGraph.get(relPath) ?? [];
    const importedBy = importedByMap.get(relPath) ?? [];

    return {
      path: relPath,
      lines,
      functions: fileFunctions.length,
      maxComplexity: complexities.length > 0 ? Math.max(...complexities) : 0,
      avgComplexity:
        complexities.length > 0
          ? Math.round(
              (complexities.reduce((a, b) => a + b, 0) / complexities.length) *
                100
            ) / 100
          : 0,
      imports,
      importedBy,
    };
  });

  // Detect god files
  const godFiles = fileMetrics.filter(
    (f) => f.lines > maxLines || f.functions > maxFunctions
  );

  // Circular dependencies
  const circularDeps = findCircularDeps(depGraph);

  // Most coupled files (top 10 by importedBy count)
  const mostCoupled = [...fileMetrics]
    .sort((a, b) => b.importedBy.length - a.importedBy.length)
    .slice(0, 10)
    .filter((f) => f.importedBy.length > 0);

  return {
    scannedFiles: files.length,
    totalLines: fileMetrics.reduce((sum, f) => sum + f.lines, 0),
    files: fileMetrics,
    functions: allFunctions,
    godFiles,
    circularDeps,
    mostCoupled,
    timestamp: new Date().toISOString(),
    thresholds: { maxLines, maxFunctions },
  };
}
