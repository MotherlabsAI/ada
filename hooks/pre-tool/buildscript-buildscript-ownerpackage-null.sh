#!/bin/bash
# Invariant: buildScript.ownerPackage !== null
# Entity: BuildScript
# Description: build script must belong to a named package
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: buildScript.ownerPackage !== null
exit 0
