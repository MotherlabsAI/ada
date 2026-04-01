#!/bin/bash
# Invariant: draftIntentGraph.rawIntent !== null && draftIntentGraph.rawIntent.length > 0
# Entity: DraftIntentGraph
# Description: rawIntent must be non-empty — it is the user text being structured
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: draftIntentGraph.rawIntent !== null && draftIntentGraph.rawIntent.length > 0
exit 0
