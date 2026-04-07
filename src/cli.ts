#!/usr/bin/env node

import { Command } from "commander";
import * as path from "path";
import { analyze } from "./analyzers";
import { printReport } from "./reporters/console";
import { writeJsonReport } from "./reporters/json";
import { writeHtmlReport } from "./reporters/html";

const program = new Command();

program
  .name("cq")
  .description("Analyze code quality metrics for TypeScript/JavaScript projects")
  .version("1.0.0")
  .argument("[directory]", "Directory to analyze", ".")
  .option("--max-lines <n>", "Max lines before a file is flagged as a god file", "500")
  .option("--max-functions <n>", "Max functions before a file is flagged", "15")
  .option("--json <path>", "Export report as JSON to the given path")
  .option("--html <path>", "Export report as HTML to the given path")
  .option(
    "--ext <extensions>",
    "Comma-separated file extensions to scan",
    ".ts,.tsx,.js,.jsx"
  )
  .action((directory: string, opts: Record<string, string>) => {
    const root = path.resolve(directory);
    const extensions = opts.ext.split(",").map((e) => e.trim());

    try {
      const report = analyze({
        root,
        maxLines: parseInt(opts.maxLines, 10),
        maxFunctions: parseInt(opts.maxFunctions, 10),
        extensions,
      });

      printReport(report);

      if (opts.json) {
        const outputPath = path.resolve(opts.json);
        writeJsonReport(report, outputPath);
        console.log(`JSON report saved to ${outputPath}`);
      }

      if (opts.html) {
        const outputPath = path.resolve(opts.html);
        writeHtmlReport(report, outputPath);
        console.log(`HTML report saved to ${outputPath}`);
      }
    } catch (err) {
      console.error(`Error: ${(err as Error).message}`);
      process.exit(1);
    }
  });

program.parse();
