#!/bin/bash
# Invariant: amendment.status !== null
# Entity: Amendment
# Description: status must always be set — a statusless amendment cannot be processed
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: amendment.status !== null
exit 0
