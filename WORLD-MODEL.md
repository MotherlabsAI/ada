---
ada_postcode: "ML.L4A.CFG.GLO.HOW.SFT.d140a877/v1"
ada_type: world-model
ada_blueprint: "ML.SYN.71346834/v1"
ada_nodes: 48
ada_compiled_at: 1776596371495
---

# World Model

This is the navigable graph of all compiled artifacts. Every node has a postcode. Every edge is a typed relationship. Load any node and traverse to its neighbors.

## Nodes (48)

### Ada is a semantic operating system that compiles human inten
- **Type:** blueprint
- **Postcode:** `ML.SYN.71346834/v1`
- **Path:** `CLAUDE.md`
- **Implements:** PipelineOrchestrator, MotherCompiler, IntentAgent, PersonaAgent, EntityAgent, ProcessAgent, SynthesisAgent, VerifyAgent, GovernorAgent, INTStageController, ConfidenceTracker, PostcodeAddressFactory, ProvenanceStore, ProvenanceChainValidator, ProvenanceRecordWriter, ENTGateEvaluator, buildWorldState, runCompileLoop, MacroPlan, DelegationContract, writeCheckpoint, VerificationReport, Skill, Amendment, SkillCandidate, ElicitationSessionManager, DialogueEngine, GapAnalyzer, DraftIntentGraphManager, ReadinessAssessor, HandoffEmitter, writeConfigGraph, blueprintToCLAUDEMD, componentsToAgents, invariantsToHooks, deriveBuildContract, AdaStorage, ElicitationStore, startServer, analyzeCodebase, WorkspacePackageScanner, diffBlueprintAgainstCode, SYNGateEvaluator, EntityExtractor, FallbackBlueprintResult

### PipelineOrchestrator
- **Type:** agent
- **Postcode:** `ML.AGT.pipelineorchestrator/v1`
- **Path:** `AGENTS/pipelineorchestrator.md`
- **Bounded context:** compilation-pipeline
- **Depends on:** `ML.SYN.71346834/v1`, `ML.AGT.mothercompiler/v1`, `ML.AGT.postcodeaddressfactory/v1`, `ML.AGT.provenancestore/v1`, `ML.AGT.adastorage/v1`, `ML.AGT.entgateevaluator/v1`
- **Used by:** `ML.SYN.71346834/v1`, `ML.AGT.startserver/v1`

### MotherCompiler
- **Type:** agent
- **Postcode:** `ML.AGT.mothercompiler/v1`
- **Path:** `AGENTS/mothercompiler.md`
- **Bounded context:** compilation-pipeline
- **Depends on:** `ML.SYN.71346834/v1`, `ML.AGT.intentagent/v1`, `ML.AGT.personaagent/v1`, `ML.AGT.entityagent/v1`, `ML.AGT.processagent/v1`, `ML.AGT.synthesisagent/v1`, `ML.AGT.verifyagent/v1`, `ML.AGT.governoragent/v1`
- **Used by:** `ML.AGT.pipelineorchestrator/v1`, `ML.SYN.71346834/v1`

### IntentAgent
- **Type:** agent
- **Postcode:** `ML.AGT.intentagent/v1`
- **Path:** `AGENTS/intentagent.md`
- **Bounded context:** compilation-pipeline
- **Depends on:** `ML.SYN.71346834/v1`
- **Used by:** `ML.AGT.mothercompiler/v1`, `ML.SYN.71346834/v1`, `ML.AGT.personaagent/v1`, `ML.AGT.intstagecontroller/v1`

### PersonaAgent
- **Type:** agent
- **Postcode:** `ML.AGT.personaagent/v1`
- **Path:** `AGENTS/personaagent.md`
- **Bounded context:** compilation-pipeline
- **Depends on:** `ML.SYN.71346834/v1`, `ML.AGT.intentagent/v1`
- **Used by:** `ML.AGT.mothercompiler/v1`, `ML.SYN.71346834/v1`, `ML.AGT.entityagent/v1`

### EntityAgent
- **Type:** agent
- **Postcode:** `ML.AGT.entityagent/v1`
- **Path:** `AGENTS/entityagent.md`
- **Bounded context:** compilation-pipeline
- **Depends on:** `ML.SYN.71346834/v1`, `ML.AGT.personaagent/v1`, `ML.AGT.entgateevaluator/v1`, `ML.AGT.entityextractor/v1`
- **Used by:** `ML.AGT.mothercompiler/v1`, `ML.SYN.71346834/v1`, `ML.AGT.processagent/v1`

