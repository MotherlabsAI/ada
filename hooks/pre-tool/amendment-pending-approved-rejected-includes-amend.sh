#!/bin/bash
# Invariant: ['pending','approved','rejected'].includes(amendment.status)
# Entity: Amendment
# Description: amendment status must be one of three canonical values — other states are not governed
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: ['pending','approved','rejected'].includes(amendment.status)
exit 0
