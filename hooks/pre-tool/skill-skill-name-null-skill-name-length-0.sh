#!/bin/bash
# Invariant: skill.name !== null && skill.name.length > 0
# Entity: Skill
# Description: skill name must be non-empty to be recognizable in agent files
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: skill.name !== null && skill.name.length > 0
exit 0
