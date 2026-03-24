#!/bin/bash
# Invariant: pkg.pipelineStage !== null && pkg.pipelineStage.length > 0
# Entity: WorkspacePackageNode
# Description: each package must map to a pipeline stage — null stage breaks the package→stage hop of the three-hop provenance chain (G5)
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: pkg.pipelineStage !== null && pkg.pipelineStage.length > 0
exit 0
