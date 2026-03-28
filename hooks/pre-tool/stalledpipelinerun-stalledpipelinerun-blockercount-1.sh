#!/bin/bash
# Invariant: stalledPipelineRun.blockerCount >= 1
# Entity: StalledPipelineRun
# Description: a stalled run must have at least one blocker; zero blockers means the run is not stalled and this entity should not exist
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: stalledPipelineRun.blockerCount >= 1
exit 0
