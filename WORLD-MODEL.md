---
ada_postcode: "ML.L4A.CFG.GLO.HOW.SFT.dda3a60b/v1"
ada_type: world-model
ada_blueprint: "ML.L2I.REL.GLO.WHT.SFT.3b2e2a71/v1"
ada_nodes: 35
ada_compiled_at: 1776808391828
---

# World Model

This is the navigable graph of all compiled artifacts. Every node has a postcode. Every edge is a typed relationship. Load any node and traverse to its neighbors.

## Nodes (35)

### Ada is a semantic compiler and runtime governance infrastruc
- **Type:** blueprint
- **Postcode:** `ML.L2I.REL.GLO.WHT.SFT.3b2e2a71/v1`
- **Path:** `CLAUDE.md`
- **Implements:** BootstrapSeed, ProvenanceStore, AdaStorage, Governor, ConfidenceTracker, ENTGateEvaluator, evaluateSemanticGate, createGovernedCanUseTool, groundIntent, INTStageController, DialogueEngine, startServer, compileIntent, checkDrift, buildWorldModel, writeConfigGraph, PipelineOrchestrator, PersonaAgent, ProcessAgent, MotherCompiler, RunStore, DriftScoreCalculator, evaluateSemanticDrift, EmbeddingProvider, ManifoldProjector, blueprintToCLAUDEMD, invariantsToHooks, blueprintToContracts, workflowsToSkills, buildSettings, componentsToAgents, ProvenanceChainValidator

### BootstrapSeed
- **Type:** agent
- **Postcode:** `ML.AGT.bootstrapseed/v1`
- **Path:** `AGENTS/bootstrapseed.md`
- **Bounded context:** Bootstrap
- **Depends on:** `ML.L2I.REL.GLO.WHT.SFT.3b2e2a71/v1`, `ML.AGT.adastorage/v1`
- **Used by:** `ML.L2I.REL.GLO.WHT.SFT.3b2e2a71/v1`

### ProvenanceStore
- **Type:** agent
- **Postcode:** `ML.AGT.provenancestore/v1`
- **Path:** `AGENTS/provenancestore.md`
- **Bounded context:** Bootstrap
- **Depends on:** `ML.L2I.REL.GLO.WHT.SFT.3b2e2a71/v1`
- **Used by:** `ML.L2I.REL.GLO.WHT.SFT.3b2e2a71/v1`, `ML.AGT.buildworldmodel/v1`, `ML.AGT.processagent/v1`, `ML.AGT.manifoldprojector/v1`, `ML.AGT.blueprinttoclaudemd/v1`, `ML.AGT.invariantstohooks/v1`, `ML.AGT.blueprinttocontracts/v1`, `ML.AGT.workflowstoskills/v1`, `ML.AGT.componentstoagents/v1`, `ML.AGT.provenancechainvalidator/v1`

### AdaStorage
- **Type:** agent
- **Postcode:** `ML.AGT.adastorage/v1`
- **Path:** `AGENTS/adastorage.md`
- **Bounded context:** Bootstrap
- **Depends on:** `ML.L2I.REL.GLO.WHT.SFT.3b2e2a71/v1`
- **Used by:** `ML.AGT.bootstrapseed/v1`, `ML.L2I.REL.GLO.WHT.SFT.3b2e2a71/v1`, `ML.AGT.groundintent/v1`, `ML.AGT.buildworldmodel/v1`, `ML.AGT.writeconfiggraph/v1`, `ML.AGT.runstore/v1`, `ML.AGT.manifoldprojector/v1`

### Governor
- **Type:** agent
- **Postcode:** `ML.AGT.governor/v1`
- **Path:** `AGENTS/governor.md`
- **Bounded context:** GovernanceCore
- **Depends on:** `ML.L2I.REL.GLO.WHT.SFT.3b2e2a71/v1`, `ML.AGT.driftscorecalculator/v1`, `ML.AGT.evaluatesemanticgate/v1`, `ML.AGT.evaluateinvariants/v1`
- **Used by:** `ML.L2I.REL.GLO.WHT.SFT.3b2e2a71/v1`, `ML.AGT.creategovernedcanusetool/v1`, `ML.AGT.pipelineorchestrator/v1`

### ConfidenceTracker
- **Type:** agent
- **Postcode:** `ML.AGT.confidencetracker/v1`
- **Path:** `AGENTS/confidencetracker.md`
- **Bounded context:** GovernanceCore
- **Depends on:** `ML.L2I.REL.GLO.WHT.SFT.3b2e2a71/v1`
- **Used by:** `ML.L2I.REL.GLO.WHT.SFT.3b2e2a71/v1`

