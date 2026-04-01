# Ada is a semantic operating system that compiles human intent into governed Claude Code execution artifacts

Ada is a semantic operating system that compiles human intent into governed Claude Code execution artifacts. It operates a 9-stage sequential pipeline (CTX→INT→PER→ENT→PRO→SYN→VER→GOV→BLD) that transforms raw intent through elicitation, domain modeling, entity extraction, process modeling, synthesis, verification, and governance into output configuration artifacts (CLAUDE.md, agent files, hooks, .mcp.json, BUILD.md, .ada/state.json). Every intermediate artifact is content-addressed via PostcodeAddress provenance, and a governor issues ACCEPT/REJECT/ITERATE decisions bounded to 3 iterations. Runtime execution enforces hierarchical delegation with macro-planners, micro-executors bounded by fileScope, and independent verifiers that never implement. Self-improvement is confined to workflows and skills — the governance core is immutable.

## Out of Scope
Ada explicitly excluded these. Do not build them:
- ISO Ada programming language (Ada 83/95/2005/2012/2022) — no GNAT toolchain, no .adb/.ads files, no Ada runtime, no AdaCore references
- Browser execution environments — no DOM APIs, no window/document globals, no browser-targeted bundlers
- npm and yarn package managers — pnpm workspace protocol exclusively
- In-pipeline database or filesystem writes — all stage state in-memory; SQLite writes post-stage only
- Machine learning model training, fine-tuning, or local inference — Ada consumes Claude API only
- Application source code generation — Ada produces governance configuration artifacts only
- REST API, GraphQL, or gRPC service layers — only stdio MCP server and CLI permitted
- Multi-user or multi-tenant operation — single operator, single project context
- Automated amendment approval — human operator is sole approver
- Standalone MCP daemon or persistent service — subprocess only via ada mcp
- React or browser UI components — no frontend, CLI is the only human-facing interface
- Chatbot or question-answering behavior — elicitation is proposals-first, not open-ended dialogue
- Skill extraction targeting governance core — only workflows and execution patterns on improvable surface
- External API calls within pipeline stages — compilation is self-contained, LLM calls mediated through compiler Claude client only
- Parallel or out-of-order pipeline stage execution — strictly sequential CTX→BLD
- Infinite GOV iteration — bounded at max 3 iterations, 4th REJECT is terminal FATAL

## Build Order
1. **IntentAgent** `compilation-pipeline`
2. **PersonaAgent** `compilation-pipeline`
3. **PostcodeAddressFactory** `provenance`
4. **ProvenanceStore** `provenance`
5. **ProvenanceChainValidator** `provenance`
6. **ENTGateEvaluator** `provenance`
7. **EntityExtractor** `compilation-pipeline`
8. **EntityAgent** `compilation-pipeline`
9. **ProcessAgent** `compilation-pipeline`
10. **SYNGateEvaluator** `compilation-pipeline`
11. **SynthesisAgent** `compilation-pipeline`
12. **VerifyAgent** `compilation-pipeline`
13. **ConfidenceTracker** `compilation-pipeline`
14. **GovernorAgent** `compilation-pipeline`
15. **MotherCompiler** `compilation-pipeline`
16. **AdaStorage** `storage`
17. **PipelineOrchestrator** `compilation-pipeline`
18. **INTStageController** `compilation-pipeline`
19. **ProvenanceRecordWriter** `provenance`
20. **buildWorldState** `runtime-governance`
21. **writeCheckpoint** `runtime-governance`
22. **runCompileLoop** `runtime-governance`
23. **MacroPlan** `runtime-governance`
24. **DelegationContract** `runtime-governance`
25. **VerificationReport** `runtime-governance`
26. **Skill** `self-improvement`
27. **Amendment** `self-improvement`
28. **SkillCandidate** `self-improvement`
29. **DialogueEngine** `elicitation`
30. **DraftIntentGraphManager** `elicitation`
31. **GapAnalyzer** `elicitation`
32. **ReadinessAssessor** `elicitation`
33. **ElicitationStore** `storage`
34. **ElicitationSessionManager** `elicitation`
35. **HandoffEmitter** `elicitation`
36. **blueprintToCLAUDEMD** `artifact-output`
37. **componentsToAgents** `artifact-output`
38. **invariantsToHooks** `artifact-output`
39. **writeConfigGraph** `artifact-output`
40. **deriveBuildContract** `artifact-output`
41. **startServer** `runtime-governance`
42. **WorkspacePackageScanner** `compilation-pipeline`
43. **analyzeCodebase** `compilation-pipeline`
44. **diffBlueprintAgainstCode** `compilation-pipeline`
45. **FallbackBlueprintResult** `compilation-pipeline`

## Ada MCP
The MCP server is the spec authority. Pull context on demand — never assume from memory.

**Start of every task:** call `ada.advance_execution(agentId)` — returns your task brief, bounded context contract, and execution instructions.

**Before modifying any entity:**
- `ada.query_constraints(entityName)` — get invariants and constraints
- `ada.check_drift(description)` — verify a planned action against original intent

**During execution:**
- `ada.get_contract(boundedContext)` — read your delegation contract
- `ada.get_workflow(workflowName)` — get step-by-step workflow with Hoare triples
- `ada.report_execution_failure(component, description)` — request retry guidance
- `ada.set_task_status(component, 'complete', [evidence])` — mark complete

## Compilation Health
**Decision:** ACCEPT  **Confidence:** 95%  **Gates:** 100%

## This Session
You are the lead agent. Call `ada.advance_execution(agentId)` to get your first task. Follow the execution brief. Verify postconditions before marking complete.
