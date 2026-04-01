#!/bin/bash
# Invariant: runtimeCheckpoint.worldStateVersion >= 0
# Entity: RuntimeCheckpoint
# Description: worldStateVersion must reference a valid non-negative world state version — negative versions indicate corruption
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: runtimeCheckpoint.worldStateVersion >= 0
exit 0
