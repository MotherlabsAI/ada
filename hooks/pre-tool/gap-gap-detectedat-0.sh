#!/bin/bash
# Invariant: gap.detectedAt > 0
# Entity: Gap
# Description: gaps must record detection time — undated gaps cannot be ordered relative to session turns
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: gap.detectedAt > 0
exit 0
