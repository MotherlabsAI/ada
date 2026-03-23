#!/bin/bash
# Invariant: pipeline.stageCount === 7
# Entity: Pipeline
# Description: pipeline must contain exactly 7 stages — no more, no fewer
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: pipeline.stageCount === 7
exit 0
