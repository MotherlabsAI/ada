#!/bin/bash
# Invariant: inTStage.entityCount === 26
# Entity: INTStage
# Description: the INT stage is fixed at 26 entities per the registry definition; any other count signals a different stage configuration that does not match the integration architecture
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: inTStage.entityCount === 26
exit 0
