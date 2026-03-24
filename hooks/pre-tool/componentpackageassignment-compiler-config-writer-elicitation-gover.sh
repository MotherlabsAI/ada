#!/bin/bash
# Invariant: ['compiler','config-writer','elicitation','governor','int-rerun','mcp-server','orchestrator','provenance'].includes(assignment.targetPackage)
# Entity: ComponentPackageAssignment
# Description: targetPackage must be one of the 8 canonical workspace packages — any other value is an invalid codomain element breaking the mapping function
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: ['compiler','config-writer','elicitation','governor','int-rerun','mcp-server','orchestrator','provenance'].includes(assignment.targetPackage)
exit 0
