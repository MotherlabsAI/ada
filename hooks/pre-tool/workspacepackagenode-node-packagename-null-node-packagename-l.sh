#!/bin/bash
# Invariant: node.packageName !== null && node.packageName.length > 0
# Entity: WorkspacePackageNode
# Description: a package node without a name cannot be referenced by assignments or validated as a real monorepo package
# Context guard: only enforce during an active Ada pipeline run
# Drains stdin first to avoid broken pipe, then exits cleanly if not in Ada context
INPUT=$(cat)
[ -z "$ADA_PIPELINE_RUN_ID" ] && exit 0
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: node.packageName !== null && node.packageName.length > 0
exit 0
