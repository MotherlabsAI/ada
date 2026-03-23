#!/bin/bash
# Invariant: buildStep.command !== null && buildStep.command.length > 0
# Entity: BuildStep
# Description: build step must have a non-empty compiler/tool command
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: buildStep.command !== null && buildStep.command.length > 0
exit 0
