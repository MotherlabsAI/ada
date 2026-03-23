#!/bin/bash
# Invariant: binEntry.commandName !== null && binEntry.commandName.length > 0
# Entity: BinEntry
# Description: bin entry must declare a non-empty command name
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: binEntry.commandName !== null && binEntry.commandName.length > 0
exit 0
