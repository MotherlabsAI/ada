#!/bin/bash
# Invariant: buildScript.command !== null && buildScript.command.length > 0
# Entity: BuildScript
# Description: build script must specify a non-empty command
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: buildScript.command !== null && buildScript.command.length > 0
exit 0
