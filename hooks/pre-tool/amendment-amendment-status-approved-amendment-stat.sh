#!/bin/bash
# Invariant: amendment.status === 'approved' || amendment.status === 'rejected' || amendment.status === 'pending'
# Entity: Amendment
# Description: status must be one of the three valid values — no other status transitions exist in the governance model
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: amendment.status === 'approved' || amendment.status === 'rejected' || amendment.status === 'pending'
exit 0
