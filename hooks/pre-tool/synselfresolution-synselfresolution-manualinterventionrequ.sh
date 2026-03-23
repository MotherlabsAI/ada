#!/bin/bash
# Invariant: synSelfResolution.manualInterventionRequired === !synSelfResolution.achieved
# Entity: SYNSelfResolution
# Description: manual intervention is required if and only if self-resolution is not achieved
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: synSelfResolution.manualInterventionRequired === !synSelfResolution.achieved
exit 0
