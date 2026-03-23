#!/bin/bash
# Invariant: pipeline.stages.length === 7
# Entity: Pipeline
# Description: stages array must have exactly 7 elements
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: pipeline.stages.length === 7
exit 0
