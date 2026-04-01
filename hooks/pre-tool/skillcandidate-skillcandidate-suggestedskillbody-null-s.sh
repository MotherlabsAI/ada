#!/bin/bash
# Invariant: skillCandidate.suggestedSkillBody !== null && skillCandidate.suggestedSkillBody.length > 0
# Entity: SkillCandidate
# Description: a candidate without a suggested body has no content to review — it cannot be approved into a skill file
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: skillCandidate.suggestedSkillBody !== null && skillCandidate.suggestedSkillBody.length > 0
exit 0
