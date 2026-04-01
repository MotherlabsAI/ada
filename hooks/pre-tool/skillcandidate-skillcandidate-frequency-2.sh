#!/bin/bash
# Invariant: skillCandidate.frequency >= 2
# Entity: SkillCandidate
# Description: frequency must be at least 2 — a pattern observed once is not a candidate for extraction
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: skillCandidate.frequency >= 2
exit 0
