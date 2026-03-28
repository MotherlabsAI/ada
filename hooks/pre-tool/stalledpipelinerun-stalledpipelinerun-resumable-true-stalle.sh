#!/bin/bash
# Invariant: stalledPipelineRun.resumable === true ? stalledPipelineRun.blockers.every(b => b.isCleared) : true
# Entity: StalledPipelineRun
# Description: the run cannot be resumable while any blocker remains uncleared; a premature resumable flag would skip required gap resolution
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: stalledPipelineRun.resumable === true ? stalledPipelineRun.blockers.every(b => b.isCleared) : true
exit 0
