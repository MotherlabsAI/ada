#!/bin/bash
# Invariant: run.stage === 'ENT'
# Entity: StalledPipelineRun
# Description: the stall is at the ENT stage — a different stage value misidentifies where the block occurred
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: run.stage === 'ENT'
exit 0
