#!/bin/bash
# Invariant: c3AssignmentGap.candidatePackages.length >= 1
# Entity: C3AssignmentGap
# Description: the gap must have at least one candidate package for the collapse strategy to have a valid target; zero candidates means the gap is irresolvable
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: c3AssignmentGap.candidatePackages.length >= 1
exit 0
