#!/bin/bash
# Invariant: semanticDrift.severity !== null
# Entity: SemanticDrift
# Description: Severity must be classified — ungated drift of unknown severity undermines formal correctness guarantees
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: semanticDrift.severity !== null
exit 0
