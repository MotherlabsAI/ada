#!/bin/bash
# Invariant: domainContext.domain !== null && domainContext.domain.trim().length > 0
# Entity: DomainContext
# Description: domain must be named — unnamed domains cannot produce valid ubiquitous language
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: domainContext.domain !== null && domainContext.domain.trim().length > 0
exit 0
