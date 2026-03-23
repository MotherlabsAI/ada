#!/bin/bash
# Invariant: binEntry.ownerPackage !== null
# Entity: BinEntry
# Description: bin entry must be owned by a package
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: binEntry.ownerPackage !== null
exit 0
