#!/bin/bash
# Invariant: entBlocker.severity !== null
# Entity: ENTBlocker
# Description: severity must be a typed ENTBlockerSeverity; null severity means the impact on the pipeline cannot be assessed for G10
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: entBlocker.severity !== null
exit 0
