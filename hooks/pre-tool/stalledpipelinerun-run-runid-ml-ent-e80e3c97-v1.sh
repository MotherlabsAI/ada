#!/bin/bash
# Invariant: run.runId === "ML.ENT.e80e3c97/v1"
# Entity: StalledPipelineRun
# Description: this entity represents the specific stalled run named in G3; any other runId is a different run instance
# Context guard: only enforce during an active Ada pipeline run
# Drains stdin first to avoid broken pipe, then exits cleanly if not in Ada context
INPUT=$(cat)
[ -z "$ADA_PIPELINE_RUN_ID" ] && exit 0
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: run.runId === "ML.ENT.e80e3c97/v1"
exit 0
