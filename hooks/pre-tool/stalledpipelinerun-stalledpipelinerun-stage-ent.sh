#!/bin/bash
# Invariant: stalledPipelineRun.stage === 'ENT'
# Entity: StalledPipelineRun
# Description: the run is stalled at ENT stage specifically; without this, the wrong stage would be targeted for unblocking
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: stalledPipelineRun.stage === 'ENT'
exit 0
