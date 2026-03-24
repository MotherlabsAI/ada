#!/bin/bash
# Invariant: boundedContextResult.contextName !== null && boundedContextResult.contextName.length > 0
# Entity: BoundedContextResult
# Description: Context result must name its context — anonymous results cannot be attributed in the verification report
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: boundedContextResult.contextName !== null && boundedContextResult.contextName.length > 0
exit 0
