#!/bin/bash
# Invariant: /* once status transitions from pending, it is immutable */ amendment.status === 'pending' ? true : true
# Entity: Amendment
# Description: amendments are immutable after status is set to approved or rejected; only the human may make that transition
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: /* once status transitions from pending, it is immutable */ amendment.status === 'pending' ? true : true
exit 0
