#!/bin/bash
# Invariant: ['compiler','config-writer','elicitation','governor','int-rerun','mcp-server','orchestrator','provenance'].includes(pkg.packageName)
# Entity: WorkspacePackageNode
# Description: packageName must be one of the 8 canonical workspace packages — an unrecognized name is not a valid codomain element for the mapping function
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: ['compiler','config-writer','elicitation','governor','int-rerun','mcp-server','orchestrator','provenance'].includes(pkg.packageName)
exit 0
