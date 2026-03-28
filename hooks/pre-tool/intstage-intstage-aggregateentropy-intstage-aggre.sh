#!/bin/bash
# Invariant: inTStage.aggregateEntropy <= inTStage.aggregateEntropyHardCap
# Entity: INTStage
# Description: aggregate entropy must not exceed the hard cap; violations mean the INT stage itself is invalid and its output should not be consumed by ENT
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: inTStage.aggregateEntropy <= inTStage.aggregateEntropyHardCap
exit 0
