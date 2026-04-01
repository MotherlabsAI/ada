#!/bin/bash
# Invariant: stateFact.source === 'tool_output' ? stateFact.confidence >= 0.8 : stateFact.confidence < 0.8
# Entity: StateFact
# Description: the source/confidence pairing is invariant — tool-output facts get ≥0.8, inferred facts get <0.8
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: stateFact.source === 'tool_output' ? stateFact.confidence >= 0.8 : stateFact.confidence < 0.8
exit 0
