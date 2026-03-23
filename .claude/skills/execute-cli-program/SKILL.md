---
name: execute-cli-program
description: "Use when user invokes program name or path in terminal pattern detected."
---

# execute-cli-program

Trigger: user invokes program name or path in terminal

## Steps
1. **shell-resolves-program**
   - Pre: `user-supplied token is either an absolute path, a relative path prefixed with './', or a name present in ShellEnvironment.PATH`
   - Action: `shell searches PATH entries in order and resolves token to an absolute filePath`
   - Post: `shell holds resolved absolute filePath for the CLIProgram; no ambiguity remains`

2. **kernel-reads-shebang-and-spawns-interpreter**
   - Pre: `resolved filePath is executable; file begins with '#!' followed by valid interpreterPath`
   - Action: `kernel reads first line, extracts interpreterPath, spawns interpreter process passing filePath as argument`
   - Post: `interpreter process is running with EntryPoint.filePath as its script argument; process state is active`

3. **write-output-to-stdout**
   - Pre: `interpreter process is active; OutputStream with descriptor stdout (fileDescriptorNumber 1) is open and writable`
   - Action: `interpreter executes print statement, writing OutputMessage.text ('Hello, World!') plus trailingNewline to OutputStream`
   - Post: `bytes for 'Hello, World!\n' have been flushed to stdout; terminal displays the message`

4. **terminate-process**
   - Pre: `print statement has executed; no further statements remain in EntryPoint scope`
   - Action: `interpreter reaches end of script, flushes all buffers, and calls exit with ExitCode.value 0`
   - Post: `process is no longer active; ExitCode.value is 0; ExitCode.meaning is 'success'; control returns to shell`
