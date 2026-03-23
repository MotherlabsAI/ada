#!/bin/bash
# Invariant: governanceStatus.statusId !== null
# Entity: GovernanceStatus
# Description: status must be identified
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: governanceStatus.statusId !== null
exit 0