### ENTGateEvaluator
- **Type:** agent
- **Postcode:** `ML.AGT.entgateevaluator/v1`
- **Path:** `AGENTS/entgateevaluator.md`
- **Bounded context:** GateEnforcement
- **Depends on:** `ML.L2I.REL.GLO.WHT.SFT.3b2e2a71/v1`, `ML.AGT.provenancechainvalidator/v1`, `ML.AGT.entityregistrationservice/v1`, `ML.AGT.embeddingprovider/v1`
- **Used by:** `ML.L2I.REL.GLO.WHT.SFT.3b2e2a71/v1`, `ML.AGT.pipelineorchestrator/v1`

### evaluateSemanticGate
- **Type:** agent
- **Postcode:** `ML.AGT.evaluatesemanticgate/v1`
- **Path:** `AGENTS/evaluatesemanticgate.md`
- **Bounded context:** GateEnforcement
- **Depends on:** `ML.L2I.REL.GLO.WHT.SFT.3b2e2a71/v1`, `ML.AGT.embeddingprovider/v1`, `ML.AGT.driftscorecalculator/v1`
- **Used by:** `ML.AGT.governor/v1`, `ML.L2I.REL.GLO.WHT.SFT.3b2e2a71/v1`, `ML.AGT.creategovernedcanusetool/v1`

### createGovernedCanUseTool
- **Type:** agent
- **Postcode:** `ML.AGT.creategovernedcanusetool/v1`
- **Path:** `AGENTS/creategovernedcanusetool.md`
- **Bounded context:** GateEnforcement
- **Depends on:** `ML.L2I.REL.GLO.WHT.SFT.3b2e2a71/v1`, `ML.AGT.evaluatesemanticgate/v1`, `ML.AGT.governor/v1`, `ML.AGT.driftscorecalculator/v1`
- **Used by:** `ML.L2I.REL.GLO.WHT.SFT.3b2e2a71/v1`

### groundIntent
- **Type:** agent
- **Postcode:** `ML.AGT.groundintent/v1`
- **Path:** `AGENTS/groundintent.md`
- **Bounded context:** IntentResolution
- **Depends on:** `ML.L2I.REL.GLO.WHT.SFT.3b2e2a71/v1`, `ML.AGT.discovercontext/v1`, `ML.AGT.adastorage/v1`
- **Used by:** `ML.L2I.REL.GLO.WHT.SFT.3b2e2a71/v1`, `ML.AGT.intstagecontroller/v1`, `ML.AGT.pipelineorchestrator/v1`, `ML.AGT.personaagent/v1`

### INTStageController
- **Type:** agent
- **Postcode:** `ML.AGT.intstagecontroller/v1`
- **Path:** `AGENTS/intstagecontroller.md`
- **Bounded context:** IntentResolution
- **Depends on:** `ML.L2I.REL.GLO.WHT.SFT.3b2e2a71/v1`, `ML.AGT.groundintent/v1`, `ML.AGT.aggregateentropycalculator/v1`, `ML.AGT.disambiguationpassexecutor/v1`, `ML.AGT.canonicalentityregistry/v1`
- **Used by:** `ML.L2I.REL.GLO.WHT.SFT.3b2e2a71/v1`, `ML.AGT.pipelineorchestrator/v1`

### DialogueEngine
- **Type:** agent
- **Postcode:** `ML.AGT.dialogueengine/v1`
- **Path:** `AGENTS/dialogueengine.md`
- **Bounded context:** IntentResolution
- **Depends on:** `ML.L2I.REL.GLO.WHT.SFT.3b2e2a71/v1`, `ML.AGT.gapanalyzer/v1`, `ML.AGT.readinessassessor/v1`, `ML.AGT.draftintentgraphmanager/v1`
- **Used by:** `ML.L2I.REL.GLO.WHT.SFT.3b2e2a71/v1`

