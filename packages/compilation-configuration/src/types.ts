export interface TsConfig {
  filePath: string;
  composite: boolean;
  declaration: boolean;
  declarationMap: boolean;
  incremental: boolean;
  outDir: string;
  rootDir: string;
  projectReferences: ProjectReference[];
}

export interface ProjectReference {
  referencingTsConfig: string;
  referencedTsConfigPath: string;
}

export interface CompositeBuild {
  rootTsConfigPath: string;
  forceClean: boolean;
  incremental: boolean;
}

export interface BuildError {
  filePath: string | null;
  line: number | null;
  column: number | null;
  message: string;
}

export interface BuildResult {
  exitCode: number;
  errors: BuildError[];
  stdout: string;
  stderr: string;
}

export interface TsBuildInfo {
  filePath: string;
  packageName: string;
  state: "absent" | "current" | "stale" | "corrupt";
  lastBuildTimestamp: number;
}
