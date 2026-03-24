#!/bin/bash
# Invariant: run.resumable === false ? run.blockers.some(b => b.isCleared === false) : true
# Entity: StalledPipelineRun
# Description: a non-resumable run must have at least one uncleared blocker; if all are cleared it must be resumable
# Context guard: only enforce during an active Ada pipeline run
# Drains stdin first to avoid broken pipe, then exits cleanly if not in Ada context
INPUT=$(cat)
[ -z "$ADA_PIPELINE_RUN_ID" ] && exit 0
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: run.resumable === false ? run.blockers.some(b => b.isCleared === false) : true
exit 0
