#!/bin/bash
# Invariant: skillCandidate.sessionIds.length >= 2
# Entity: SkillCandidate
# Description: a candidate must be observed in at least 2 distinct sessions — single-session patterns do not qualify as reusable skills
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: skillCandidate.sessionIds.length >= 2
exit 0
