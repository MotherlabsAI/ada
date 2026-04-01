#!/bin/bash
# Invariant: /* hash is content-derived */ postcodeAddress.hash === deriveHashFromContent(artifact)
# Entity: PostcodeAddress
# Description: hash must be derived from content, not randomly assigned — immutability depends on this
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: /* hash is content-derived */ postcodeAddress.hash === deriveHashFromContent(artifact)
exit 0
