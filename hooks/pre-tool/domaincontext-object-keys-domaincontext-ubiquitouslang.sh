#!/bin/bash
# Invariant: Object.keys(domainContext.ubiquitousLanguage).length > 0 || domainContext.stakeholders.length > 0
# Entity: DomainContext
# Description: Domain context must have either vocabulary or stakeholders — an empty context cannot scaffold compilation
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: Object.keys(domainContext.ubiquitousLanguage).length > 0 || domainContext.stakeholders.length > 0
exit 0
