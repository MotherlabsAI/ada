#!/bin/bash
# Invariant: stakeholder.vocabulary !== null
# Entity: Stakeholder
# Description: Vocabulary must exist — even empty, it is required for ubiquitous language reconciliation in DomainContext
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: stakeholder.vocabulary !== null
exit 0
