#!/bin/bash
# Invariant: invocation.arguments.length === 0
# Entity: Invocation
# Description: hello-world program accepts no arguments
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: invocation.arguments.length === 0
exit 0
