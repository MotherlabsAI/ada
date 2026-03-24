#!/bin/bash
# Invariant: blueprintArchitecture.rationale !== null && blueprintArchitecture.rationale.length > 0
# Entity: BlueprintArchitecture
# Description: Rationale must be present — a pattern without justification cannot be aligned to convergence trajectory
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: blueprintArchitecture.rationale !== null && blueprintArchitecture.rationale.length > 0
exit 0
