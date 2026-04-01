#!/bin/bash
# Invariant: skillCandidate.sessionIds.every((id, i, arr) => arr.indexOf(id) === i)
# Entity: SkillCandidate
# Description: sessionIds must be distinct; duplicates fabricate evidence of reuse
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: skillCandidate.sessionIds.every((id, i, arr) => arr.indexOf(id) === i)
exit 0