### startServer
- **Type:** agent
- **Postcode:** `ML.AGT.startserver/v1`
- **Path:** `AGENTS/startserver.md`
- **Bounded context:** MCPIntegration
- **Depends on:** `ML.L2I.REL.GLO.WHT.SFT.3b2e2a71/v1`, `ML.AGT.compileintent/v1`, `ML.AGT.getblueprint/v1`, `ML.AGT.getcontract/v1`, `ML.AGT.queryconstraints/v1`, `ML.AGT.checkdrift/v1`, `ML.AGT.logdrift/v1`, `ML.AGT.advanceexecution/v1`, `ML.AGT.createcheckpoint/v1`, `ML.AGT.rollbackto/v1`, `ML.AGT.settaskstatus/v1`, `ML.AGT.completesubgoal/v1`, `ML.AGT.runverificationstack/v1`
- **Used by:** `ML.L2I.REL.GLO.WHT.SFT.3b2e2a71/v1`, `ML.AGT.manifoldprojector/v1`

### compileIntent
- **Type:** agent
- **Postcode:** `ML.AGT.compileintent/v1`
- **Path:** `AGENTS/compileintent.md`
- **Bounded context:** MCPIntegration
- **Depends on:** `ML.L2I.REL.GLO.WHT.SFT.3b2e2a71/v1`, `ML.AGT.pipelineorchestrator/v1`
- **Used by:** `ML.AGT.startserver/v1`, `ML.L2I.REL.GLO.WHT.SFT.3b2e2a71/v1`

### checkDrift
- **Type:** agent
- **Postcode:** `ML.AGT.checkdrift/v1`
- **Path:** `AGENTS/checkdrift.md`
- **Bounded context:** MCPIntegration
- **Depends on:** `ML.L2I.REL.GLO.WHT.SFT.3b2e2a71/v1`, `ML.AGT.driftscorecalculator/v1`
- **Used by:** `ML.AGT.startserver/v1`, `ML.L2I.REL.GLO.WHT.SFT.3b2e2a71/v1`

### buildWorldModel
- **Type:** agent
- **Postcode:** `ML.AGT.buildworldmodel/v1`
- **Path:** `AGENTS/buildworldmodel.md`
- **Bounded context:** WorldModeling
- **Depends on:** `ML.L2I.REL.GLO.WHT.SFT.3b2e2a71/v1`, `ML.AGT.adastorage/v1`, `ML.AGT.embeddingprovider/v1`, `ML.AGT.provenancestore/v1`
- **Used by:** `ML.L2I.REL.GLO.WHT.SFT.3b2e2a71/v1`, `ML.AGT.writeconfiggraph/v1`, `ML.AGT.manifoldprojector/v1`

### writeConfigGraph
- **Type:** agent
- **Postcode:** `ML.AGT.writeconfiggraph/v1`
- **Path:** `AGENTS/writeconfiggraph.md`
- **Bounded context:** WorldModeling
- **Depends on:** `ML.L2I.REL.GLO.WHT.SFT.3b2e2a71/v1`, `ML.AGT.adastorage/v1`, `ML.AGT.buildworldmodel/v1`
- **Used by:** `ML.L2I.REL.GLO.WHT.SFT.3b2e2a71/v1`

### PipelineOrchestrator
- **Type:** agent
- **Postcode:** `ML.AGT.pipelineorchestrator/v1`
- **Path:** `AGENTS/pipelineorchestrator.md`
- **Bounded context:** PipelineOrchestration
- **Depends on:** `ML.L2I.REL.GLO.WHT.SFT.3b2e2a71/v1`, `ML.AGT.personaagent/v1`, `ML.AGT.processagent/v1`, `ML.AGT.entgateevaluator/v1`, `ML.AGT.governor/v1`, `ML.AGT.manifoldprojector/v1`, `ML.AGT.runverificationstack/v1`, `ML.AGT.groundintent/v1`, `ML.AGT.intstagecontroller/v1`
- **Used by:** `ML.AGT.compileintent/v1`, `ML.L2I.REL.GLO.WHT.SFT.3b2e2a71/v1`, `ML.AGT.mothercompiler/v1`

### PersonaAgent
- **Type:** agent
- **Postcode:** `ML.AGT.personaagent/v1`
- **Path:** `AGENTS/personaagent.md`
- **Bounded context:** PipelineOrchestration
- **Depends on:** `ML.L2I.REL.GLO.WHT.SFT.3b2e2a71/v1`, `ML.AGT.groundintent/v1`, `ML.AGT.embeddingprovider/v1`
- **Used by:** `ML.AGT.pipelineorchestrator/v1`, `ML.L2I.REL.GLO.WHT.SFT.3b2e2a71/v1`

