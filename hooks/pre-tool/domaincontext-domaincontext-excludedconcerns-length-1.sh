#!/bin/bash
# Invariant: domainContext.excludedConcerns.length >= 1
# Entity: DomainContext
# Description: the exclusion list must be populated — without explicit exclusions the domain boundary is undefined
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: domainContext.excludedConcerns.length >= 1
exit 0
