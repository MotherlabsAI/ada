#!/bin/bash
# Invariant: skillCandidate.id !== null && skillCandidate.id.length > 0
# Entity: SkillCandidate
# Description: candidates must be uniquely identifiable for review queue management
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: skillCandidate.id !== null && skillCandidate.id.length > 0
exit 0
