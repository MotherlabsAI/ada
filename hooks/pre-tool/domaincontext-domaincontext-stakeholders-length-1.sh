#!/bin/bash
# Invariant: domainContext.stakeholders.length >= 1
# Entity: DomainContext
# Description: at least one stakeholder must be defined — a domain with no stakeholders has no audience for its ubiquitous language
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: domainContext.stakeholders.length >= 1
exit 0
