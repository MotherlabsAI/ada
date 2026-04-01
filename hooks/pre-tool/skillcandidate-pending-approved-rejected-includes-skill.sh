#!/bin/bash
# Invariant: ['pending','approved','rejected'].includes(skillCandidate.status)
# Entity: SkillCandidate
# Description: status must be one of three canonical values
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: ['pending','approved','rejected'].includes(skillCandidate.status)
exit 0
