#!/bin/bash
# Invariant: session.sessionId !== null && session.sessionId.length > 0
# Entity: Session
# Description: session identity must be non-empty to enable correlation with tool call logs and drift records
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: session.sessionId !== null && session.sessionId.length > 0
exit 0
