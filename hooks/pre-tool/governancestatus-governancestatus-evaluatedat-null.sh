#!/bin/bash
# Invariant: governanceStatus.evaluatedAt !== null
# Entity: GovernanceStatus
# Description: evaluation timestamp must be recorded
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: governanceStatus.evaluatedAt !== null
exit 0
