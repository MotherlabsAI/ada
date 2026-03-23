#!/bin/bash
# Invariant: domainContext.postcode.stage === 'PER'
# Entity: DomainContext
# Description: domain context postcode must carry the PER stage tag
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: domainContext.postcode.stage === 'PER'
exit 0
