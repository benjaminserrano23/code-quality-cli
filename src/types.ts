export interface FunctionMetric {
  name: string;
  file: string;
  line: number;
  complexity: number;
  lineCount: number;
}

export interface FileMetric {
  path: string;
  lines: number;
  functions: number;
  maxComplexity: number;
  avgComplexity: number;
  imports: string[];
  importedBy: string[];
}

export interface CircularDependency {
  cycle: string[];
}

export interface AnalysisReport {
  scannedFiles: number;
  totalLines: number;
  files: FileMetric[];
  functions: FunctionMetric[];
  godFiles: FileMetric[];
  circularDeps: CircularDependency[];
  mostCoupled: FileMetric[];
  timestamp: string;
  thresholds: {
    maxLines: number;
    maxFunctions: number;
  };
}

export interface AnalyzerOptions {
  root: string;
  maxLines?: number;
  maxFunctions?: number;
  extensions?: string[];
}