### ProcessAgent
- **Type:** agent
- **Postcode:** `ML.AGT.processagent/v1`
- **Path:** `AGENTS/processagent.md`
- **Bounded context:** PipelineOrchestration
- **Depends on:** `ML.L2I.REL.GLO.WHT.SFT.3b2e2a71/v1`, `ML.AGT.callwithextendedthinking/v1`, `ML.AGT.provenancestore/v1`
- **Used by:** `ML.AGT.pipelineorchestrator/v1`, `ML.L2I.REL.GLO.WHT.SFT.3b2e2a71/v1`

### MotherCompiler
- **Type:** agent
- **Postcode:** `ML.AGT.mothercompiler/v1`
- **Path:** `AGENTS/mothercompiler.md`
- **Bounded context:** PipelineOrchestration
- **Depends on:** `ML.L2I.REL.GLO.WHT.SFT.3b2e2a71/v1`, `ML.AGT.pipelineorchestrator/v1`, `ML.AGT.runstore/v1`
- **Used by:** `ML.L2I.REL.GLO.WHT.SFT.3b2e2a71/v1`

### RunStore
- **Type:** agent
- **Postcode:** `ML.AGT.runstore/v1`
- **Path:** `AGENTS/runstore.md`
- **Bounded context:** PipelineOrchestration
- **Depends on:** `ML.L2I.REL.GLO.WHT.SFT.3b2e2a71/v1`, `ML.AGT.adastorage/v1`
- **Used by:** `ML.AGT.mothercompiler/v1`, `ML.L2I.REL.GLO.WHT.SFT.3b2e2a71/v1`

### DriftScoreCalculator
- **Type:** agent
- **Postcode:** `ML.AGT.driftscorecalculator/v1`
- **Path:** `AGENTS/driftscorecalculator.md`
- **Bounded context:** DriftMonitoring
- **Depends on:** `ML.L2I.REL.GLO.WHT.SFT.3b2e2a71/v1`, `ML.AGT.embeddingprovider/v1`
- **Used by:** `ML.AGT.governor/v1`, `ML.AGT.evaluatesemanticgate/v1`, `ML.AGT.creategovernedcanusetool/v1`, `ML.AGT.checkdrift/v1`, `ML.L2I.REL.GLO.WHT.SFT.3b2e2a71/v1`, `ML.AGT.evaluatesemanticdrift/v1`

### evaluateSemanticDrift
- **Type:** agent
- **Postcode:** `ML.AGT.evaluatesemanticdrift/v1`
- **Path:** `AGENTS/evaluatesemanticdrift.md`
- **Bounded context:** DriftMonitoring
- **Depends on:** `ML.L2I.REL.GLO.WHT.SFT.3b2e2a71/v1`, `ML.AGT.driftscorecalculator/v1`, `ML.AGT.embeddingprovider/v1`
- **Used by:** `ML.L2I.REL.GLO.WHT.SFT.3b2e2a71/v1`

### EmbeddingProvider
- **Type:** agent
- **Postcode:** `ML.AGT.embeddingprovider/v1`
- **Path:** `AGENTS/embeddingprovider.md`
- **Bounded context:** DriftMonitoring
- **Depends on:** `ML.L2I.REL.GLO.WHT.SFT.3b2e2a71/v1`
- **Used by:** `ML.AGT.entgateevaluator/v1`, `ML.AGT.evaluatesemanticgate/v1`, `ML.AGT.buildworldmodel/v1`, `ML.AGT.personaagent/v1`, `ML.AGT.driftscorecalculator/v1`, `ML.AGT.evaluatesemanticdrift/v1`, `ML.L2I.REL.GLO.WHT.SFT.3b2e2a71/v1`

### ManifoldProjector
- **Type:** agent
- **Postcode:** `ML.AGT.manifoldprojector/v1`
- **Path:** `AGENTS/manifoldprojector.md`
- **Bounded context:** ArtifactProvenance
- **Depends on:** `ML.L2I.REL.GLO.WHT.SFT.3b2e2a71/v1`, `ML.AGT.adastorage/v1`, `ML.AGT.provenancestore/v1`, `ML.AGT.buildworldmodel/v1`, `ML.AGT.startserver/v1`
- **Used by:** `ML.AGT.pipelineorchestrator/v1`, `ML.L2I.REL.GLO.WHT.SFT.3b2e2a71/v1`

