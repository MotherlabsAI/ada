#!/bin/bash
# Invariant: blocker.severity !== null && blocker.severity.length > 0
# Entity: ENTBlocker
# Description: severity must be present — severity-less blockers cannot be prioritized or triaged
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: blocker.severity !== null && blocker.severity.length > 0
exit 0
