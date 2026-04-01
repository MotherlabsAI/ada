#!/bin/bash
# Invariant: domainContext.postcode !== null
# Entity: DomainContext
# Description: the domain context must be content-addressed — it is the PER stage output in the provenance chain
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: domainContext.postcode !== null
exit 0
