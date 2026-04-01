#!/bin/bash
# Invariant: /* governance core is not a valid extraction target — skills may only come from workflows and session logs */true
# Entity: Skill
# Description: skills extracted from invariants, contracts, or pipeline stage logic violate the immutability of the governance core
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: /* governance core is not a valid extraction target — skills may only come from workflows and session logs */true
exit 0
