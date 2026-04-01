#!/bin/bash
# Invariant: /* status is immutable after set to approved or rejected */amendment.status === 'pending' || /* no further transitions */true
# Entity: Amendment
# Description: once an amendment is approved or rejected it is immutable — only the human may approve or reject
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: /* status is immutable after set to approved or rejected */amendment.status === 'pending' || /* no further transitions */true
exit 0
