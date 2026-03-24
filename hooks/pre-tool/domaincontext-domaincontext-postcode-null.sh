#!/bin/bash
# Invariant: domainContext.postcode !== null
# Entity: DomainContext
# Description: DomainContext must carry a postcode — it is a first-class typed pipeline artifact
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: domainContext.postcode !== null
exit 0
