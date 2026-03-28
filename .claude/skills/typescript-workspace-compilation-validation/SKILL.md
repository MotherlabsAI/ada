---
name: typescript-workspace-compilation-validation
description: "Use when source files authored or modified in monorepo packages to implement ENT-stage integration — TypeScript compilation must pass clean across all workspace packages pattern detected."
---

# TypeScript-Workspace-Compilation-Validation

Trigger: source files authored or modified in monorepo packages to implement ENT-stage integration — TypeScript compilation must pass clean across all workspace packages

## Steps
1. **identify-affected-source-files**
   - Pre: `monorepo workspace packages are enumerated AND at least one MonorepoSourceFile has been modified or created as part of ENT-stage implementation AND pnpm workspace configuration is valid`
   - Action: `scan all workspace packages for modified TypeScriptCompilationUnit files, identify which packages import from ENT-stage types (BlueprintComponentRegistry, ComponentPackageMapping, ENTEntityMap, ProvenanceChainRecord, ENTGateRecord, ENTStageResult, C3AssignmentGap, CanonicalEntity, ENTEntityRegistration, CollapseRecord), build a dependency graph of affected compilation units`
   - Post: `affected MonorepoSourceFile list is complete AND dependency graph shows all transitive import chains AND no circular dependencies exist among ENT-stage type definitions`

2. **compile-workspace-packages-in-dependency-order**
   - Pre: `affected MonorepoSourceFile list is finalized AND tsconfig.json exists in each affected package AND all package.json files declare correct peerDependencies for cross-package type imports`
   - Action: `run tsc --build in topological order across all affected workspace packages respecting inter-package type dependencies, collect TypeScriptError records for each compilation unit, for each error record: fileName, lineNumber, errorCode, errorMessage`
   - Post: `all TypeScriptCompilationUnit records emit zero TypeScriptError entries AND compiled output .d.ts files exist for all packages that export ENT-stage types AND no implicit any errors remain`

3. **verify-test-suite-results**
   - Pre: `all workspace packages compile clean with zero TypeScriptError records AND TestSuiteResult records exist for ENT-stage unit tests`
   - Action: `run test suite for each affected workspace package, collect TestSuiteResult per package including passCount, failCount, and any failed test names related to ENT-stage behavior (registry loading, gap resolution, entity extraction, provenance tracing, gate evaluation)`
   - Post: `all TestSuiteResult records have failCount=0 AND passCount equals total test count AND no test covering ENT-stage behavior is skipped`
