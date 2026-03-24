#!/bin/bash
# Invariant: adaSystem.activePackages.length > 0
# Entity: AdaSystem
# Description: Ada must reference at least one active package — a system with no packages has no structural identity
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: adaSystem.activePackages.length > 0
exit 0
