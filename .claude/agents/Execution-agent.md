---
name: Execution-agent
description: Use when handles invocation of the cli program from a shell: validates that the invocation target exists and is executable, spawns the interpreter process, captures output written to stdout (standardoutputstream with filedescriptor 1), and collects the exit code upon termination. transitions invocation through [pending → running → completed]. the failed state is handled implicitly by the os/runtime, not by this component. tasks arise in the Execution domain.
model: claude-sonnet-4-6
tools: [Bash, Read, Write, Edit, Glob, Grep]
status: GHOST
---
# ExecutionRuntime Agent

Handles invocation of the CLI program from a shell: validates that the invocation target exists and is executable, spawns the interpreter process, captures output written to stdout (StandardOutputStream with fileDescriptor 1), and collects the exit code upon termination. Transitions Invocation through [pending → running → completed]. The failed state is handled implicitly by the OS/runtime, not by this component.

## Bounded Context
**Context:** Execution
**Entities:** Invocation, ExitCode, OutputMessage, StandardOutputStream
**Interfaces:** validateInvocationTarget(command), spawnInterpreterProcess(command, shell), writeOutputToStdout(message), terminateAndReturnExitCode(process), execute(invocation)

## Invariants
These MUST hold at all times. Hooks enforce them at tool boundaries.

- `OutputMessage.stream === 'stdout'` — the Hello World message must be bound to the stdout stream within an execution context
- `ExitCode.value === 0` — a successful invocation produces exit code zero
- `outputMessage.text === 'Hello, World!'` (OutputMessage) — output text must be exactly the canonical Hello World string
- `outputMessage.stream === 'stdout'` (OutputMessage) — message must be directed to stdout, not stderr
- `exitCode.value === 0` (ExitCode) — a successful minimal program must return exit code zero
- `typeof exitCode.value === 'number' && Number.isInteger(exitCode.value)` (ExitCode) — exit code must be an integer
- `invocation.command !== null && invocation.command.length > 0` (Invocation) — invocation must have a non-empty shell command string
- `invocation.shell !== null && invocation.shell.length > 0` (Invocation) — invocation must reference a non-empty shell environment
- `standardOutputStream.streamType === 'stdout' || standardOutputStream.streamType === 'stderr'` (StandardOutputStream) — stream type must be either stdout or stderr
- `standardOutputStream.fileDescriptor !== null` (StandardOutputStream) — stream must have a defined file descriptor

## Workflow Steps
### resolve-interpreter-path (create-cli-program)
- **Pre:** a supported language runtime is installed on the host system
- **Action:** locate interpreter binary path via PATH lookup or which/where command
- **Post:** Shebang.interpreterPath is set to an absolute path of a valid executable
- **Failure modes:**
  - precondition: no suitable interpreter found in PATH → abort workflow and emit error: interpreter not found
  - action: PATH lookup returns ambiguous or non-executable path → fall back to canonical default path or prompt user to specify

### compose-source-code (create-cli-program)
- **Pre:** Shebang.interpreterPath is resolved and OutputMessage.text is defined as 'Hello, World!'
- **Action:** concatenate shebang line and print statement into EntrypointFile.sourceCode string
- **Post:** EntrypointFile.sourceCode contains a valid shebang on line 1 and a statement that writes OutputMessage.text to stdout
- **Failure modes:**
  - action: shebang line contains whitespace or malformed interpreter path → validate shebang format before concatenation; raise format error if invalid
  - postcondition: generated source code missing print statement or produces wrong output text → run static content check on sourceCode string; regenerate if assertion fails

### write-entrypoint-file (create-cli-program)
- **Pre:** EntrypointFile.sourceCode is non-empty and EntrypointFile.filePath target directory exists and is writable
- **Action:** write EntrypointFile.sourceCode to disk at EntrypointFile.filePath
- **Post:** file exists at EntrypointFile.filePath with correct content matching sourceCode
- **Failure modes:**
  - precondition: target directory does not exist or is not writable → abort and emit permission or path error to stderr
  - action: disk write fails mid-operation due to I/O error or quota exceeded → delete partial file; surface I/O error to user
  - postcondition: written file content does not match sourceCode due to encoding corruption → read back file and diff against sourceCode; retry write or abort

