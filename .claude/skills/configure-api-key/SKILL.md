---
name: configure-api-key
description: "Use when user executes `ada config set-key --provider <name> --key <value>` or `ada config set-key --env <VAR>` pattern detected."
---

# configure-api-key

Trigger: user executes `ada config set-key --provider <name> --key <value>` or `ada config set-key --env <VAR>`

## Steps
1. **resolve-key-source**
   - Pre: `CLI arguments are parsed AND either --key flag or --env flag is present (not both)`
   - Action: `if --key provided: set keyValue from flag, set source=CLI_FLAG; if --env provided: read environment variable named by flag value, set keyValue from env var, set source=ENV_VAR`
   - Post: `APIKeyConfiguration record has keyValue set to non-empty string AND source is CLI_FLAG or ENV_VAR AND provider is set from --provider flag`

2. **validate-key-format**
   - Pre: `APIKeyConfiguration.keyValue is non-empty AND APIKeyConfiguration.provider is known provider string`
   - Action: `apply provider-specific regex pattern to keyValue to verify structural format (e.g. 'sk-' prefix for OpenAI); do NOT make network call`
   - Post: `keyValue passes structural validation for the declared provider`

3. **persist-key-configuration**
   - Pre: `APIKeyConfiguration is structurally valid AND target config file path is known (default: ~/.ada/config.json) AND parent directory exists or can be created`
   - Action: `create parent directory if absent; write APIKeyConfiguration to config file with permissions 0600; if file already exists merge provider entry without overwriting other providers`
   - Post: `config file exists at target path with permissions 0600 AND contains the new provider entry AND previously stored providers are preserved`

4. **verify-key-liveness**
   - Pre: `APIKeyConfiguration is persisted AND --no-verify flag is NOT set AND provider endpoint is known`
   - Action: `make minimal authenticated request to provider API (e.g. list models or token introspection endpoint); measure response status`
   - Post: `provider returns 2xx response AND APIKeyConfiguration.keyValue is confirmed live AND AdaCLI.apiKeyConfig references this configuration`
