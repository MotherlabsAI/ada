#!/bin/bash
# Invariant: domainContext.stakeholders.length > 0
# Entity: DomainContext
# Description: at least one stakeholder must be identified in the domain context
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: domainContext.stakeholders.length > 0
exit 0
