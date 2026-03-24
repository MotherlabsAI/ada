#!/bin/bash
# Invariant: governorDecision.rejectionReasons.length > 0 || governorDecision.decision !== "reject"
# Entity: GovernorDecision
# Description: A rejection must carry at least one reason — a reasonless rejection is untraceable and violates audit requirements
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: governorDecision.rejectionReasons.length > 0 || governorDecision.decision !== "reject"
exit 0
