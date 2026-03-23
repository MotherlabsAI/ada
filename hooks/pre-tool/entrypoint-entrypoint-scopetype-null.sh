#!/bin/bash
# Invariant: entryPoint.scopeType !== null
# Entity: EntryPoint
# Description: entry point must declare its scope type
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: entryPoint.scopeType !== null
exit 0
