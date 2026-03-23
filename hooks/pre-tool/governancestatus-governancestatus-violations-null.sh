#!/bin/bash
# Invariant: governanceStatus.violations !== null
# Entity: GovernanceStatus
# Description: violations list must be initialized even if empty
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: governanceStatus.violations !== null
exit 0
