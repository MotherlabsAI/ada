#!/bin/bash
# Invariant: intent.submittedAt !== null
# Entity: Intent
# Description: submission timestamp must be recorded
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: intent.submittedAt !== null
exit 0
