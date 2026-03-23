#!/bin/bash
# Invariant: entityMention.id !== null && entityMention.id.length > 0
# Entity: EntityMention
# Description: every mention must have a unique identifier
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: entityMention.id !== null && entityMention.id.length > 0
exit 0
