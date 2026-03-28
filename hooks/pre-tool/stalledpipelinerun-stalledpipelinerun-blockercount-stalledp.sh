#!/bin/bash
# Invariant: stalledPipelineRun.blockerCount === stalledPipelineRun.blockers.length
# Entity: StalledPipelineRun
# Description: blockerCount must equal the actual blockers array length to prevent phantom clearance claims
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: stalledPipelineRun.blockerCount === stalledPipelineRun.blockers.length
exit 0
