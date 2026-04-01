#!/bin/bash
# Invariant: /* hash is derived from content, not random */postcodeAddress.hash === contentHash(postcodeAddress.raw).slice(0,8)
# Entity: PostcodeAddress
# Description: the hash must be deterministically derived from the artifact content — random hashes break content-addressability
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: /* hash is derived from content, not random */postcodeAddress.hash === contentHash(postcodeAddress.raw).slice(0,8)
exit 0
