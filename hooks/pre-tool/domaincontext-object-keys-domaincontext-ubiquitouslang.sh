#!/bin/bash
# Invariant: Object.keys(domainContext.ubiquitousLanguage).length > 0
# Entity: DomainContext
# Description: domain context must define at least one ubiquitous language term
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: Object.keys(domainContext.ubiquitousLanguage).length > 0
exit 0
