#!/bin/bash
# Invariant: gap.gapId !== null && gap.gapId.length > 0
# Entity: Gap
# Description: Gap must have identity — anonymous gaps cannot be addressed by elicitation turns
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: gap.gapId !== null && gap.gapId.length > 0
exit 0
