#!/bin/bash
# Invariant: stalledPipelineRun.runId === 'ML.ENT.e80e3c97/v1'
# Entity: StalledPipelineRun
# Description: this entity models the specific stalled run identified in G4; its runId is a known constant
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: stalledPipelineRun.runId === 'ML.ENT.e80e3c97/v1'
exit 0
