#!/bin/bash
# Invariant: run.resumable === run.blockers.every(b => b.isCleared)
# Entity: StalledPipelineRun
# Description: the run is only resumable when all blockers are cleared — a resumable flag with uncleared blockers is a false clearance
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: run.resumable === run.blockers.every(b => b.isCleared)
exit 0
