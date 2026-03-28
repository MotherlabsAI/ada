#!/bin/bash
# Invariant: gap.candidatePackages.length >= 1
# Entity: C3AssignmentGap
# Description: a gap with no candidate packages has no resolution path and is permanently blocking
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: gap.candidatePackages.length >= 1
exit 0
