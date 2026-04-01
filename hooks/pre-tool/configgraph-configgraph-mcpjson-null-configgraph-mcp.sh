#!/bin/bash
# Invariant: configGraph.mcpJson !== null && configGraph.mcpJson.length > 0
# Entity: ConfigGraph
# Description: the MCP server registration must be present — without it Claude Code sessions cannot access Ada's spec authority
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: configGraph.mcpJson !== null && configGraph.mcpJson.length > 0
exit 0
