#!/bin/bash
# Invariant: governanceStatus.verdict !== null
# Entity: GovernanceStatus
# Description: verdict must be assigned
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: governanceStatus.verdict !== null
exit 0
