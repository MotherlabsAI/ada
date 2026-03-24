#!/bin/bash
# Invariant: stakeholder.role !== null && stakeholder.role.length > 0
# Entity: Stakeholder
# Description: Stakeholder must have a named role — anonymous stakeholders cannot be differentiated in domain modeling
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: stakeholder.role !== null && stakeholder.role.length > 0
exit 0
