#!/bin/bash
# Invariant: pipelineRun.passOrdinal >= 0
# Entity: PipelineRun
# Description: Pass ordinal must be non-negative — negative ordinals corrupt run sequencing
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: pipelineRun.passOrdinal >= 0
exit 0
