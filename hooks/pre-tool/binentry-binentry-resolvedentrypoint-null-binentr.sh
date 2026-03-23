#!/bin/bash
# Invariant: binEntry.resolvedEntryPoint !== null && binEntry.resolvedEntryPoint.length > 0
# Entity: BinEntry
# Description: bin entry must point to a compiled entrypoint
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: binEntry.resolvedEntryPoint !== null && binEntry.resolvedEntryPoint.length > 0
exit 0