### blueprintToCLAUDEMD
- **Type:** agent
- **Postcode:** `ML.AGT.blueprinttoclaudemd/v1`
- **Path:** `AGENTS/blueprinttoclaudemd.md`
- **Bounded context:** ArtifactProvenance
- **Depends on:** `ML.L2I.REL.GLO.WHT.SFT.3b2e2a71/v1`, `ML.AGT.provenancestore/v1`
- **Used by:** `ML.L2I.REL.GLO.WHT.SFT.3b2e2a71/v1`

### invariantsToHooks
- **Type:** agent
- **Postcode:** `ML.AGT.invariantstohooks/v1`
- **Path:** `AGENTS/invariantstohooks.md`
- **Bounded context:** ArtifactProvenance
- **Depends on:** `ML.L2I.REL.GLO.WHT.SFT.3b2e2a71/v1`, `ML.AGT.provenancestore/v1`
- **Used by:** `ML.L2I.REL.GLO.WHT.SFT.3b2e2a71/v1`

### blueprintToContracts
- **Type:** agent
- **Postcode:** `ML.AGT.blueprinttocontracts/v1`
- **Path:** `AGENTS/blueprinttocontracts.md`
- **Bounded context:** ArtifactProvenance
- **Depends on:** `ML.L2I.REL.GLO.WHT.SFT.3b2e2a71/v1`, `ML.AGT.provenancestore/v1`
- **Used by:** `ML.L2I.REL.GLO.WHT.SFT.3b2e2a71/v1`

### workflowsToSkills
- **Type:** agent
- **Postcode:** `ML.AGT.workflowstoskills/v1`
- **Path:** `AGENTS/workflowstoskills.md`
- **Bounded context:** ArtifactProvenance
- **Depends on:** `ML.L2I.REL.GLO.WHT.SFT.3b2e2a71/v1`, `ML.AGT.provenancestore/v1`
- **Used by:** `ML.L2I.REL.GLO.WHT.SFT.3b2e2a71/v1`

### buildSettings
- **Type:** agent
- **Postcode:** `ML.AGT.buildsettings/v1`
- **Path:** `AGENTS/buildsettings.md`
- **Bounded context:** ArtifactProvenance
- **Depends on:** `ML.L2I.REL.GLO.WHT.SFT.3b2e2a71/v1`
- **Used by:** `ML.L2I.REL.GLO.WHT.SFT.3b2e2a71/v1`

### componentsToAgents
- **Type:** agent
- **Postcode:** `ML.AGT.componentstoagents/v1`
- **Path:** `AGENTS/componentstoagents.md`
- **Bounded context:** ArtifactProvenance
- **Depends on:** `ML.L2I.REL.GLO.WHT.SFT.3b2e2a71/v1`, `ML.AGT.provenancestore/v1`
- **Used by:** `ML.L2I.REL.GLO.WHT.SFT.3b2e2a71/v1`

### ProvenanceChainValidator
- **Type:** agent
- **Postcode:** `ML.AGT.provenancechainvalidator/v1`
- **Path:** `AGENTS/provenancechainvalidator.md`
- **Bounded context:** ArtifactProvenance
- **Depends on:** `ML.L2I.REL.GLO.WHT.SFT.3b2e2a71/v1`, `ML.AGT.provenancestore/v1`
- **Used by:** `ML.AGT.entgateevaluator/v1`, `ML.L2I.REL.GLO.WHT.SFT.3b2e2a71/v1`

### semantic-pipeline-compilation
- **Type:** skill
- **Postcode:** `ML.SKL.semantic-pipeline-compilation/v1`
- **Path:** `SKILLS/semantic-pipeline-compilation.md`
- **Implements:** semantic-pipeline-compilation
- **Depends on:** `ML.L2I.REL.GLO.WHT.SFT.3b2e2a71/v1`
- **Used by:** `ML.L2I.REL.GLO.WHT.SFT.3b2e2a71/v1`

### runtime-semantic-gate-enforcement
- **Type:** skill
- **Postcode:** `ML.SKL.runtime-semantic-gate-enforcement/v1`
- **Path:** `SKILLS/runtime-semantic-gate-enforcement.md`
- **Implements:** runtime-semantic-gate-enforcement
- **Depends on:** `ML.L2I.REL.GLO.WHT.SFT.3b2e2a71/v1`
- **Used by:** `ML.L2I.REL.GLO.WHT.SFT.3b2e2a71/v1`

## Edge List

