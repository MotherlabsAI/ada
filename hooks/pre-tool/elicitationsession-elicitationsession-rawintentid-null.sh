#!/bin/bash
# Invariant: elicitationSession.rawIntentId !== null
# Entity: ElicitationSession
# Description: Session must always be anchored to a RawIntent — without this, the IntentGraph produced has no traceable origin
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: elicitationSession.rawIntentId !== null
exit 0
