#!/bin/bash
# Invariant: draftIntentGraph.draftId !== null && draftIntentGraph.draftId.length > 0
# Entity: DraftIntentGraph
# Description: Draft must have identity — anonymous drafts cannot be referenced by gap or assessment records
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: draftIntentGraph.draftId !== null && draftIntentGraph.draftId.length > 0
exit 0