- `ML.L2I.REL.GLO.WHT.SFT.3b2e2a71/v1` → `ML.AGT.bootstrapseed/v1` *(produces)*
- `ML.AGT.bootstrapseed/v1` → `ML.AGT.adastorage/v1` *(depends_on)*
- `ML.L2I.REL.GLO.WHT.SFT.3b2e2a71/v1` → `ML.AGT.provenancestore/v1` *(produces)*
- `ML.L2I.REL.GLO.WHT.SFT.3b2e2a71/v1` → `ML.AGT.adastorage/v1` *(produces)*
- `ML.L2I.REL.GLO.WHT.SFT.3b2e2a71/v1` → `ML.AGT.governor/v1` *(produces)*
- `ML.AGT.governor/v1` → `ML.AGT.driftscorecalculator/v1` *(depends_on)*
- `ML.AGT.governor/v1` → `ML.AGT.evaluatesemanticgate/v1` *(depends_on)*
- `ML.AGT.governor/v1` → `ML.AGT.evaluateinvariants/v1` *(depends_on)*
- `ML.L2I.REL.GLO.WHT.SFT.3b2e2a71/v1` → `ML.AGT.confidencetracker/v1` *(produces)*
- `ML.L2I.REL.GLO.WHT.SFT.3b2e2a71/v1` → `ML.AGT.entgateevaluator/v1` *(produces)*
- `ML.AGT.entgateevaluator/v1` → `ML.AGT.provenancechainvalidator/v1` *(depends_on)*
- `ML.AGT.entgateevaluator/v1` → `ML.AGT.entityregistrationservice/v1` *(depends_on)*
- `ML.AGT.entgateevaluator/v1` → `ML.AGT.embeddingprovider/v1` *(depends_on)*
- `ML.L2I.REL.GLO.WHT.SFT.3b2e2a71/v1` → `ML.AGT.evaluatesemanticgate/v1` *(produces)*
- `ML.AGT.evaluatesemanticgate/v1` → `ML.AGT.embeddingprovider/v1` *(depends_on)*
- `ML.AGT.evaluatesemanticgate/v1` → `ML.AGT.driftscorecalculator/v1` *(depends_on)*
- `ML.L2I.REL.GLO.WHT.SFT.3b2e2a71/v1` → `ML.AGT.creategovernedcanusetool/v1` *(produces)*
- `ML.AGT.creategovernedcanusetool/v1` → `ML.AGT.evaluatesemanticgate/v1` *(depends_on)*
- `ML.AGT.creategovernedcanusetool/v1` → `ML.AGT.governor/v1` *(depends_on)*
- `ML.AGT.creategovernedcanusetool/v1` → `ML.AGT.driftscorecalculator/v1` *(depends_on)*
- `ML.L2I.REL.GLO.WHT.SFT.3b2e2a71/v1` → `ML.AGT.groundintent/v1` *(produces)*
- `ML.AGT.groundintent/v1` → `ML.AGT.discovercontext/v1` *(depends_on)*
- `ML.AGT.groundintent/v1` → `ML.AGT.adastorage/v1` *(depends_on)*
- `ML.L2I.REL.GLO.WHT.SFT.3b2e2a71/v1` → `ML.AGT.intstagecontroller/v1` *(produces)*
- `ML.AGT.intstagecontroller/v1` → `ML.AGT.groundintent/v1` *(depends_on)*
- `ML.AGT.intstagecontroller/v1` → `ML.AGT.aggregateentropycalculator/v1` *(depends_on)*
- `ML.AGT.intstagecontroller/v1` → `ML.AGT.disambiguationpassexecutor/v1` *(depends_on)*
- `ML.AGT.intstagecontroller/v1` → `ML.AGT.canonicalentityregistry/v1` *(depends_on)*
- `ML.L2I.REL.GLO.WHT.SFT.3b2e2a71/v1` → `ML.AGT.dialogueengine/v1` *(produces)*
- `ML.AGT.dialogueengine/v1` → `ML.AGT.gapanalyzer/v1` *(depends_on)*
- `ML.AGT.dialogueengine/v1` → `ML.AGT.readinessassessor/v1` *(depends_on)*
- `ML.AGT.dialogueengine/v1` → `ML.AGT.draftintentgraphmanager/v1` *(depends_on)*
- `ML.L2I.REL.GLO.WHT.SFT.3b2e2a71/v1` → `ML.AGT.startserver/v1` *(produces)*
- `ML.AGT.startserver/v1` → `ML.AGT.compileintent/v1` *(depends_on)*
- `ML.AGT.startserver/v1` → `ML.AGT.getblueprint/v1` *(depends_on)*
- `ML.AGT.startserver/v1` → `ML.AGT.getcontract/v1` *(depends_on)*
- `ML.AGT.startserver/v1` → `ML.AGT.queryconstraints/v1` *(depends_on)*
- `ML.AGT.startserver/v1` → `ML.AGT.checkdrift/v1` *(depends_on)*
- `ML.AGT.startserver/v1` → `ML.AGT.logdrift/v1` *(depends_on)*
- `ML.AGT.startserver/v1` → `ML.AGT.advanceexecution/v1` *(depends_on)*
- `ML.AGT.startserver/v1` → `ML.AGT.createcheckpoint/v1` *(depends_on)*
- `ML.AGT.startserver/v1` → `ML.AGT.rollbackto/v1` *(depends_on)*
- `ML.AGT.startserver/v1` → `ML.AGT.settaskstatus/v1` *(depends_on)*
- `ML.AGT.startserver/v1` → `ML.AGT.completesubgoal/v1` *(depends_on)*
- `ML.AGT.startserver/v1` → `ML.AGT.runverificationstack/v1` *(depends_on)*
- `ML.L2I.REL.GLO.WHT.SFT.3b2e2a71/v1` → `ML.AGT.compileintent/v1` *(produces)*
- `ML.AGT.compileintent/v1` → `ML.AGT.pipelineorchestrator/v1` *(depends_on)*
- `ML.L2I.REL.GLO.WHT.SFT.3b2e2a71/v1` → `ML.AGT.checkdrift/v1` *(produces)*
- `ML.AGT.checkdrift/v1` → `ML.AGT.driftscorecalculator/v1` *(depends_on)*
- `ML.L2I.REL.GLO.WHT.SFT.3b2e2a71/v1` → `ML.AGT.buildworldmodel/v1` *(produces)*
- `ML.AGT.buildworldmodel/v1` → `ML.AGT.adastorage/v1` *(depends_on)*
- `ML.AGT.buildworldmodel/v1` → `ML.AGT.embeddingprovider/v1` *(depends_on)*
- `ML.AGT.buildworldmodel/v1` → `ML.AGT.provenancestore/v1` *(depends_on)*
- `ML.L2I.REL.GLO.WHT.SFT.3b2e2a71/v1` → `ML.AGT.writeconfiggraph/v1` *(produces)*
- `ML.AGT.writeconfiggraph/v1` → `ML.AGT.adastorage/v1` *(depends_on)*
- `ML.AGT.writeconfiggraph/v1` → `ML.AGT.buildworldmodel/v1` *(depends_on)*
- `ML.L2I.REL.GLO.WHT.SFT.3b2e2a71/v1` → `ML.AGT.pipelineorchestrator/v1` *(produces)*
- `ML.AGT.pipelineorchestrator/v1` → `ML.AGT.personaagent/v1` *(depends_on)*
- `ML.AGT.pipelineorchestrator/v1` → `ML.AGT.processagent/v1` *(depends_on)*
- `ML.AGT.pipelineorchestrator/v1` → `ML.AGT.entgateevaluator/v1` *(depends_on)*
- `ML.AGT.pipelineorchestrator/v1` → `ML.AGT.governor/v1` *(depends_on)*
- `ML.AGT.pipelineorchestrator/v1` → `ML.AGT.manifoldprojector/v1` *(depends_on)*
- `ML.AGT.pipelineorchestrator/v1` → `ML.AGT.runverificationstack/v1` *(depends_on)*
- `ML.AGT.pipelineorchestrator/v1` → `ML.AGT.groundintent/v1` *(depends_on)*
- `ML.AGT.pipelineorchestrator/v1` → `ML.AGT.intstagecontroller/v1` *(depends_on)*
- `ML.L2I.REL.GLO.WHT.SFT.3b2e2a71/v1` → `ML.AGT.personaagent/v1` *(produces)*
- `ML.AGT.personaagent/v1` → `ML.AGT.groundintent/v1` *(depends_on)*
- `ML.AGT.personaagent/v1` → `ML.AGT.embeddingprovider/v1` *(depends_on)*
- `ML.L2I.REL.GLO.WHT.SFT.3b2e2a71/v1` → `ML.AGT.processagent/v1` *(produces)*
- `ML.AGT.processagent/v1` → `ML.AGT.callwithextendedthinking/v1` *(depends_on)*
- `ML.AGT.processagent/v1` → `ML.AGT.provenancestore/v1` *(depends_on)*
- `ML.L2I.REL.GLO.WHT.SFT.3b2e2a71/v1` → `ML.AGT.mothercompiler/v1` *(produces)*
- `ML.AGT.mothercompiler/v1` → `ML.AGT.pipelineorchestrator/v1` *(depends_on)*
- `ML.AGT.mothercompiler/v1` → `ML.AGT.runstore/v1` *(depends_on)*
- `ML.L2I.REL.GLO.WHT.SFT.3b2e2a71/v1` → `ML.AGT.runstore/v1` *(produces)*
- `ML.AGT.runstore/v1` → `ML.AGT.adastorage/v1` *(depends_on)*
- `ML.L2I.REL.GLO.WHT.SFT.3b2e2a71/v1` → `ML.AGT.driftscorecalculator/v1` *(produces)*
- `ML.AGT.driftscorecalculator/v1` → `ML.AGT.embeddingprovider/v1` *(depends_on)*
- `ML.L2I.REL.GLO.WHT.SFT.3b2e2a71/v1` → `ML.AGT.evaluatesemanticdrift/v1` *(produces)*
- `ML.AGT.evaluatesemanticdrift/v1` → `ML.AGT.driftscorecalculator/v1` *(depends_on)*
- `ML.AGT.evaluatesemanticdrift/v1` → `ML.AGT.embeddingprovider/v1` *(depends_on)*
- `ML.L2I.REL.GLO.WHT.SFT.3b2e2a71/v1` → `ML.AGT.embeddingprovider/v1` *(produces)*
- `ML.L2I.REL.GLO.WHT.SFT.3b2e2a71/v1` → `ML.AGT.manifoldprojector/v1` *(produces)*
- `ML.AGT.manifoldprojector/v1` → `ML.AGT.adastorage/v1` *(depends_on)*
- `ML.AGT.manifoldprojector/v1` → `ML.AGT.provenancestore/v1` *(depends_on)*
- `ML.AGT.manifoldprojector/v1` → `ML.AGT.buildworldmodel/v1` *(depends_on)*
- `ML.AGT.manifoldprojector/v1` → `ML.AGT.startserver/v1` *(depends_on)*
- `ML.L2I.REL.GLO.WHT.SFT.3b2e2a71/v1` → `ML.AGT.blueprinttoclaudemd/v1` *(produces)*
- `ML.AGT.blueprinttoclaudemd/v1` → `ML.AGT.provenancestore/v1` *(depends_on)*
- `ML.L2I.REL.GLO.WHT.SFT.3b2e2a71/v1` → `ML.AGT.invariantstohooks/v1` *(produces)*
- `ML.AGT.invariantstohooks/v1` → `ML.AGT.provenancestore/v1` *(depends_on)*
- `ML.L2I.REL.GLO.WHT.SFT.3b2e2a71/v1` → `ML.AGT.blueprinttocontracts/v1` *(produces)*
- `ML.AGT.blueprinttocontracts/v1` → `ML.AGT.provenancestore/v1` *(depends_on)*
- `ML.L2I.REL.GLO.WHT.SFT.3b2e2a71/v1` → `ML.AGT.workflowstoskills/v1` *(produces)*
- `ML.AGT.workflowstoskills/v1` → `ML.AGT.provenancestore/v1` *(depends_on)*
- `ML.L2I.REL.GLO.WHT.SFT.3b2e2a71/v1` → `ML.AGT.buildsettings/v1` *(produces)*
- `ML.L2I.REL.GLO.WHT.SFT.3b2e2a71/v1` → `ML.AGT.componentstoagents/v1` *(produces)*
- `ML.AGT.componentstoagents/v1` → `ML.AGT.provenancestore/v1` *(depends_on)*
- `ML.L2I.REL.GLO.WHT.SFT.3b2e2a71/v1` → `ML.AGT.provenancechainvalidator/v1` *(produces)*
- `ML.AGT.provenancechainvalidator/v1` → `ML.AGT.provenancestore/v1` *(depends_on)*
- `ML.L2I.REL.GLO.WHT.SFT.3b2e2a71/v1` → `ML.SKL.semantic-pipeline-compilation/v1` *(defines)*
- `ML.L2I.REL.GLO.WHT.SFT.3b2e2a71/v1` → `ML.SKL.runtime-semantic-gate-enforcement/v1` *(defines)*