#!/bin/bash
# Invariant: semanticDrift.location !== null && semanticDrift.location.trim().length > 0
# Entity: SemanticDrift
# Description: drift must identify the file or artifact location where divergence was detected
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: semanticDrift.location !== null && semanticDrift.location.trim().length > 0
exit 0
