#!/bin/bash
# Invariant: stalledPipelineRun.stage === 'ENT'
# Entity: StalledPipelineRun
# Description: the stall occurred at ENT stage; any other stage value misidentifies the blocker
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: stalledPipelineRun.stage === 'ENT'
exit 0
