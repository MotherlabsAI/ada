#!/bin/bash
# Invariant: domainContext.ubiquitousLanguage !== null
# Entity: DomainContext
# Description: Ubiquitous language map must exist — without it, entity naming coherence cannot be enforced
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: domainContext.ubiquitousLanguage !== null
exit 0
