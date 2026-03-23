import type { PostcodeAddress } from "@ada/provenance";

export interface AgentFile {
  readonly name: string;
  readonly description: string;
  readonly model: string;
  readonly tools: readonly string[];
  readonly status: string;
  readonly body: string;
  readonly path: string;
}

export interface SkillFile {
  readonly name: string;
  readonly description: string;
  readonly body: string;
  readonly path: string;
}

export interface HookScript {
  readonly name: string;
  readonly type: "pre-tool" | "post-tool";
  readonly matcher: string;
  readonly script: string;
  readonly path: string;
}

export interface ConfigGraph {
  readonly claudeMd: string;
  readonly agents: readonly string[];
  readonly skills: readonly string[];
  readonly hooks: readonly string[];
  readonly settings: string;
  readonly postcode: PostcodeAddress;
}
