#!/bin/bash
# Invariant: draftIntentGraph.goals !== null
# Entity: DraftIntentGraph
# Description: Goals array must always exist (may be empty) — without this, schema conformance checks cannot run
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: draftIntentGraph.goals !== null
exit 0
