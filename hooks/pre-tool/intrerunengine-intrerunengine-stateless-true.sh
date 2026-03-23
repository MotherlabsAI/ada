#!/bin/bash
# Invariant: intRerunEngine.stateless === true
# Entity: IntRerunEngine
# Description: engine must carry no module-level mutable state; every execution is a pure function over its inputs
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: intRerunEngine.stateless === true
exit 0
