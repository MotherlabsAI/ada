#!/bin/bash
# Invariant: entityMapRecord.entityCount >= 1
# Entity: EntityMapRecord
# Description: EntityMap must contain at least 1 entity — the ENT gate evaluates entity coverage and an empty map fails
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: entityMapRecord.entityCount >= 1
exit 0
