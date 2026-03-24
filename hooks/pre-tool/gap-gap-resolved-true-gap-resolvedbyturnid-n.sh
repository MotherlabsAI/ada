#!/bin/bash
# Invariant: !(gap.resolved === true) || gap.resolvedByTurnId !== null
# Entity: Gap
# Description: A resolved gap must reference the turn that resolved it — without this, dialogue history cannot be audited
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: !(gap.resolved === true) || gap.resolvedByTurnId !== null
exit 0
