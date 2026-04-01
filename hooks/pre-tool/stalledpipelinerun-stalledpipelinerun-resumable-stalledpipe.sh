#!/bin/bash
# Invariant: stalledPipelineRun.resumable === stalledPipelineRun.blockers.every(b => b.isCleared)
# Entity: StalledPipelineRun
# Description: run is resumable only when all blockers have been cleared
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: stalledPipelineRun.resumable === stalledPipelineRun.blockers.every(b => b.isCleared)
exit 0
