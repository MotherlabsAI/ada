#!/bin/bash
# Invariant: provenanceChain.timestamp > 0
# Entity: ProvenanceChain
# Description: timestamp must be a positive epoch value — zero or negative indicates an unrecorded or corrupted chain link
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: provenanceChain.timestamp > 0
exit 0
