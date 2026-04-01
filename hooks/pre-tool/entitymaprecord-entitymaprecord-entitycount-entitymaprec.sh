#!/bin/bash
# Invariant: entityMapRecord.entityCount === entityMapRecord.entities.length
# Entity: EntityMapRecord
# Description: entityCount must match the length of the entities array — inconsistency indicates corruption
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: entityMapRecord.entityCount === entityMapRecord.entities.length
exit 0
