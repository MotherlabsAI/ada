#!/bin/bash
# Invariant: result.entityMapId !== null && result.entityMapId.length > 0
# Entity: ENTStageResult
# Description: the result must reference the EntityMap it produced — without this the downstream SYN stage has no entity input
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: result.entityMapId !== null && result.entityMapId.length > 0
exit 0
