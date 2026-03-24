#!/bin/bash
# Invariant: draftIntentGraph.revisionCount >= 0
# Entity: DraftIntentGraph
# Description: Revision count must be non-negative — without this, the dialogue progression cannot be tracked structurally
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: draftIntentGraph.revisionCount >= 0
exit 0