### ProcessAgent
- **Type:** agent
- **Postcode:** `ML.AGT.processagent/v1`
- **Path:** `AGENTS/processagent.md`
- **Bounded context:** compilation-pipeline
- **Depends on:** `ML.SYN.71346834/v1`, `ML.AGT.entityagent/v1`
- **Used by:** `ML.AGT.mothercompiler/v1`, `ML.SYN.71346834/v1`, `ML.AGT.synthesisagent/v1`

### SynthesisAgent
- **Type:** agent
- **Postcode:** `ML.AGT.synthesisagent/v1`
- **Path:** `AGENTS/synthesisagent.md`
- **Bounded context:** compilation-pipeline
- **Depends on:** `ML.SYN.71346834/v1`, `ML.AGT.processagent/v1`, `ML.AGT.syngateevaluator/v1`
- **Used by:** `ML.AGT.mothercompiler/v1`, `ML.SYN.71346834/v1`, `ML.AGT.verifyagent/v1`

### VerifyAgent
- **Type:** agent
- **Postcode:** `ML.AGT.verifyagent/v1`
- **Path:** `AGENTS/verifyagent.md`
- **Bounded context:** compilation-pipeline
- **Depends on:** `ML.SYN.71346834/v1`, `ML.AGT.synthesisagent/v1`, `ML.AGT.provenancechainvalidator/v1`
- **Used by:** `ML.AGT.mothercompiler/v1`, `ML.SYN.71346834/v1`, `ML.AGT.governoragent/v1`

### GovernorAgent
- **Type:** agent
- **Postcode:** `ML.AGT.governoragent/v1`
- **Path:** `AGENTS/governoragent.md`
- **Bounded context:** compilation-pipeline
- **Depends on:** `ML.SYN.71346834/v1`, `ML.AGT.verifyagent/v1`, `ML.AGT.confidencetracker/v1`
- **Used by:** `ML.AGT.mothercompiler/v1`, `ML.SYN.71346834/v1`

### INTStageController
- **Type:** agent
- **Postcode:** `ML.AGT.intstagecontroller/v1`
- **Path:** `AGENTS/intstagecontroller.md`
- **Bounded context:** compilation-pipeline
- **Depends on:** `ML.SYN.71346834/v1`, `ML.AGT.intentagent/v1`, `ML.AGT.aggregateentropycalculator/v1`, `ML.AGT.disambiguationpassexecutor/v1`, `ML.AGT.canonicalentityregistry/v1`
- **Used by:** `ML.SYN.71346834/v1`

### ConfidenceTracker
- **Type:** agent
- **Postcode:** `ML.AGT.confidencetracker/v1`
- **Path:** `AGENTS/confidencetracker.md`
- **Bounded context:** compilation-pipeline
- **Depends on:** `ML.SYN.71346834/v1`
- **Used by:** `ML.AGT.governoragent/v1`, `ML.SYN.71346834/v1`, `ML.AGT.fallbackblueprintresult/v1`

### PostcodeAddressFactory
- **Type:** agent
- **Postcode:** `ML.AGT.postcodeaddressfactory/v1`
- **Path:** `AGENTS/postcodeaddressfactory.md`
- **Bounded context:** provenance
- **Depends on:** `ML.SYN.71346834/v1`
- **Used by:** `ML.AGT.pipelineorchestrator/v1`, `ML.SYN.71346834/v1`, `ML.AGT.provenancestore/v1`, `ML.AGT.provenancechainvalidator/v1`, `ML.AGT.provenancerecordwriter/v1`, `ML.AGT.delegationcontract/v1`, `ML.AGT.handoffemitter/v1`

### ProvenanceStore
- **Type:** agent
- **Postcode:** `ML.AGT.provenancestore/v1`
- **Path:** `AGENTS/provenancestore.md`
- **Bounded context:** provenance
- **Depends on:** `ML.SYN.71346834/v1`, `ML.AGT.postcodeaddressfactory/v1`
- **Used by:** `ML.AGT.pipelineorchestrator/v1`, `ML.SYN.71346834/v1`, `ML.AGT.provenancechainvalidator/v1`, `ML.AGT.provenancerecordwriter/v1`

### ProvenanceChainValidator
- **Type:** agent
- **Postcode:** `ML.AGT.provenancechainvalidator/v1`
- **Path:** `AGENTS/provenancechainvalidator.md`
- **Bounded context:** provenance
- **Depends on:** `ML.SYN.71346834/v1`, `ML.AGT.provenancestore/v1`, `ML.AGT.postcodeaddressfactory/v1`
- **Used by:** `ML.AGT.verifyagent/v1`, `ML.SYN.71346834/v1`, `ML.AGT.entgateevaluator/v1`, `ML.AGT.verificationreport/v1`, `ML.AGT.syngateevaluator/v1`, `ML.AGT.entityextractor/v1`

