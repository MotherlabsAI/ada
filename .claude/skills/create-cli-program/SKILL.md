---
name: create-cli-program
description: "Use when developer initiates hello-world program creation pattern detected."
---

# create-cli-program

Trigger: developer initiates hello-world program creation

## Steps
1. **write-entry-point-file**
   - Pre: `target filePath does not exist OR is writable; interpreter is available on host system`
   - Action: `write source text containing shebang directive on line 1 and print statement to filePath`
   - Post: `filePath exists on disk; file content begins with shebang; print statement targeting stdout is present`

2. **set-executable-permission**
   - Pre: `filePath exists on disk and process has ownership or write rights to it`
   - Action: `apply execute bit to filePath via chmod or platform equivalent`
   - Post: `CLIProgram.isExecutable is true; OS permission bits include execute for owning user`

3. **verify-shebang-resolves**
   - Pre: `filePath is executable; ShellEnvironment.PATH is populated`
   - Action: `resolve Shebang.interpreterPath against filesystem to confirm interpreter binary is reachable`
   - Post: `Shebang.interpreterPath points to an executable binary; CLIProgram is ready to run`
