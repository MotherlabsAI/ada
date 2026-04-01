#!/bin/bash
# Invariant: skill.id !== null && skill.id.length > 0
# Entity: Skill
# Description: every skill must be uniquely identifiable — anonymous skills cannot be reviewed or written to .claude/skills/
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: skill.id !== null && skill.id.length > 0
exit 0
