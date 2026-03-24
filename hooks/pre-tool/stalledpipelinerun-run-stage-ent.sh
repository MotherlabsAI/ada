#!/bin/bash
# Invariant: run.stage === "ENT"
# Entity: StalledPipelineRun
# Description: this run is stalled at the ENT stage specifically; a different stage means G3 is not satisfied
# Context guard: only enforce during an active Ada pipeline run
# Drains stdin first to avoid broken pipe, then exits cleanly if not in Ada context
INPUT=$(cat)
[ -z "$ADA_PIPELINE_RUN_ID" ] && exit 0
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: run.stage === "ENT"
exit 0
