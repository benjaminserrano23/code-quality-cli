import * as fs from "fs";
import type { AnalysisReport } from "../types";

export function writeJsonReport(report: AnalysisReport, outputPath: string): void {
  fs.writeFileSync(outputPath, JSON.stringify(report, null, 2), "utf-8");
}
