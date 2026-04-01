#!/bin/bash
# Invariant: domainContext.domain !== null && domainContext.domain.length > 0
# Entity: DomainContext
# Description: the domain must be named — an unnamed domain context cannot establish stakeholder vocabulary or excluded concerns
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: domainContext.domain !== null && domainContext.domain.length > 0
exit 0
