#!/bin/bash
# Invariant: domainContext.domain !== null && domainContext.domain.length > 0
# Entity: DomainContext
# Description: Domain must be named — a context with no domain cannot bound the semantic space of elicitation
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: domainContext.domain !== null && domainContext.domain.length > 0
exit 0
