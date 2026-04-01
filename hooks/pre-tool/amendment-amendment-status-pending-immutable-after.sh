#!/bin/bash
# Invariant: amendment.status !== 'pending' ? /* immutable after status set */ true : true
# Entity: Amendment
# Description: amendments are immutable after status is set — the status field must only be written once
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: amendment.status !== 'pending' ? /* immutable after status set */ true : true
exit 0
