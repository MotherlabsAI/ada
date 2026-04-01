#!/bin/bash
# Invariant: stalledPipelineRun.blockers.length === stalledPipelineRun.blockerCount
# Entity: StalledPipelineRun
# Description: declared blocker count must match actual blockers; a mismatch means the run's impediment state cannot be accurately assessed for G10
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: stalledPipelineRun.blockers.length === stalledPipelineRun.blockerCount
exit 0
