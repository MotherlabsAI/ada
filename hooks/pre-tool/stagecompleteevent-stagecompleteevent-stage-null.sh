#!/bin/bash
# Invariant: stageCompleteEvent.stage !== null
# Entity: StageCompleteEvent
# Description: Stage code must be present — the event must identify which stage completed
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: stageCompleteEvent.stage !== null
exit 0
