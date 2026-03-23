#!/bin/bash
# Block Bash commands that call non-Anthropic AI APIs or local models
INPUT=$(cat)
COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command // ""')
if echo "$COMMAND" | grep -qE "ollama|openai|groq|cohere|huggingface|together\.ai|localhost:11434"; then
  echo "Ada invariant violated: Anthropic API only. No local models or third-party AI APIs." >&2
  exit 2
fi
exit 0
