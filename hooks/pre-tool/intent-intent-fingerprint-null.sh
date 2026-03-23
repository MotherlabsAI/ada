#!/bin/bash
# Invariant: intent.fingerprint !== null
# Entity: Intent
# Description: every intent must have a stable identity fingerprint
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: intent.fingerprint !== null
exit 0
