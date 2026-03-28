#!/bin/bash
# Invariant: workspacePackageNode.pipelineStage !== null && workspacePackageNode.pipelineStage.length > 0
# Entity: WorkspacePackageNode
# Description: each package must declare the pipeline stage it serves; G9 asks which package owns ENT integration and this field answers that question
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: workspacePackageNode.pipelineStage !== null && workspacePackageNode.pipelineStage.length > 0
exit 0
