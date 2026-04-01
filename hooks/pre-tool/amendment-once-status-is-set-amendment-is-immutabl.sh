#!/bin/bash
# Invariant: /* once status is set, amendment is immutable */ amendment.status === 'pending' || Object.isFrozen(amendment)
# Entity: Amendment
# Description: amendments are immutable after status is set — post-decision mutation would undermine governance
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: /* once status is set, amendment is immutable */ amendment.status === 'pending' || Object.isFrozen(amendment)
exit 0
