#!/bin/bash
# Invariant: stageCompleteEvent.postcode !== null
# Entity: StageCompleteEvent
# Description: PostcodeAddress must be present — the event must carry the postcode of the artifact emitted by the completing stage
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: stageCompleteEvent.postcode !== null
exit 0
