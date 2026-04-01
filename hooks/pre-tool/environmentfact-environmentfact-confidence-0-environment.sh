#!/bin/bash
# Invariant: environmentFact.confidence >= 0 && environmentFact.confidence <= 1
# Entity: EnvironmentFact
# Description: confidence must be normalized — values outside [0,1] are semantically undefined in the world-state model
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: environmentFact.confidence >= 0 && environmentFact.confidence <= 1
exit 0
