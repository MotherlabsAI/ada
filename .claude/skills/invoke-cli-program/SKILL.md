---
name: invoke-cli-program
description: "Use when user types program command in terminal and presses enter pattern detected."
---

# invoke-cli-program

Trigger: user types program command in terminal and presses enter

## Steps
1. **shell-resolves-command**
   - Pre: `Invocation event is created with commandName; ShellEnvironment has active PATH and workingDirectory`
   - Action: `shell searches PATH and workingDirectory to locate executable matching commandName`
   - Post: `shell has resolved absolute file path to executable and confirmed execute permission bit is set`

2. **kernel-loads-interpreter**
   - Pre: `executable file path is resolved; shebang line exists as first line of file; interpreter path in shebang is valid`
   - Action: `kernel reads shebang line, locates interpreter binary, and spawns interpreter process with source file as argument`
   - Post: `interpreter process is running with source file loaded and ready to execute statements`

3. **program-emits-output**
   - Pre: `interpreter process is running; stdout stream is open and writable; OutputMessage text is 'Hello, World!'`
   - Action: `interpreter executes print statement, writes 'Hello, World!' followed by newline to stdout stream, then exits`
   - Post: `stdout stream contains 'Hello, World!\n'; ExitCode value is 0; interpreter process has terminated`
