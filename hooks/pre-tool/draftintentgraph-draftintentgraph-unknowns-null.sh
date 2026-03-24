#!/bin/bash
# Invariant: draftIntentGraph.unknowns !== null
# Entity: DraftIntentGraph
# Description: Unknowns array must always exist (may be empty) — without this, Gap detection has no field to inspect
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: draftIntentGraph.unknowns !== null
exit 0
