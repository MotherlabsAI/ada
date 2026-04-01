#!/bin/bash
# Invariant: amendment.status === 'pending' || amendment.status === 'approved' || amendment.status === 'rejected'
# Entity: Amendment
# Description: status must be one of the three valid states; any other value indicates corruption
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: amendment.status === 'pending' || amendment.status === 'approved' || amendment.status === 'rejected'
exit 0
