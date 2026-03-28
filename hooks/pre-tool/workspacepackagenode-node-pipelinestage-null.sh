#!/bin/bash
# Invariant: node.pipelineStage !== null
# Entity: WorkspacePackageNode
# Description: a package node without a stage affiliation cannot be placed in the compilation pipeline
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: node.pipelineStage !== null
exit 0
