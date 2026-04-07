import chalk from "chalk";
import type { AnalysisReport } from "../types";

export function printReport(report: AnalysisReport): void {
  const { scannedFiles, totalLines, functions, godFiles, circularDeps, mostCoupled } = report;

  console.log();
  console.log(chalk.bold.cyan("═══════════════════════════════════════════"));
  console.log(chalk.bold.cyan("  Code Quality Report"));
  console.log(chalk.bold.cyan("═══════════════════════════════════════════"));
  console.log();

  // Summary
  console.log(chalk.bold("📊 Summary"));
  console.log(`   Files scanned: ${chalk.white(scannedFiles)}`);
  console.log(`   Total lines:   ${chalk.white(totalLines.toLocaleString())}`);
  console.log(`   Functions:     ${chalk.white(functions.length)}`);
  console.log();

  // Top complex functions
  const topComplex = [...functions]
    .sort((a, b) => b.complexity - a.complexity)
    .slice(0, 10);

  if (topComplex.length > 0) {
    console.log(chalk.bold("🔥 Most Complex Functions"));
    for (const fn of topComplex) {
      const color =
        fn.complexity > 15
          ? chalk.red
          : fn.complexity > 10
          ? chalk.yellow
          : chalk.green;
      console.log(
        `   ${color(`[${fn.complexity}]`)} ${chalk.white(fn.name)} ${chalk.gray(
          `${fn.file}:${fn.line}`
        )}`
      );
    }
    console.log();
  }

  // God files
  if (godFiles.length > 0) {
    console.log(chalk.bold.yellow(`⚠️  God Files (${godFiles.length})`));
    for (const f of godFiles) {
      const reasons: string[] = [];
      if (f.lines > report.thresholds.maxLines) reasons.push(`${f.lines} lines`);
      if (f.functions > report.thresholds.maxFunctions) reasons.push(`${f.functions} functions`);
      console.log(
        `   ${chalk.yellow(f.path)} ${chalk.gray(`— ${reasons.join(", ")}`)}`
      );
    }
    console.log();
  } else {
    console.log(chalk.green("✅ No god files detected"));
    console.log();
  }

  // Circular dependencies
  if (circularDeps.length > 0) {
    console.log(
      chalk.bold.red(`🔄 Circular Dependencies (${circularDeps.length})`)
    );
    for (const dep of circularDeps) {
      console.log(`   ${chalk.red(dep.cycle.join(" → "))}`);
    }
    console.log();
  } else {
    console.log(chalk.green("✅ No circular dependencies"));
    console.log();
  }

  // Most coupled
  if (mostCoupled.length > 0) {
    console.log(chalk.bold("🔗 Most Coupled Files (imported by)"));
    for (const f of mostCoupled) {
      console.log(
        `   ${chalk.white(`[${f.importedBy.length}]`)} ${f.path}`
      );
    }
    console.log();
  }

  console.log(chalk.gray(`Generated at ${report.timestamp}`));
  console.log();
}