### ProvenanceRecordWriter
- **Type:** agent
- **Postcode:** `ML.AGT.provenancerecordwriter/v1`
- **Path:** `AGENTS/provenancerecordwriter.md`
- **Bounded context:** provenance
- **Depends on:** `ML.SYN.71346834/v1`, `ML.AGT.provenancestore/v1`, `ML.AGT.postcodeaddressfactory/v1`
- **Used by:** `ML.SYN.71346834/v1`

### ENTGateEvaluator
- **Type:** agent
- **Postcode:** `ML.AGT.entgateevaluator/v1`
- **Path:** `AGENTS/entgateevaluator.md`
- **Bounded context:** provenance
- **Depends on:** `ML.SYN.71346834/v1`, `ML.AGT.provenancechainvalidator/v1`
- **Used by:** `ML.AGT.pipelineorchestrator/v1`, `ML.AGT.entityagent/v1`, `ML.SYN.71346834/v1`

### buildWorldState
- **Type:** agent
- **Postcode:** `ML.AGT.buildworldstate/v1`
- **Path:** `AGENTS/buildworldstate.md`
- **Bounded context:** runtime-governance
- **Depends on:** `ML.SYN.71346834/v1`
- **Used by:** `ML.SYN.71346834/v1`, `ML.AGT.runcompileloop/v1`, `ML.AGT.macroplan/v1`, `ML.AGT.startserver/v1`

### runCompileLoop
- **Type:** agent
- **Postcode:** `ML.AGT.runcompileloop/v1`
- **Path:** `AGENTS/runcompileloop.md`
- **Bounded context:** runtime-governance
- **Depends on:** `ML.SYN.71346834/v1`, `ML.AGT.buildworldstate/v1`, `ML.AGT.writecheckpoint/v1`
- **Used by:** `ML.SYN.71346834/v1`

### MacroPlan
- **Type:** agent
- **Postcode:** `ML.AGT.macroplan/v1`
- **Path:** `AGENTS/macroplan.md`
- **Bounded context:** runtime-governance
- **Depends on:** `ML.SYN.71346834/v1`, `ML.AGT.buildworldstate/v1`
- **Used by:** `ML.SYN.71346834/v1`

### DelegationContract
- **Type:** agent
- **Postcode:** `ML.AGT.delegationcontract/v1`
- **Path:** `AGENTS/delegationcontract.md`
- **Bounded context:** runtime-governance
- **Depends on:** `ML.SYN.71346834/v1`, `ML.AGT.postcodeaddressfactory/v1`
- **Used by:** `ML.SYN.71346834/v1`

### writeCheckpoint
- **Type:** agent
- **Postcode:** `ML.AGT.writecheckpoint/v1`
- **Path:** `AGENTS/writecheckpoint.md`
- **Bounded context:** runtime-governance
- **Depends on:** `ML.SYN.71346834/v1`, `ML.AGT.adastorage/v1`
- **Used by:** `ML.AGT.runcompileloop/v1`, `ML.SYN.71346834/v1`, `ML.AGT.startserver/v1`

### VerificationReport
- **Type:** agent
- **Postcode:** `ML.AGT.verificationreport/v1`
- **Path:** `AGENTS/verificationreport.md`
- **Bounded context:** runtime-governance
- **Depends on:** `ML.SYN.71346834/v1`, `ML.AGT.provenancechainvalidator/v1`
- **Used by:** `ML.SYN.71346834/v1`

### Skill
- **Type:** agent
- **Postcode:** `ML.AGT.skill/v1`
- **Path:** `AGENTS/skill.md`
- **Bounded context:** self-improvement
- **Depends on:** `ML.SYN.71346834/v1`, `ML.AGT.adastorage/v1`
- **Used by:** `ML.SYN.71346834/v1`

### Amendment
- **Type:** agent
- **Postcode:** `ML.AGT.amendment/v1`
- **Path:** `AGENTS/amendment.md`
- **Bounded context:** self-improvement
- **Depends on:** `ML.SYN.71346834/v1`, `ML.AGT.adastorage/v1`
- **Used by:** `ML.SYN.71346834/v1`

### SkillCandidate
- **Type:** agent
- **Postcode:** `ML.AGT.skillcandidate/v1`
- **Path:** `AGENTS/skillcandidate.md`
- **Bounded context:** self-improvement
- **Depends on:** `ML.SYN.71346834/v1`
- **Used by:** `ML.SYN.71346834/v1`

