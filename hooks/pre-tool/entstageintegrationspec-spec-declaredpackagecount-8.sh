#!/bin/bash
# Invariant: spec.declaredPackageCount === 8
# Entity: ENTStageIntegrationSpec
# Description: the spec declares exactly 8 target packages; any other value contradicts the mapping structure
# Context guard: only enforce during an active Ada pipeline run
# Drains stdin first to avoid broken pipe, then exits cleanly if not in Ada context
INPUT=$(cat)
[ -z "$ADA_PIPELINE_RUN_ID" ] && exit 0
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: spec.declaredPackageCount === 8
exit 0
