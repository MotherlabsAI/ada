#!/bin/bash
# Invariant: spec.declaredComponentCount === 10
# Entity: ENTStageIntegrationSpec
# Description: the spec declares exactly 10 components; any other value contradicts the CLAUDE.md source document
# Context guard: only enforce during an active Ada pipeline run
# Drains stdin first to avoid broken pipe, then exits cleanly if not in Ada context
INPUT=$(cat)
[ -z "$ADA_PIPELINE_RUN_ID" ] && exit 0
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: spec.declaredComponentCount === 10
exit 0