### ElicitationSessionManager
- **Type:** agent
- **Postcode:** `ML.AGT.elicitationsessionmanager/v1`
- **Path:** `AGENTS/elicitationsessionmanager.md`
- **Bounded context:** elicitation
- **Depends on:** `ML.SYN.71346834/v1`, `ML.AGT.dialogueengine/v1`, `ML.AGT.gapanalyzer/v1`, `ML.AGT.readinessassessor/v1`, `ML.AGT.draftintentgraphmanager/v1`, `ML.AGT.elicitationstore/v1`
- **Used by:** `ML.SYN.71346834/v1`

### DialogueEngine
- **Type:** agent
- **Postcode:** `ML.AGT.dialogueengine/v1`
- **Path:** `AGENTS/dialogueengine.md`
- **Bounded context:** elicitation
- **Depends on:** `ML.SYN.71346834/v1`
- **Used by:** `ML.AGT.elicitationsessionmanager/v1`, `ML.SYN.71346834/v1`

### GapAnalyzer
- **Type:** agent
- **Postcode:** `ML.AGT.gapanalyzer/v1`
- **Path:** `AGENTS/gapanalyzer.md`
- **Bounded context:** elicitation
- **Depends on:** `ML.SYN.71346834/v1`, `ML.AGT.draftintentgraphmanager/v1`
- **Used by:** `ML.AGT.elicitationsessionmanager/v1`, `ML.SYN.71346834/v1`, `ML.AGT.readinessassessor/v1`

### DraftIntentGraphManager
- **Type:** agent
- **Postcode:** `ML.AGT.draftintentgraphmanager/v1`
- **Path:** `AGENTS/draftintentgraphmanager.md`
- **Bounded context:** elicitation
- **Depends on:** `ML.SYN.71346834/v1`
- **Used by:** `ML.AGT.elicitationsessionmanager/v1`, `ML.AGT.gapanalyzer/v1`, `ML.SYN.71346834/v1`

### ReadinessAssessor
- **Type:** agent
- **Postcode:** `ML.AGT.readinessassessor/v1`
- **Path:** `AGENTS/readinessassessor.md`
- **Bounded context:** elicitation
- **Depends on:** `ML.SYN.71346834/v1`, `ML.AGT.gapanalyzer/v1`
- **Used by:** `ML.AGT.elicitationsessionmanager/v1`, `ML.SYN.71346834/v1`, `ML.AGT.handoffemitter/v1`

### HandoffEmitter
- **Type:** agent
- **Postcode:** `ML.AGT.handoffemitter/v1`
- **Path:** `AGENTS/handoffemitter.md`
- **Bounded context:** elicitation
- **Depends on:** `ML.SYN.71346834/v1`, `ML.AGT.postcodeaddressfactory/v1`, `ML.AGT.readinessassessor/v1`
- **Used by:** `ML.SYN.71346834/v1`

### writeConfigGraph
- **Type:** agent
- **Postcode:** `ML.AGT.writeconfiggraph/v1`
- **Path:** `AGENTS/writeconfiggraph.md`
- **Bounded context:** artifact-output
- **Depends on:** `ML.SYN.71346834/v1`, `ML.AGT.blueprinttoclaudemd/v1`, `ML.AGT.componentstoagents/v1`, `ML.AGT.invariantstohooks/v1`, `ML.AGT.buildcontracttobuildmd/v1`, `ML.AGT.blueprinttocontracts/v1`
- **Used by:** `ML.SYN.71346834/v1`

### blueprintToCLAUDEMD
- **Type:** agent
- **Postcode:** `ML.AGT.blueprinttoclaudemd/v1`
- **Path:** `AGENTS/blueprinttoclaudemd.md`
- **Bounded context:** artifact-output
- **Depends on:** `ML.SYN.71346834/v1`
- **Used by:** `ML.AGT.writeconfiggraph/v1`, `ML.SYN.71346834/v1`

### componentsToAgents
- **Type:** agent
- **Postcode:** `ML.AGT.componentstoagents/v1`
- **Path:** `AGENTS/componentstoagents.md`
- **Bounded context:** artifact-output
- **Depends on:** `ML.SYN.71346834/v1`
- **Used by:** `ML.AGT.writeconfiggraph/v1`, `ML.SYN.71346834/v1`

### invariantsToHooks
- **Type:** agent
- **Postcode:** `ML.AGT.invariantstohooks/v1`
- **Path:** `AGENTS/invariantstohooks.md`
- **Bounded context:** artifact-output
- **Depends on:** `ML.SYN.71346834/v1`
- **Used by:** `ML.AGT.writeconfiggraph/v1`, `ML.SYN.71346834/v1`

