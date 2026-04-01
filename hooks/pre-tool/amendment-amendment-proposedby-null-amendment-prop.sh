#!/bin/bash
# Invariant: amendment.proposedBy !== null && amendment.proposedBy.length > 0
# Entity: Amendment
# Description: every amendment must record which agent proposed it — unattributed amendments cannot be audited
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: amendment.proposedBy !== null && amendment.proposedBy.length > 0
exit 0
