#!/bin/bash
# Invariant: codebaseContext.packageBoundaries.every(pb => pb.name !== null && pb.name.length > 0)
# Entity: CodebaseContext
# Description: every package boundary must have a name — unnamed boundaries cannot be referenced by SYN stage
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: codebaseContext.packageBoundaries.every(pb => pb.name !== null && pb.name.length > 0)
exit 0