### deriveBuildContract
- **Type:** agent
- **Postcode:** `ML.AGT.derivebuildcontract/v1`
- **Path:** `AGENTS/derivebuildcontract.md`
- **Bounded context:** artifact-output
- **Depends on:** `ML.SYN.71346834/v1`
- **Used by:** `ML.SYN.71346834/v1`

### AdaStorage
- **Type:** agent
- **Postcode:** `ML.AGT.adastorage/v1`
- **Path:** `AGENTS/adastorage.md`
- **Bounded context:** storage
- **Depends on:** `ML.SYN.71346834/v1`
- **Used by:** `ML.AGT.pipelineorchestrator/v1`, `ML.AGT.writecheckpoint/v1`, `ML.AGT.skill/v1`, `ML.AGT.amendment/v1`, `ML.SYN.71346834/v1`, `ML.AGT.elicitationstore/v1`, `ML.AGT.startserver/v1`

### ElicitationStore
- **Type:** agent
- **Postcode:** `ML.AGT.elicitationstore/v1`
- **Path:** `AGENTS/elicitationstore.md`
- **Bounded context:** storage
- **Depends on:** `ML.SYN.71346834/v1`, `ML.AGT.adastorage/v1`
- **Used by:** `ML.AGT.elicitationsessionmanager/v1`, `ML.SYN.71346834/v1`

### startServer
- **Type:** agent
- **Postcode:** `ML.AGT.startserver/v1`
- **Path:** `AGENTS/startserver.md`
- **Bounded context:** runtime-governance
- **Depends on:** `ML.SYN.71346834/v1`, `ML.AGT.pipelineorchestrator/v1`, `ML.AGT.buildworldstate/v1`, `ML.AGT.writecheckpoint/v1`, `ML.AGT.adastorage/v1`
- **Used by:** `ML.SYN.71346834/v1`

### analyzeCodebase
- **Type:** agent
- **Postcode:** `ML.AGT.analyzecodebase/v1`
- **Path:** `AGENTS/analyzecodebase.md`
- **Bounded context:** compilation-pipeline
- **Depends on:** `ML.SYN.71346834/v1`, `ML.AGT.workspacepackagescanner/v1`
- **Used by:** `ML.SYN.71346834/v1`, `ML.AGT.diffblueprintagainstcode/v1`

### WorkspacePackageScanner
- **Type:** agent
- **Postcode:** `ML.AGT.workspacepackagescanner/v1`
- **Path:** `AGENTS/workspacepackagescanner.md`
- **Bounded context:** compilation-pipeline
- **Depends on:** `ML.SYN.71346834/v1`
- **Used by:** `ML.AGT.analyzecodebase/v1`, `ML.SYN.71346834/v1`

### diffBlueprintAgainstCode
- **Type:** agent
- **Postcode:** `ML.AGT.diffblueprintagainstcode/v1`
- **Path:** `AGENTS/diffblueprintagainstcode.md`
- **Bounded context:** compilation-pipeline
- **Depends on:** `ML.SYN.71346834/v1`, `ML.AGT.analyzecodebase/v1`
- **Used by:** `ML.SYN.71346834/v1`

### SYNGateEvaluator
- **Type:** agent
- **Postcode:** `ML.AGT.syngateevaluator/v1`
- **Path:** `AGENTS/syngateevaluator.md`
- **Bounded context:** compilation-pipeline
- **Depends on:** `ML.SYN.71346834/v1`, `ML.AGT.provenancechainvalidator/v1`
- **Used by:** `ML.AGT.synthesisagent/v1`, `ML.SYN.71346834/v1`

### EntityExtractor
- **Type:** agent
- **Postcode:** `ML.AGT.entityextractor/v1`
- **Path:** `AGENTS/entityextractor.md`
- **Bounded context:** compilation-pipeline
- **Depends on:** `ML.SYN.71346834/v1`, `ML.AGT.provenancechainvalidator/v1`
- **Used by:** `ML.AGT.entityagent/v1`, `ML.SYN.71346834/v1`

### FallbackBlueprintResult
- **Type:** agent
- **Postcode:** `ML.AGT.fallbackblueprintresult/v1`
- **Path:** `AGENTS/fallbackblueprintresult.md`
- **Bounded context:** compilation-pipeline
- **Depends on:** `ML.SYN.71346834/v1`, `ML.AGT.confidencetracker/v1`
- **Used by:** `ML.SYN.71346834/v1`

