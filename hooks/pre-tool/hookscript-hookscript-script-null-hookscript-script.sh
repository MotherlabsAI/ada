#!/bin/bash
# Invariant: hookScript.script !== null && hookScript.script.length > 0
# Entity: HookScript
# Description: a hook with empty script content enforces nothing — it is a no-op that falsely appears to be enforcing invariants
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: hookScript.script !== null && hookScript.script.length > 0
exit 0
