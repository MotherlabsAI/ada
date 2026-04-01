#!/bin/bash
# Invariant: environmentFact.source === 'tool_output' ? environmentFact.confidence >= 0.8 : environmentFact.confidence < 0.8
# Entity: EnvironmentFact
# Description: tool_output facts must have confidence >= 0.8; inferred facts must have confidence < 0.8 per governance invariant
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: environmentFact.source === 'tool_output' ? environmentFact.confidence >= 0.8 : environmentFact.confidence < 0.8
exit 0
