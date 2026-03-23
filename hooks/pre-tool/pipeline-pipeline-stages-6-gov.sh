#!/bin/bash
# Invariant: pipeline.stages[6] === 'GOV'
# Entity: Pipeline
# Description: final stage must always be the Governor
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: pipeline.stages[6] === 'GOV'
exit 0
