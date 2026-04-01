#!/bin/bash
# Invariant: skill.status !== null
# Entity: Skill
# Description: status must always be set for queue management in ada review-skills
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: skill.status !== null
exit 0
