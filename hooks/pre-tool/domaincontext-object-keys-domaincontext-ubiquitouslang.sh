#!/bin/bash
# Invariant: Object.keys(domainContext.ubiquitousLanguage).length >= 1
# Entity: DomainContext
# Description: ubiquitous language map must have at least one entry to ground INT stage vocabulary
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: Object.keys(domainContext.ubiquitousLanguage).length >= 1
exit 0
