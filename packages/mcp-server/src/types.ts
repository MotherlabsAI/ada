export interface VerifyResult {
  readonly pass: boolean;
  readonly violations: readonly string[];
  readonly postcodes: readonly string[];
}

export interface WorkflowSpec {
  readonly name: string;
  readonly trigger: string;
  readonly steps: readonly {
    readonly name: string;
    readonly precondition: string;
    readonly action: string;
    readonly postcondition: string;
  }[];
}

export interface AgentFileSpec {
  readonly name: string;
  readonly description: string;
  readonly tools: readonly string[];
  readonly path: string;
}
