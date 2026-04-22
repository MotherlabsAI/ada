export interface DistArtifact {
  owningPackage: string;
  distDir: string;
  jsFiles: string[];
  declarationFiles: string[];
  state: "absent" | "partial" | "complete";
}

export interface DeclarationFile {
  filePath: string;
  owningPackage: string;
}

export type EntrypointKind = "mcp-server" | "cli";

export interface Entrypoint {
  kind: EntrypointKind;
  owningPackage: string;
  compiledJsPath: string;
  mainFieldValue: string;
  executableBit: boolean;
  state: "pending" | "verified" | "missing";
}

export interface PackageVerification {
  packageName: string;
  distArtifact: DistArtifact;
  pass: boolean;
  reasons: string[];
}

export interface EntrypointVerification {
  entrypoint: Entrypoint;
  valid: boolean;
  missing: string[];
}

export interface VerificationResult {
  packages: PackageVerification[];
  entrypoints: EntrypointVerification[];
  allPass: boolean;
}
