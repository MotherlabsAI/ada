#!/bin/bash
# Invariant: gate.passed === (gate.entityCount > 0 && gate.provenanceIntact === true && gate.allBlockersCleared === true)
# Entity: ENTGateRecord
# Description: ENT gate is conjunctive — passed must be the logical AND of all three conditions; any deviation creates a false gate pass or unnecessary block
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: gate.passed === (gate.entityCount > 0 && gate.provenanceIntact === true && gate.allBlockersCleared === true)
exit 0
