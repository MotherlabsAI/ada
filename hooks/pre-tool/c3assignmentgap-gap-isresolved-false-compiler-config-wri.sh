#!/bin/bash
# Invariant: gap.isResolved === false || ['compiler','config-writer','elicitation','governor','int-rerun','mcp-server','orchestrator','provenance'].includes(gap.resolvedPackage)
# Entity: C3AssignmentGap
# Description: when resolved, the resolvedPackage must be one of the 8 canonical packages — resolution to an unknown package re-introduces the gap
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: gap.isResolved === false || ['compiler','config-writer','elicitation','governor','int-rerun','mcp-server','orchestrator','provenance'].includes(gap.resolvedPackage)
exit 0