### semantic-intent-compilation-pipeline
- **Type:** skill
- **Postcode:** `ML.SKL.semantic-intent-compilation-pipeline/v1`
- **Path:** `SKILLS/semantic-intent-compilation-pipeline.md`
- **Implements:** semantic-intent-compilation-pipeline
- **Depends on:** `ML.SYN.71346834/v1`
- **Used by:** `ML.SYN.71346834/v1`

### governed-agent-execution-session
- **Type:** skill
- **Postcode:** `ML.SKL.governed-agent-execution-session/v1`
- **Path:** `SKILLS/governed-agent-execution-session.md`
- **Implements:** governed-agent-execution-session
- **Depends on:** `ML.SYN.71346834/v1`
- **Used by:** `ML.SYN.71346834/v1`

## Edge List

- `ML.SYN.71346834/v1` → `ML.AGT.pipelineorchestrator/v1` *(produces)*
- `ML.AGT.pipelineorchestrator/v1` → `ML.AGT.mothercompiler/v1` *(depends_on)*
- `ML.AGT.pipelineorchestrator/v1` → `ML.AGT.postcodeaddressfactory/v1` *(depends_on)*
- `ML.AGT.pipelineorchestrator/v1` → `ML.AGT.provenancestore/v1` *(depends_on)*
- `ML.AGT.pipelineorchestrator/v1` → `ML.AGT.adastorage/v1` *(depends_on)*
- `ML.AGT.pipelineorchestrator/v1` → `ML.AGT.entgateevaluator/v1` *(depends_on)*
- `ML.SYN.71346834/v1` → `ML.AGT.mothercompiler/v1` *(produces)*
- `ML.AGT.mothercompiler/v1` → `ML.AGT.intentagent/v1` *(depends_on)*
- `ML.AGT.mothercompiler/v1` → `ML.AGT.personaagent/v1` *(depends_on)*
- `ML.AGT.mothercompiler/v1` → `ML.AGT.entityagent/v1` *(depends_on)*
- `ML.AGT.mothercompiler/v1` → `ML.AGT.processagent/v1` *(depends_on)*
- `ML.AGT.mothercompiler/v1` → `ML.AGT.synthesisagent/v1` *(depends_on)*
- `ML.AGT.mothercompiler/v1` → `ML.AGT.verifyagent/v1` *(depends_on)*
- `ML.AGT.mothercompiler/v1` → `ML.AGT.governoragent/v1` *(depends_on)*
- `ML.SYN.71346834/v1` → `ML.AGT.intentagent/v1` *(produces)*
- `ML.SYN.71346834/v1` → `ML.AGT.personaagent/v1` *(produces)*
- `ML.AGT.personaagent/v1` → `ML.AGT.intentagent/v1` *(depends_on)*
- `ML.SYN.71346834/v1` → `ML.AGT.entityagent/v1` *(produces)*
- `ML.AGT.entityagent/v1` → `ML.AGT.personaagent/v1` *(depends_on)*
- `ML.AGT.entityagent/v1` → `ML.AGT.entgateevaluator/v1` *(depends_on)*
- `ML.AGT.entityagent/v1` → `ML.AGT.entityextractor/v1` *(depends_on)*
- `ML.SYN.71346834/v1` → `ML.AGT.processagent/v1` *(produces)*
- `ML.AGT.processagent/v1` → `ML.AGT.entityagent/v1` *(depends_on)*
- `ML.SYN.71346834/v1` → `ML.AGT.synthesisagent/v1` *(produces)*
- `ML.AGT.synthesisagent/v1` → `ML.AGT.processagent/v1` *(depends_on)*
- `ML.AGT.synthesisagent/v1` → `ML.AGT.syngateevaluator/v1` *(depends_on)*
- `ML.SYN.71346834/v1` → `ML.AGT.verifyagent/v1` *(produces)*
- `ML.AGT.verifyagent/v1` → `ML.AGT.synthesisagent/v1` *(depends_on)*
- `ML.AGT.verifyagent/v1` → `ML.AGT.provenancechainvalidator/v1` *(depends_on)*
- `ML.SYN.71346834/v1` → `ML.AGT.governoragent/v1` *(produces)*
- `ML.AGT.governoragent/v1` → `ML.AGT.verifyagent/v1` *(depends_on)*
- `ML.AGT.governoragent/v1` → `ML.AGT.confidencetracker/v1` *(depends_on)*
- `ML.SYN.71346834/v1` → `ML.AGT.intstagecontroller/v1` *(produces)*
- `ML.AGT.intstagecontroller/v1` → `ML.AGT.intentagent/v1` *(depends_on)*
- `ML.AGT.intstagecontroller/v1` → `ML.AGT.aggregateentropycalculator/v1` *(depends_on)*
- `ML.AGT.intstagecontroller/v1` → `ML.AGT.disambiguationpassexecutor/v1` *(depends_on)*
- `ML.AGT.intstagecontroller/v1` → `ML.AGT.canonicalentityregistry/v1` *(depends_on)*
- `ML.SYN.71346834/v1` → `ML.AGT.confidencetracker/v1` *(produces)*
- `ML.SYN.71346834/v1` → `ML.AGT.postcodeaddressfactory/v1` *(produces)*
- `ML.SYN.71346834/v1` → `ML.AGT.provenancestore/v1` *(produces)*
- `ML.AGT.provenancestore/v1` → `ML.AGT.postcodeaddressfactory/v1` *(depends_on)*
- `ML.SYN.71346834/v1` → `ML.AGT.provenancechainvalidator/v1` *(produces)*
- `ML.AGT.provenancechainvalidator/v1` → `ML.AGT.provenancestore/v1` *(depends_on)*
- `ML.AGT.provenancechainvalidator/v1` → `ML.AGT.postcodeaddressfactory/v1` *(depends_on)*
- `ML.SYN.71346834/v1` → `ML.AGT.provenancerecordwriter/v1` *(produces)*
- `ML.AGT.provenancerecordwriter/v1` → `ML.AGT.provenancestore/v1` *(depends_on)*
- `ML.AGT.provenancerecordwriter/v1` → `ML.AGT.postcodeaddressfactory/v1` *(depends_on)*
- `ML.SYN.71346834/v1` → `ML.AGT.entgateevaluator/v1` *(produces)*
- `ML.AGT.entgateevaluator/v1` → `ML.AGT.provenancechainvalidator/v1` *(depends_on)*
- `ML.SYN.71346834/v1` → `ML.AGT.buildworldstate/v1` *(produces)*
- `ML.SYN.71346834/v1` → `ML.AGT.runcompileloop/v1` *(produces)*
- `ML.AGT.runcompileloop/v1` → `ML.AGT.buildworldstate/v1` *(depends_on)*
- `ML.AGT.runcompileloop/v1` → `ML.AGT.writecheckpoint/v1` *(depends_on)*
- `ML.SYN.71346834/v1` → `ML.AGT.macroplan/v1` *(produces)*
- `ML.AGT.macroplan/v1` → `ML.AGT.buildworldstate/v1` *(depends_on)*
- `ML.SYN.71346834/v1` → `ML.AGT.delegationcontract/v1` *(produces)*
- `ML.AGT.delegationcontract/v1` → `ML.AGT.postcodeaddressfactory/v1` *(depends_on)*
- `ML.SYN.71346834/v1` → `ML.AGT.writecheckpoint/v1` *(produces)*
- `ML.AGT.writecheckpoint/v1` → `ML.AGT.adastorage/v1` *(depends_on)*
- `ML.SYN.71346834/v1` → `ML.AGT.verificationreport/v1` *(produces)*
- `ML.AGT.verificationreport/v1` → `ML.AGT.provenancechainvalidator/v1` *(depends_on)*
- `ML.SYN.71346834/v1` → `ML.AGT.skill/v1` *(produces)*
- `ML.AGT.skill/v1` → `ML.AGT.adastorage/v1` *(depends_on)*
- `ML.SYN.71346834/v1` → `ML.AGT.amendment/v1` *(produces)*
- `ML.AGT.amendment/v1` → `ML.AGT.adastorage/v1` *(depends_on)*
- `ML.SYN.71346834/v1` → `ML.AGT.skillcandidate/v1` *(produces)*
- `ML.SYN.71346834/v1` → `ML.AGT.elicitationsessionmanager/v1` *(produces)*
- `ML.AGT.elicitationsessionmanager/v1` → `ML.AGT.dialogueengine/v1` *(depends_on)*
- `ML.AGT.elicitationsessionmanager/v1` → `ML.AGT.gapanalyzer/v1` *(depends_on)*
- `ML.AGT.elicitationsessionmanager/v1` → `ML.AGT.readinessassessor/v1` *(depends_on)*
- `ML.AGT.elicitationsessionmanager/v1` → `ML.AGT.draftintentgraphmanager/v1` *(depends_on)*
- `ML.AGT.elicitationsessionmanager/v1` → `ML.AGT.elicitationstore/v1` *(depends_on)*
- `ML.SYN.71346834/v1` → `ML.AGT.dialogueengine/v1` *(produces)*
- `ML.SYN.71346834/v1` → `ML.AGT.gapanalyzer/v1` *(produces)*
- `ML.AGT.gapanalyzer/v1` → `ML.AGT.draftintentgraphmanager/v1` *(depends_on)*
- `ML.SYN.71346834/v1` → `ML.AGT.draftintentgraphmanager/v1` *(produces)*
- `ML.SYN.71346834/v1` → `ML.AGT.readinessassessor/v1` *(produces)*
- `ML.AGT.readinessassessor/v1` → `ML.AGT.gapanalyzer/v1` *(depends_on)*
- `ML.SYN.71346834/v1` → `ML.AGT.handoffemitter/v1` *(produces)*
- `ML.AGT.handoffemitter/v1` → `ML.AGT.postcodeaddressfactory/v1` *(depends_on)*
- `ML.AGT.handoffemitter/v1` → `ML.AGT.readinessassessor/v1` *(depends_on)*
- `ML.SYN.71346834/v1` → `ML.AGT.writeconfiggraph/v1` *(produces)*
- `ML.AGT.writeconfiggraph/v1` → `ML.AGT.blueprinttoclaudemd/v1` *(depends_on)*
- `ML.AGT.writeconfiggraph/v1` → `ML.AGT.componentstoagents/v1` *(depends_on)*
- `ML.AGT.writeconfiggraph/v1` → `ML.AGT.invariantstohooks/v1` *(depends_on)*
- `ML.AGT.writeconfiggraph/v1` → `ML.AGT.buildcontracttobuildmd/v1` *(depends_on)*
- `ML.AGT.writeconfiggraph/v1` → `ML.AGT.blueprinttocontracts/v1` *(depends_on)*
- `ML.SYN.71346834/v1` → `ML.AGT.blueprinttoclaudemd/v1` *(produces)*
- `ML.SYN.71346834/v1` → `ML.AGT.componentstoagents/v1` *(produces)*
- `ML.SYN.71346834/v1` → `ML.AGT.invariantstohooks/v1` *(produces)*
- `ML.SYN.71346834/v1` → `ML.AGT.derivebuildcontract/v1` *(produces)*
- `ML.SYN.71346834/v1` → `ML.AGT.adastorage/v1` *(produces)*
- `ML.SYN.71346834/v1` → `ML.AGT.elicitationstore/v1` *(produces)*
- `ML.AGT.elicitationstore/v1` → `ML.AGT.adastorage/v1` *(depends_on)*
- `ML.SYN.71346834/v1` → `ML.AGT.startserver/v1` *(produces)*
- `ML.AGT.startserver/v1` → `ML.AGT.pipelineorchestrator/v1` *(depends_on)*
- `ML.AGT.startserver/v1` → `ML.AGT.buildworldstate/v1` *(depends_on)*
- `ML.AGT.startserver/v1` → `ML.AGT.writecheckpoint/v1` *(depends_on)*
- `ML.AGT.startserver/v1` → `ML.AGT.adastorage/v1` *(depends_on)*
- `ML.SYN.71346834/v1` → `ML.AGT.analyzecodebase/v1` *(produces)*
- `ML.AGT.analyzecodebase/v1` → `ML.AGT.workspacepackagescanner/v1` *(depends_on)*
- `ML.SYN.71346834/v1` → `ML.AGT.workspacepackagescanner/v1` *(produces)*
- `ML.SYN.71346834/v1` → `ML.AGT.diffblueprintagainstcode/v1` *(produces)*
- `ML.AGT.diffblueprintagainstcode/v1` → `ML.AGT.analyzecodebase/v1` *(depends_on)*
- `ML.SYN.71346834/v1` → `ML.AGT.syngateevaluator/v1` *(produces)*
- `ML.AGT.syngateevaluator/v1` → `ML.AGT.provenancechainvalidator/v1` *(depends_on)*
- `ML.SYN.71346834/v1` → `ML.AGT.entityextractor/v1` *(produces)*
- `ML.AGT.entityextractor/v1` → `ML.AGT.provenancechainvalidator/v1` *(depends_on)*
- `ML.SYN.71346834/v1` → `ML.AGT.fallbackblueprintresult/v1` *(produces)*
- `ML.AGT.fallbackblueprintresult/v1` → `ML.AGT.confidencetracker/v1` *(depends_on)*
- `ML.SYN.71346834/v1` → `ML.SKL.semantic-intent-compilation-pipeline/v1` *(defines)*
- `ML.SYN.71346834/v1` → `ML.SKL.governed-agent-execution-session/v1` *(defines)*