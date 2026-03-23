#!/bin/bash
# Invariant: disambiguationPass.outputBindings.every(b => b.entropy.value < 0.30)
# Entity: DisambiguationPass
# Description: output bindings are pre-filtered to entropy < 0.30 before leaving the pass
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: disambiguationPass.outputBindings.every(b => b.entropy.value < 0.30)
exit 0
