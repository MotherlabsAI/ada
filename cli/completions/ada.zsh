#compdef ada
# Install: source this file from ~/.zshrc (add to fpath for zsh)
# e.g. place in a dir on $fpath and run `autoload -Uz compinit && compinit`

_ada() {
  local -a commands
  commands=(
    'compile:Compile intent to blueprint JSON'
    'init:Compile intent and spawn Claude Code'
    'config:Manage ada configuration'
    'run:Spawn Claude Code with governor'
    'resume:Resume from checkpoint'
    'verify:Verify codebase against blueprint'
    'mcp:Start MCP spec authority server'
    'status:Show current project compile status'
    'history:List past compilation runs'
    'list:List compiled projects on this machine'
    'explain:Explain a pipeline stage'
    'export:Export blueprint as markdown/JSON'
    'doctor:Diagnose environment health'
    'which:Print paths ada reads/writes'
    'clean:Remove ada-generated artifacts'
  )

  local -a global_flags
  global_flags=(
    '(--help -h)'{--help,-h}'[Show help]'
    '(--version -v)'{--version,-v}'[Print version]'
  )

  _arguments -C \
    $global_flags \
    '1: :->cmd' \
    '*:: :->args'

  case $state in
    cmd)
      _describe -t commands 'ada command' commands
      ;;
    args)
      case $words[1] in
        compile)
          _arguments \
            '--output[Write blueprint to file]:file:_files' \
            '--strict[Exit 3 on governance violations]'
          ;;
        init)
          _arguments '--no-execute[Write config only, skip Claude spawn]'
          ;;
        config)
          if (( CURRENT == 2 )); then
            _values 'subcommand' 'set-key[Persist API key for a provider]'
          else
            _arguments \
              '--provider[Provider name]:provider:(anthropic openai google xai)' \
              '--key[API key value]:key:' \
              '--env[Environment variable name]:var:' \
              '--no-verify[Skip liveness check]' \
              '--config-path[Config file path]:file:_files'
          fi
          ;;
        verify)
          _arguments \
            '--comment[Output as GitHub PR comment markdown]' \
            '--json[Output raw JSON report]'
          ;;
        status|list)
          _arguments '--json[Output raw JSON]'
          ;;
        history)
          _arguments \
            '--json[Output raw JSON]' \
            '--limit[Max number of runs]:limit:'
          ;;
        export)
          _arguments \
            '--output[Write to file]:file:_files' \
            '--format[Output format]:format:(markdown json)'
          ;;
        clean)
          _arguments \
            '(--force -y)'{--force,-y}'[Skip confirmation]' \
            '--dry-run[List what would be removed]'
          ;;
        explain)
          _values 'stage' INT PER ENT PRO SYN VER GOV
          ;;
      esac
      ;;
  esac
}

_ada "$@"
