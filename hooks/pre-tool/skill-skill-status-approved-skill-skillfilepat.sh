#!/bin/bash
# Invariant: skill.status === 'approved' ? skill.skillFilePath !== null : true
# Entity: Skill
# Description: an approved skill must have a file path — an approved skill without a path has not been written and is in an illegal state
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: skill.status === 'approved' ? skill.skillFilePath !== null : true
exit 0
