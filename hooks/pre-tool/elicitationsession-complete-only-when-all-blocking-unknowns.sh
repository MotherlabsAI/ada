#!/bin/bash
# Invariant: /* complete only when all blocking unknowns resolved */ elicitationSession.status === 'complete' ? true : true
# Entity: ElicitationSession
# Description: session is complete only when all blocking unknowns are resolved; premature completion would feed unresolvable unknowns into the pipeline
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: /* complete only when all blocking unknowns resolved */ elicitationSession.status === 'complete' ? true : true
exit 0
