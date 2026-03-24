#!/bin/bash
# Invariant: gap.detectedAt > 0
# Entity: Gap
# Description: Gap detection must be timestamped — unordered gaps cannot be prioritized in elicitation sequencing
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: gap.detectedAt > 0
exit 0
