#!/bin/bash
# Ada semantic gate — PreToolUse enforcement.
# Reads Claude Code PreToolUse JSON from stdin, extracts tool context,
# and calls `ada gate` to enforce semantic constraints.
# Exit codes: 0=ALLOW, 1=AMEND_FIRST, 2=BLOCK
# Fail-open if ada is not found or JSON parse fails.

# Disable with ADA_GATE_MODE=off
if [ "${ADA_GATE_MODE:-}" = "off" ]; then
  exit 0
fi

ADA_BIN="${HOME}/.local/bin/ada"
if ! command -v ada >/dev/null 2>&1 && [ ! -x "${ADA_BIN}" ]; then
  # ada not found — fail-open
  exit 0
fi

if ! command -v ada >/dev/null 2>&1; then
  ADA_CMD="${ADA_BIN}"
else
  ADA_CMD="ada"
fi

# Read stdin into a variable
INPUT="$(cat)"

# Parse JSON with python3 — pass INPUT via env var to avoid heredoc/stdin conflict
# (python3 - with a heredoc consumes stdin as the script source, so sys.stdin is empty)
PARSED="$(ADA_GATE_INPUT="${INPUT}" python3 - <<'PYEOF'
import sys, json, os, tempfile

data = os.environ.get('ADA_GATE_INPUT', '')
if not data.strip():
    sys.exit(0)

try:
    payload = json.loads(data)
except Exception:
    sys.exit(0)

tool_name = payload.get("tool_name", "")
tool_input = payload.get("tool_input", {})

file_path = tool_input.get("file_path", "")
content = tool_input.get("content", tool_input.get("new_string", ""))
command = tool_input.get("command", "")

# Write args for the shell to eval
print(f"TOOL_NAME={json.dumps(tool_name)}")
print(f"FILE_PATH={json.dumps(file_path)}")
print(f"COMMAND={json.dumps(command)}")

# For large content, write to a temp file
if len(content) > 4096:
    tmp = tempfile.NamedTemporaryFile(mode='w', suffix='.ada-gate-content', delete=False)
    tmp.write(content)
    tmp.close()
    print(f"CONTENT_FILE={json.dumps(tmp.name)}")
else:
    print(f"CONTENT_FILE=")
    print(f"CONTENT={json.dumps(content)}")
PYEOF
)"

# If python3 failed or returned nothing, fail-open
if [ $? -ne 0 ] || [ -z "${PARSED}" ]; then
  exit 0
fi

# Evaluate the parsed variables
eval "${PARSED}"

# Build ada gate arguments
GATE_ARGS=("gate")

if [ -n "${TOOL_NAME}" ]; then
  GATE_ARGS+=("--tool" "${TOOL_NAME}")
fi

if [ -n "${FILE_PATH}" ]; then
  GATE_ARGS+=("--file" "${FILE_PATH}")
fi

if [ -n "${COMMAND}" ]; then
  GATE_ARGS+=("--command" "${COMMAND}")
fi

if [ -n "${CONTENT_FILE}" ]; then
  GATE_ARGS+=("--content-file" "${CONTENT_FILE}")
  CLEANUP_FILE="${CONTENT_FILE}"
elif [ -n "${CONTENT}" ]; then
  GATE_ARGS+=("--content" "${CONTENT}")
fi

# Run ada gate
"${ADA_CMD}" "${GATE_ARGS[@]}"
EXIT_CODE=$?

# Clean up temp file if we created one
if [ -n "${CLEANUP_FILE:-}" ] && [ -f "${CLEANUP_FILE}" ]; then
  rm -f "${CLEANUP_FILE}"
fi

# Map exit codes:
# 0 = ALLOW
# 1 = AMEND_FIRST
# 2 = BLOCK (Claude Code shows stderr to the model)
# Any other failure from ada = fail-open (exit 0)
case "${EXIT_CODE}" in
  0) exit 0 ;;
  1) exit 1 ;;
  2) exit 2 ;;
  *) exit 0 ;;
esac
