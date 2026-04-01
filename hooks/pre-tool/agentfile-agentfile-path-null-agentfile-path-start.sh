#!/bin/bash
# Invariant: agentFile.path !== null && agentFile.path.startsWith('.claude/agents/')
# Entity: AgentFile
# Description: agent files must reside in .claude/agents/ — files outside this path are not recognized by Claude Code's subagent protocol
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: agentFile.path !== null && agentFile.path.startsWith('.claude/agents/')
exit 0