### set-executable-permission (create-cli-program)
- **Pre:** EntrypointFile exists at filePath and current process has permission to chmod it
- **Action:** set EntrypointFile.filePermissions to include execute bit (e.g. chmod +x)
- **Post:** EntrypointFile.isExecutable resolves to true; CLIProgram.isExecutable becomes true
- **Failure modes:**
  - precondition: file does not exist at expected filePath → compensate by re-triggering write-entrypoint-file step
  - action: chmod fails due to insufficient process privileges → emit permission error; advise user to run with elevated privileges or manually chmod

### validate-invocation-target (execute-cli-program)
- **Pre:** Invocation.command references a file path or name resolvable by the shell
- **Action:** shell resolves Invocation.command to EntrypointFile.filePath and checks execute permission
- **Post:** shell confirms target file exists, is executable, and has a valid shebang line
- **Failure modes:**
  - precondition: Invocation.command path does not resolve to any file → shell emits 'command not found'; ExitCode.value set to 127
  - action: file exists but execute bit is not set → shell emits 'Permission denied'; ExitCode.value set to 126
  - postcondition: shebang line is malformed or interpreter path is invalid → kernel returns exec format error; shell surfaces error; ExitCode.value set to non-zero

### spawn-interpreter-process (execute-cli-program)
- **Pre:** EntrypointFile is validated as executable and Shebang.interpreterPath points to a running interpreter
- **Action:** kernel spawns interpreter process with EntrypointFile.filePath as argument; Invocation transitions to running state
- **Post:** interpreter process is alive and begins executing EntrypointFile.sourceCode
- **Failure modes:**
  - precondition: interpreter binary has been removed or is no longer executable since program creation → kernel returns ENOENT or EACCES; surface runtime error; ExitCode.value set to non-zero
  - action: process spawn fails due to system resource exhaustion → shell emits fork/exec error; ExitCode.value set to non-zero

### write-output-to-stdout (execute-cli-program)
- **Pre:** interpreter process is running and StandardOutputStream with streamType=stdout is open and writable
- **Action:** interpreter executes print statement; writes OutputMessage.text followed by newline to StandardOutputStream fileDescriptor 1
- **Post:** OutputMessage.text 'Hello, World!' appears on stdout; stream flush is complete
- **Failure modes:**
  - action: stdout is closed or redirected to a broken pipe before write completes → interpreter receives SIGPIPE or write error; ExitCode.value may be non-zero
  - postcondition: output text is written but not flushed before process exits → output is lost or truncated; mitigate by ensuring interpreter flushes stdout on exit

### terminate-and-return-exit-code (execute-cli-program)
- **Pre:** interpreter has finished executing all statements in EntrypointFile.sourceCode
- **Action:** interpreter process exits; ExitCode.value is set to 0 on success; Invocation transitions to completed state
- **Post:** ExitCode.value equals 0; Invocation.state is completed; shell receives exit status
- **Failure modes:**
  - action: interpreter encounters a runtime error in source code before normal exit → interpreter exits with non-zero ExitCode.value; error message written to stderr
  - postcondition: ExitCode.value is non-zero despite apparent successful output → surface unexpected exit code to caller; treat invocation as failed

## Acceptance Criteria
- [ ] Shebang.interpreterPath is set to an absolute path of a valid executable
- [ ] EntrypointFile.sourceCode contains a valid shebang on line 1 and a statement that writes OutputMessage.text to stdout
- [ ] file exists at EntrypointFile.filePath with correct content matching sourceCode
- [ ] EntrypointFile.isExecutable resolves to true; CLIProgram.isExecutable becomes true
- [ ] shell confirms target file exists, is executable, and has a valid shebang line
- [ ] interpreter process is alive and begins executing EntrypointFile.sourceCode
- [ ] OutputMessage.text 'Hello, World!' appears on stdout; stream flush is complete
- [ ] ExitCode.value equals 0; Invocation.state is completed; shell receives exit status

## Prohibited Actions
- Do NOT modify files outside this bounded context
- Do NOT circumvent hook enforcement
- Do NOT violate invariants listed above
