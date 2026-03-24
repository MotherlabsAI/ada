#!/bin/bash
# Ada pre-tool dispatcher — single entry point for all ENT-stage invariant hooks.
#
# Claude Code calls this once per Bash tool invocation instead of calling
# 77 individual hooks. This keeps the UI clean (1 event vs 77) while
# preserving full enforcement during Ada pipeline runs.
#
# Activation: the Ada orchestrator sets ADA_PIPELINE_RUN_ID before any
# tool sequence that requires invariant enforcement. Without it, this
# dispatcher exits 0 immediately and produces no output.

INPUT=$(cat)

# Not in an Ada pipeline run — skip all enforcement silently.
[ -z "$ADA_PIPELINE_RUN_ID" ] && exit 0

# Resolve the project root relative to this script's location.
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Run each registered hook in sequence, passing the original stdin payload.
# Any hook that exits non-zero blocks the tool call and surfaces the reason.
HOOKS=(
  "hooks/pre-tool/blueprintcomponentregistry-registry-totalcomponentcount-10.sh"
  "hooks/pre-tool/blueprintcomponentregistry-registry-components-length-registry-tota.sh"
  "hooks/pre-tool/blueprintcomponentregistry-new-set-registry-components-map-c-c-ordi.sh"
  "hooks/pre-tool/blueprintcomponentregistry-registry-pipelinerunid-null-registry-pip.sh"
  "hooks/pre-tool/blueprintcomponentregistry-registry-postcode-null-registry-postcode.sh"
  "hooks/pre-tool/namedblueprintcomponent-component-ordinal-1-component-ordinal-10.sh"
  "hooks/pre-tool/namedblueprintcomponent-component-componentid-null-component-com.sh"
  "hooks/pre-tool/namedblueprintcomponent-component-registryid-null-component-regi.sh"
  "hooks/pre-tool/namedblueprintcomponent-component-name-null-component-name-lengt.sh"
  "hooks/pre-tool/namedblueprintcomponent-component-ordinal-3-component-assignedpa.sh"
  "hooks/pre-tool/c3assignmentgap-gap-componentordinal-3.sh"
  "hooks/pre-tool/c3assignmentgap-gap-isresolved-false-gap-resolvedpackage.sh"
  "hooks/pre-tool/c3assignmentgap-gap-isresolved-true-gap-resolvedpackage-.sh"
  "hooks/pre-tool/c3assignmentgap-gap-isresolved-true-gap-resolutionproven.sh"
  "hooks/pre-tool/c3assignmentgap-gap-componentid-null-gap-componentid-len.sh"
  "hooks/pre-tool/componentpackagemapping-mapping-assignmentcount-mapping-assignme.sh"
  "hooks/pre-tool/componentpackagemapping-mapping-istotal-mapping-assignmentcount-.sh"
  "hooks/pre-tool/componentpackagemapping-new-set-mapping-assignments-map-a-a-comp.sh"
  "hooks/pre-tool/componentpackagemapping-new-set-mapping-assignments-map-a-a-targ.sh"
  "hooks/pre-tool/componentpackagemapping-mapping-istotal-true-mapping-postcode-nu.sh"
  "hooks/pre-tool/componentpackageassignment-assignment-componentordinal-1-assignment.sh"
  "hooks/pre-tool/componentpackageassignment-assignment-isresolved-true-assignment-pr.sh"
  "hooks/pre-tool/componentpackageassignment-assignment-componentid-null-assignment-c.sh"
  "hooks/pre-tool/componentpackageassignment-assignment-mappingid-null-assignment-map.sh"
  "hooks/pre-tool/workspacepackagenode-node-packagename-null-node-packagename-l.sh"
  "hooks/pre-tool/workspacepackagenode-node-assignedcomponentids-length-1.sh"
  "hooks/pre-tool/workspacepackagenode-node-pipelinestage-null-node-pipelinesta.sh"
  "hooks/pre-tool/ententityregistration-registration-targetregistrytype-entityma.sh"
  "hooks/pre-tool/ententityregistration-registration-provenancerecordpostcode-nu.sh"
  "hooks/pre-tool/ententityregistration-registration-entitymappostcode-null-regi.sh"
  "hooks/pre-tool/ententityregistration-registration-sourcecomponentid-null-regi.sh"
  "hooks/pre-tool/ententityregistration-registration-registeredat-0.sh"
  "hooks/pre-tool/entitymap-entitymap-entitycount-entitymap-entities.sh"
  "hooks/pre-tool/entitymap-entitymap-pipelinerunid-null-entitymap-p.sh"
  "hooks/pre-tool/entitymap-entitymap-postcode-null-entitymap-postco.sh"
  "hooks/pre-tool/entitymap-entitymap-entitycount-0.sh"
  "hooks/pre-tool/provenancechainrecord-chain-hopcount-3.sh"
  "hooks/pre-tool/provenancechainrecord-chain-hops-length-chain-hopcount.sh"
  "hooks/pre-tool/provenancechainrecord-chain-provenanceintact-chain-hops-every-.sh"
  "hooks/pre-tool/provenancechainrecord-chain-componentid-null-chain-componentid.sh"
  "hooks/pre-tool/provenancechainrecord-chain-hops-0-hopindex-0-chain-hops-1-hop.sh"
  "hooks/pre-tool/provenancechainhop-hop-hopindex-0-hop-hopindex-1-hop-hopind.sh"
  "hooks/pre-tool/provenancechainhop-hop-istraced-true-hop-provenancerecordpo.sh"
  "hooks/pre-tool/provenancechainhop-hop-istraced-false-hop-provenancerecordp.sh"
  "hooks/pre-tool/provenancechainhop-hop-fromlabel-null-hop-fromlabel-length-.sh"
  "hooks/pre-tool/provenancechainhop-hop-tolabel-null-hop-tolabel-length-0.sh"
  "hooks/pre-tool/provenancechainhop-hop-chainid-null-hop-chainid-length-0.sh"
  "hooks/pre-tool/entprovenancerecord-record-stage-ent.sh"
  "hooks/pre-tool/entprovenancerecord-record-postcode-null-record-postcode-len.sh"
  "hooks/pre-tool/entprovenancerecord-record-pipelinerunid-null-record-pipelin.sh"
  "hooks/pre-tool/entprovenancerecord-record-timestamp-0.sh"
  "hooks/pre-tool/entprovenancerecord-record-subjectid-null-record-subjectid-l.sh"
  "hooks/pre-tool/entgaterecord-gate-passed-gate-provenanceintact-gate-a.sh"
  "hooks/pre-tool/entgaterecord-gate-evaluatedat-null-gate-state-pending.sh"
  "hooks/pre-tool/entgaterecord-gate-evaluatedat-null-gate-passed-false-.sh"
  "hooks/pre-tool/entgaterecord-gate-pipelinerunid-null-gate-pipelinerun.sh"
  "hooks/pre-tool/entgaterecord-gate-entitycount-0.sh"
  "hooks/pre-tool/entblocker-blocker-iscleared-false-blocker-cleareda.sh"
  "hooks/pre-tool/entblocker-blocker-iscleared-true-blocker-clearedat.sh"
  "hooks/pre-tool/entblocker-blocker-iscleared-true-blocker-clearance.sh"
  "hooks/pre-tool/entblocker-blocker-linkedgapid-null-blocker-linkedg.sh"
  "hooks/pre-tool/entblocker-blocker-pipelinerunid-null-blocker-pipel.sh"
  "hooks/pre-tool/stalledpipelinerun-run-runid-ml-ent-e80e3c97-v1.sh"
  "hooks/pre-tool/stalledpipelinerun-run-stage-ent.sh"
  "hooks/pre-tool/stalledpipelinerun-run-blockercount-run-blockers-length.sh"
  "hooks/pre-tool/stalledpipelinerun-run-resumable-run-blockers-every-b-b-isc.sh"
  "hooks/pre-tool/stalledpipelinerun-run-resumable-false-run-blockers-some-b-.sh"
  "hooks/pre-tool/codebaseintegritystate-state-typescriptcompiles-state-typescrip.sh"
  "hooks/pre-tool/codebaseintegritystate-state-testsuitepassrate-state-totaltestc.sh"
  "hooks/pre-tool/codebaseintegritystate-state-regressiondetected-state-failedtes.sh"
  "hooks/pre-tool/codebaseintegritystate-state-capturedat-0.sh"
  "hooks/pre-tool/codebaseintegritystate-state-totaltestcount-0-state-failedtestc.sh"
  "hooks/pre-tool/entstageintegrationspec-spec-declaredcomponentcount-10.sh"
  "hooks/pre-tool/entstageintegrationspec-spec-declaredpackagecount-8.sh"
  "hooks/pre-tool/entstageintegrationspec-spec-requiredprovenancehopcount-3.sh"
  "hooks/pre-tool/entstageintegrationspec-spec-c3gapordinal-3.sh"
  "hooks/pre-tool/entstageintegrationspec-spec-sourcedocument-null-spec-sourcedocu.sh"
)

for hook in "${HOOKS[@]}"; do
  hook_path="$PROJECT_ROOT/$hook"
  if [ ! -f "$hook_path" ]; then
    echo "Ada hook not found: $hook" >&2
    exit 1
  fi
  result=$(echo "$INPUT" | bash "$hook_path" 2>&1)
  exit_code=$?
  if [ $exit_code -ne 0 ]; then
    echo "$result"
    exit $exit_code
  fi
done

exit 0
