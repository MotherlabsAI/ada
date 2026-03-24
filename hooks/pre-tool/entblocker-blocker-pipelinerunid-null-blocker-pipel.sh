#!/bin/bash
# Invariant: blocker.pipelineRunId !== null && blocker.pipelineRunId.length > 0
# Entity: ENTBlocker
# Description: blockers must be scoped to a run or they contaminate gate evaluation across runs
# Context guard: only enforce during an active Ada pipeline run
# Drains stdin first to avoid broken pipe, then exits cleanly if not in Ada context
INPUT=$(cat)
[ -z "$ADA_PIPELINE_RUN_ID" ] && exit 0
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: blocker.pipelineRunId !== null && blocker.pipelineRunId.length > 0
exit 0
