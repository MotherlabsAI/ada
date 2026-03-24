#!/bin/bash
# Invariant: Object.keys(stakeholder.vocabulary).length >= 0
# Entity: Stakeholder
# Description: Vocabulary map must be initialized — null vocabulary prevents ubiquitous language synthesis
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: Object.keys(stakeholder.vocabulary).length >= 0
exit 0
