#!/bin/bash
# Invariant: mapping.isTotal === true
# Entity: ComponentPackageMapping
# Description: the mapping must be total — every component must have a resolved assignment — or the ENT gate cannot pass
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: mapping.isTotal === true
exit 0
