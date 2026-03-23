---
name: author-and-run-interpreted
description: "Use when developer invokes interpreter-based CLI program from shell pattern detected."
---

# author-and-run-interpreted

Trigger: developer invokes interpreter-based CLI program from shell

## Steps
1. **create-source-file**
   - Pre: `workingDirectory is writable AND no conflicting file exists at target path`
   - Action: `write source code containing print statement to SourceFile.path`
   - Post: `SourceFile exists at path with correct language syntax and OutputMessage.text embedded`

2. **set-shebang-and-permissions**
   - Pre: `SourceFile exists AND Runtime.executablePath is resolvable in ShellEnvironment.PATH`
   - Action: `prepend shebang line referencing Runtime.executablePath to SourceFile AND set executable bit on SourceFile`
   - Post: `SourceFile.hasShebang is true AND SourceFile.shebangLine matches Runtime.executablePath AND file mode includes +x`

3. **invoke-program**
   - Pre: `SourceFile.hasShebang is true AND SourceFile is executable AND ShellEnvironment.workingDirectory contains SourceFile`
   - Action: `shell resolves shebang, hands SourceFile to Runtime process, Runtime evaluates print statement writing OutputMessage.text to Stdout`
   - Post: `OutputMessage.text 'Hello, World!' appears on Stdout AND ExitCode.value is 0 AND process has terminated`
