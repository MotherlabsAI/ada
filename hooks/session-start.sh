#!/bin/bash
cat << 'JSON'
{
  "additionalContext": "Ada build session active. Read CLAUDE.md first. Invariants: Anthropic API only (claude-sonnet-4-6 default, claude-opus-4-6 for Governor/Verify/Synthesis), TypeScript strict mode, no any type, every artifact needs PostcodeAddress, verify-agent runs after each package, Governor authority is final. Build order in CLAUDE.md section 5."
}
JSON
