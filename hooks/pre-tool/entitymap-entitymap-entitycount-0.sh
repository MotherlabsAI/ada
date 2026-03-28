#!/bin/bash
# Invariant: entityMap.entityCount > 0
# Entity: EntityMap
# Description: an empty EntityMap means extraction failed; the ENT gate cannot produce a passing ENTStageResult against zero entities
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: entityMap.entityCount > 0
exit 0
