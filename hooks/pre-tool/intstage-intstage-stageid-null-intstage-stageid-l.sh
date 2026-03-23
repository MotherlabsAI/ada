#!/bin/bash
# Invariant: intStage.stageId !== null && intStage.stageId.length > 0
# Entity: INTStage
# Description: stage must have a non-empty identifier
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: intStage.stageId !== null && intStage.stageId.length > 0
exit 0
