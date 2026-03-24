#!/bin/bash
# Invariant: assignment.isResolved === true ? assignment.provenanceRecordPostcode !== null : true
# Entity: ComponentPackageAssignment
# Description: resolved assignments must carry a provenance postcode so the chain can be validated
# Context guard: only enforce during an active Ada pipeline run
# Drains stdin first to avoid broken pipe, then exits cleanly if not in Ada context
INPUT=$(cat)
[ -z "$ADA_PIPELINE_RUN_ID" ] && exit 0
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: assignment.isResolved === true ? assignment.provenanceRecordPostcode !== null : true
exit 0
