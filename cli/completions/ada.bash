# Install: source this file from ~/.bashrc
# ada bash completion

_ada() {
  local cur prev words cword
  COMPREPLY=()
  cur="${COMP_WORDS[COMP_CWORD]}"
  prev="${COMP_WORDS[COMP_CWORD-1]}"

  local commands="compile init config run resume verify mcp status history list explain export doctor which clean"
  local global_flags="--help -h --version -v"

  # File completion after flags that take a path
  case "$prev" in
    --output|--config-path)
      COMPREPLY=( $(compgen -f -- "$cur") )
      return 0
      ;;
    --format)
      COMPREPLY=( $(compgen -W "markdown json" -- "$cur") )
      return 0
      ;;
    --provider)
      COMPREPLY=( $(compgen -W "anthropic openai google xai" -- "$cur") )
      return 0
      ;;
    --key|--env|--comment|--limit)
      return 0
      ;;
  esac

  # Complete top-level command
  if [ "$COMP_CWORD" -eq 1 ]; then
    COMPREPLY=( $(compgen -W "$commands $global_flags" -- "$cur") )
    return 0
  fi

  local cmd="${COMP_WORDS[1]}"
  local sub="${COMP_WORDS[2]}"

  case "$cmd" in
    compile)
      COMPREPLY=( $(compgen -W "--output --strict $global_flags" -- "$cur") )
      ;;
    init)
      COMPREPLY=( $(compgen -W "--no-execute $global_flags" -- "$cur") )
      ;;
    config)
      if [ "$COMP_CWORD" -eq 2 ]; then
        COMPREPLY=( $(compgen -W "set-key $global_flags" -- "$cur") )
      elif [ "$sub" = "set-key" ]; then
        COMPREPLY=( $(compgen -W "--provider --key --env --no-verify --config-path $global_flags" -- "$cur") )
      fi
      ;;
    verify)
      COMPREPLY=( $(compgen -W "--comment --json $global_flags" -- "$cur") )
      ;;
    status|list)
      COMPREPLY=( $(compgen -W "--json $global_flags" -- "$cur") )
      ;;
    history)
      COMPREPLY=( $(compgen -W "--json --limit $global_flags" -- "$cur") )
      ;;
    export)
      COMPREPLY=( $(compgen -W "--output --format $global_flags" -- "$cur") )
      ;;
    clean)
      COMPREPLY=( $(compgen -W "--force -y --dry-run $global_flags" -- "$cur") )
      ;;
    explain)
      if [ "$COMP_CWORD" -eq 2 ]; then
        COMPREPLY=( $(compgen -W "INT PER ENT PRO SYN VER GOV $global_flags" -- "$cur") )
      else
        COMPREPLY=( $(compgen -W "$global_flags" -- "$cur") )
      fi
      ;;
    run|resume|mcp|doctor|which)
      COMPREPLY=( $(compgen -W "$global_flags" -- "$cur") )
      ;;
    *)
      COMPREPLY=( $(compgen -W "$global_flags" -- "$cur") )
      ;;
  esac
  return 0
}

complete -F _ada ada
