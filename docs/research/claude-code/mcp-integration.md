# Claude Code — MCP Integration

**Researched:** 2026-03-24
**Sources:** code.claude.com/docs/en/mcp.md, modelcontextprotocol.io/specification/2025-11-25, modelcontextprotocol.io/docs/develop/connect-local-servers, code.claude.com/docs/en/settings.md

---

## Server Discovery & Configuration [CONFIRMED]

### Configuration locations by scope

| Scope   | File                                | Visibility                      |
| ------- | ----------------------------------- | ------------------------------- |
| User    | `~/.claude.json` (`mcpServers` key) | Private, cross-project          |
| Project | `.mcp.json` at repo root            | Version-controlled, team-shared |
| Local   | `~/.claude.json` per-project        | Private, per-project            |
| Managed | `managed-mcp.json` (system-level)   | Enterprise-wide                 |

**Precedence:** Local > Project > User. Managed overrides all when configured for exclusive control.

### Full schema for a server entry [CONFIRMED]

```json
{
  "mcpServers": {
    "ada": {
      "type": "stdio",
      "command": "ada",
      "args": ["mcp"],
      "env": {
        "ADA_PROJECT_DIR": "${CLAUDE_PROJECT_DIR:-}"
      }
    },
    "remote-server": {
      "type": "http",
      "url": "${API_BASE_URL}/mcp",
      "headers": {
        "Authorization": "Bearer ${API_TOKEN}"
      }
    }
  }
}
```

**Environment variable expansion:** `${VAR_NAME}` and `${VAR_NAME:-default}` both supported in all fields.

---

## Stdio Lifecycle [CONFIRMED]

1. **Session start** — Claude Code reads `mcpServers` config
2. **Process spawn** — `command` + `args` launched as child process via OS
3. **Stdio connection** — server's stdin/stdout become the communication channel
4. **JSON-RPC handshake** — `initialize` request/response exchange, capabilities declared
5. **Tool listing** — `tools/list` fetched; tools become available in session
6. **Tool calls** — JSON-RPC `tools/call` throughout the session
7. **Session end** — process terminates when session ends

**One process per server, per session.** The process persists across all tool calls in that session — not spawned per call. Average startup: ~1.2 seconds per stdio server.

Restart mid-session: `/reload-plugins` or reconnect via `/mcp`.

---

## Tool Listing Protocol [CONFIRMED]

**Request:**

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/list",
  "params": { "cursor": "optional-pagination-cursor" }
}
```

**Response:**

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "tools": [
      {
        "name": "get_blueprint",
        "description": "Returns the full active Blueprint",
        "inputSchema": {
          "type": "object",
          "properties": { "scope": { "type": "string" } },
          "required": []
        }
      }
    ],
    "nextCursor": "next-page-cursor"
  }
}
```

**Timing:** Tool list fetched at session start. If server declares `listChanged` capability, it can notify client of changes mid-session.

---

## Tool Calling Protocol [CONFIRMED]

**Request:**

```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "method": "tools/call",
  "params": {
    "name": "ada.get_blueprint",
    "arguments": { "scope": "payment" }
  }
}
```

**Success response:**

```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "result": {
    "content": [{ "type": "text", "text": "serialized blueprint JSON" }],
    "isError": false
  }
}
```

**Error response (execution error — use this, not JSON-RPC error):**

```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "result": {
    "content": [
      {
        "type": "text",
        "text": "No compiled world model found. Run ada init first."
      }
    ],
    "isError": true
  }
}
```

**Protocol error (malformed request):** Standard JSON-RPC error object. Not shown to model.

---

## Tool Namespacing [CONFIRMED]

Format: `{server-name}.{tool-name}`

- Server name `ada` + tool name `get_blueprint` → `ada.get_blueprint`
- Name constraints: 1–128 characters, A-Z a-z 0-9 \_ - .
- Case-sensitive, unique within server

---

## Context Available to MCP Server [CONFIRMED]

**Server receives:**

- Environment variables explicitly set in config's `env` object
- OS user identity (runs under same user as Claude Code)
- Full filesystem access for that user

