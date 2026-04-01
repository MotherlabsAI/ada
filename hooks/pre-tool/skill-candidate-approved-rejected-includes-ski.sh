#!/bin/bash
# Invariant: ['candidate','approved','rejected'].includes(skill.status)
# Entity: Skill
# Description: skill status must be one of three canonical values
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: ['candidate','approved','rejected'].includes(skill.status)
exit 0
