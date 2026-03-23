#!/bin/bash
# Invariant: entityBinding.perBindingEntropy >= 0 && entityBinding.perBindingEntropy <= 1
# Entity: EntityBinding
# Description: per-binding entropy is a bounded real in [0,1]
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: entityBinding.perBindingEntropy >= 0 && entityBinding.perBindingEntropy <= 1
exit 0
