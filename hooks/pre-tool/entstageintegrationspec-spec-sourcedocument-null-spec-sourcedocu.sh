#!/bin/bash
# Invariant: spec.sourceDocument !== null && spec.sourceDocument.length > 0
# Entity: ENTStageIntegrationSpec
# Description: the spec must reference its source document or its authority cannot be established
# Context guard: only enforce during an active Ada pipeline run
# Drains stdin first to avoid broken pipe, then exits cleanly if not in Ada context
INPUT=$(cat)
[ -z "$ADA_PIPELINE_RUN_ID" ] && exit 0
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: spec.sourceDocument !== null && spec.sourceDocument.length > 0
exit 0
