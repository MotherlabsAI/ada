#!/bin/bash
# Invariant: inTStage.aggregateEntropyHardCap === 0.3
# Entity: INTStage
# Description: the hard cap is fixed at 0.3 per the registry; a different cap means a different stage contract and the ENT integration would consume wrong output
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: inTStage.aggregateEntropyHardCap === 0.3
exit 0
