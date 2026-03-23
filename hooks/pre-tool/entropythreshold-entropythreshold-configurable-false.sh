#!/bin/bash
# Invariant: entropyThreshold.configurable === false
# Entity: EntropyThreshold
# Description: entropy threshold is never runtime-configurable
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: entropyThreshold.configurable === false
exit 0
