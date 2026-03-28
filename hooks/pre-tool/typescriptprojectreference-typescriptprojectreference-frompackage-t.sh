#!/bin/bash
# Invariant: typeScriptProjectReference.fromPackage !== typeScriptProjectReference.toPackage
# Entity: TypeScriptProjectReference
# Description: a package cannot reference itself; self-references create circular dependency cycles in the TypeScript build graph
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: typeScriptProjectReference.fromPackage !== typeScriptProjectReference.toPackage
exit 0
