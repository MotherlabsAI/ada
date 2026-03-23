#!/bin/bash
# Invariant: workspaceProtocolDependency.consumerPackage !== workspaceProtocolDependency.providerPackage
# Entity: WorkspaceProtocolDependency
# Description: a package cannot declare itself as a workspace dependency
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: workspaceProtocolDependency.consumerPackage !== workspaceProtocolDependency.providerPackage
exit 0
