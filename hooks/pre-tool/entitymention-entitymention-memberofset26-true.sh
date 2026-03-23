#!/bin/bash
# Invariant: entityMention.memberOfSet26 === true
# Entity: EntityMention
# Description: only members of the 26-entity set are in scope for this INT stage
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: entityMention.memberOfSet26 === true
exit 0
