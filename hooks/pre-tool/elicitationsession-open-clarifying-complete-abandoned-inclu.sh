#!/bin/bash
# Invariant: ['open','clarifying','complete','abandoned'].includes(elicitationSession.status)
# Entity: ElicitationSession
# Description: session status must be one of four canonical values
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: ['open','clarifying','complete','abandoned'].includes(elicitationSession.status)
exit 0
