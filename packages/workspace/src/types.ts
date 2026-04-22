export interface WorkspaceRoot {
  rootPath: string;
  pnpmWorkspaceFile: string;
  packageNames: string[];
}

export interface WorkspacePackage {
  name: string;
  packageJsonPath: string;
  tsConfigPath: string;
  srcDir: string;
  distDir: string;
  internalDependencies: string[];
  isComposite: boolean;
}

export interface PackageDependencyEdge {
  fromPackage: string;
  toPackage: string;
  protocol: "workspace:";
  versionSpec: string;
}

export interface BuildOrder {
  orderedPackages: string[];
  edgeCount: number;
  hasCycle: boolean;
  cycleDescription?: string;
}
