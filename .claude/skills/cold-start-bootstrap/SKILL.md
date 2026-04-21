---
ada_postcode: "ML.SKL.cold-start-bootstrap/v1"
ada_type: skill
ada_name: cold-start-bootstrap
ada_compiled_at: 1776806934913
---
---
name: cold-start-bootstrap
description: "Use when session opens and no CompiledInvariantSet exists for sessionId, or system initializes for first time pattern detected."
---

# cold-start-bootstrap

Trigger: session opens and no CompiledInvariantSet exists for sessionId, or system initializes for first time

## Steps
1. **seed-invariant-set-validation**
   - Pre: `SeedInvariantSet exists in governance store; system has not yet produced any CompiledInvariantSet for this sessionId`
   - Action: `load SeedInvariantSet; verify designerSignature cryptographic validity; verify authorVersion matches expected system version; read permissivenessLevel to configure bootstrap governance strictness`
   - Post: `SeedInvariantSet.designerSignature is valid; authorVersion matches; permissivenessLevel recorded in BootstrapState; seed is authorized for use`

2. **minimal-compiled-invariant-set-creation**
   - Pre: `SeedInvariantSet is validated; BootstrapState initialized; sessionId assigned`
   - Action: `promote SeedInvariantSet.invariants to CompiledInvariantSet with bootstrapFlag=true, authoredBy=SEED_DESIGNER, version=0, sessionId bound; persist CompiledInvariantSet; emit BootstrapState record with sessionId, seedId, permissivenessLevel, bootstrapStartedAt`
   - Post: `CompiledInvariantSet persisted with bootstrapFlag=true; version=0 recorded; AuditLogEntry written for bootstrap creation; session transitions to bootstrapping state`

3. **bootstrap-gate-arming**
   - Pre: `bootstrap CompiledInvariantSet is persisted with bootstrapFlag=true; session is in bootstrapping state`
   - Action: `arm SemanticGateEnforcer with bootstrap CompiledInvariantSet; configure gate with permissivenessLevel from SeedInvariantSet (PERMISSIVE allows more tool calls through during bootstrap; STRICT applies full seed invariants); activate deny-all for any tool call not covered by seed invariants`
   - Post: `SemanticGateEnforcer armed with bootstrap set; gate behavior reflects permissivenessLevel; system is operational in bootstrap mode; full compilation pipeline queued`

4. **bootstrap-to-compiled-transition**
   - Pre: `full semantic compilation pipeline has completed successfully; new CompiledInvariantSet with bootstrapFlag=false is persisted; ArtifactSet is coherent; session is in bootstrapping state`
   - Action: `atomically swap SemanticGateEnforcer from bootstrap CompiledInvariantSet to fully compiled CompiledInvariantSet; mark bootstrap CompiledInvariantSet as superseded; transition session from bootstrapping to active; emit BOOTSTRAP_COMPLETE event to observability`
   - Post: `SemanticGateEnforcer armed with bootstrapFlag=false CompiledInvariantSet; session is in active state; bootstrap CompiledInvariantSet is superseded but retained in history; AuditLogEntry records transition with timestamp and both invariant set ids`
