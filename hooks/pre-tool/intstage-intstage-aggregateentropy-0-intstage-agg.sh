#!/bin/bash
# Invariant: intStage.aggregateEntropy >= 0 && intStage.aggregateEntropy <= 1
# Entity: INTStage
# Description: aggregate entropy is a unit-interval scalar
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: intStage.aggregateEntropy >= 0 && intStage.aggregateEntropy <= 1
exit 0
