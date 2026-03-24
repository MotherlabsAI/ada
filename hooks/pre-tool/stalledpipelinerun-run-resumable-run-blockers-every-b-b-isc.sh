#!/bin/bash
# Invariant: run.resumable === run.blockers.every(b => b.isCleared)
# Entity: StalledPipelineRun
# Description: resumability is exactly the condition that all blockers are cleared; partial clearance is not enough to advance
# Context guard: only enforce during an active Ada pipeline run
# Drains stdin first to avoid broken pipe, then exits cleanly if not in Ada context
INPUT=$(cat)
[ -z "$ADA_PIPELINE_RUN_ID" ] && exit 0
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: run.resumable === run.blockers.every(b => b.isCleared)
exit 0