**Server does NOT automatically receive:**

- Current project path (must be passed explicitly via env or tool arguments)
- Session ID or conversation history
- Current file being edited
- Git repository information

**Workaround:** Have Claude pass project context in tool arguments. Ada does this: `ada.check_drift("description of planned change")`. Ada's server reads `ADA_PROJECT_DIR` env var to find `.ada/state.json`.

---

## Tool Result Handling [CONFIRMED]

MCP tool results are injected into the conversation as tool_result message blocks. The model sees them and can respond.

**Large output management:**

- Warning threshold: 10,000 tokens
- Default max: 25,000 tokens
- Override: `MAX_MCP_OUTPUT_TOKENS=50000` env var

**Tool Search** (auto-enabled when tools exceed 10% of context):

- Tools loaded on-demand instead of upfront
- Claude uses `MCPSearch` tool to find relevant tools
- Configure: `ENABLE_TOOL_SEARCH=auto` (auto at 10%), `ENABLE_TOOL_SEARCH=auto:5` (auto at 5%)

---

## Error Handling [CONFIRMED]

Two tracks:

1. **Protocol errors** (malformed requests) → logged, shown to user, NOT retried, NOT shown to model
2. **Tool execution errors** (`isError: true`) → shown to model in tool_result; model can self-correct and retry

Use `isError: true` in the result content for business logic errors (blueprint not found, drift detected). Use JSON-RPC error only for protocol violations (unknown method, malformed request).

---

## Authentication [CONFIRMED]

**Stdio servers:** No auth needed — inherits OS user permissions. Secrets passed via `env` object.

**HTTP servers:** OAuth 2.0 supported.

- Dynamic client registration (auto-discovered)
- Pre-configured credentials via `--client-id`, `--client-secret`
- Config via `oauth` object in server entry

**Secrets management:** Stored in system keychain (macOS) or credentials file — never plain text in config files.

---

## Advanced Features [CONFIRMED]

**Resources** — servers can expose file/data resources via `@mention`:

```
@ada:file://blueprint.md
```

Client fetches via `resources/list` + `resources/read`.

**Prompts as commands** — servers can expose prompts that become `/mcp__servername__promptname` commands.

**Server-provided instructions** — servers can declare an `instructions` field that Claude reads to understand how to use the tools. Currently Ada's server doesn't use this.

---

## Gaps

- Whether server receives current working directory automatically [UNVERIFIED]
- Exact retry logic and timeout values [UNVERIFIED]
- Max simultaneous servers (tested to 20; behavior above 20 undefined) [UNVERIFIED]
- Whether `tools/call` requests are serialized or concurrent per-server [UNVERIFIED]

---

## Implications for Ada's MCP Server

1. **Ada must write `.mcp.json` at ACCEPT.** Currently users manually configure the MCP server. Ada should write `.mcp.json` at the project root during ACCEPT so the server auto-connects on every Claude Code session in that repo.

2. **Add server `instructions` field.** Claude reads a server-level instructions string to understand the tools. Ada should declare: "Ada semantic compiler verification tools. Use to validate code against compiled intent, check semantic drift, and query invariants. Call ada.query_constraints before modifying any entity."

3. **Use `isError: true` consistently for business errors.** Ada's tools currently use a mix of error patterns. All business errors (no blueprint, no manifest, stage not found) should use `isError: true` so Claude can self-correct.

4. **Project path is available via env.** Ada's server reads `ADA_PROJECT_DIR` → `dirname(ADA_STATE_PATH)` → `cwd`. This chain is correct. Consider also accepting `CLAUDE_PROJECT_DIR` (which Claude Code sets) as an additional fallback.

5. **Tool descriptions are in the context budget.** Short, precise tool descriptions. Each description adds to every session's token cost. Current descriptions are appropriate length.

6. **Tool Search may hide Ada's tools.** If the session has many MCP tools (>10% of context), Claude Code switches to on-demand tool search. Ada's tools may not be surfaced automatically. Ada's CLAUDE.md should tell Claude to call Ada tools by name proactively, not wait for Claude to discover them.
