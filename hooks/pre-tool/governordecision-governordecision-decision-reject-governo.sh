#!/bin/bash
# Invariant: governorDecision.decision === 'REJECT' ? governorDecision.rejectionReasons.length >= 1 : true
# Entity: GovernorDecision
# Description: a REJECT decision must carry at least one rejection reason — unreasoned rejection cannot guide the ITERATE loop
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: governorDecision.decision === 'REJECT' ? governorDecision.rejectionReasons.length >= 1 : true
exit 0
