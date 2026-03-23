---
name: compile-and-run
description: "Use when developer builds and invokes compiled CLI program from shell pattern detected."
---

# compile-and-run

Trigger: developer builds and invokes compiled CLI program from shell

## Steps
1. **create-source-file**
   - Pre: `workingDirectory is writable AND compiler is resolvable in ShellEnvironment.PATH`
   - Action: `write source code with main entry point and print statement to SourceFile.path`
   - Post: `SourceFile exists at path with syntactically valid source for target language`

2. **execute-build-step**
   - Pre: `SourceFile exists and is syntactically valid AND BuildStep.command references valid compiler AND BuildStep.outputArtifactPath is writable`
   - Action: `invoke BuildStep.command with SourceFile as input, compiler reads source, links, and writes binary to BuildArtifact.path`
   - Post: `BuildArtifact exists at BuildStep.outputArtifactPath AND BuildArtifact.isExecutable is true AND BuildArtifact.producedBy references BuildStep`

3. **invoke-artifact**
   - Pre: `BuildArtifact exists AND BuildArtifact.isExecutable is true AND ShellEnvironment resolves invocation path to BuildArtifact`
   - Action: `shell loads BuildArtifact into process, CPU executes compiled print instruction writing OutputMessage.text to Stdout file descriptor`
   - Post: `OutputMessage.text 'Hello, World!' terminated by newline appears on Stdout AND ExitCode.value is 0 AND process has exited`

4. **clean-build-artifacts**
   - Pre: `invoke-artifact postcondition satisfied AND BuildArtifact.path is known`
   - Action: `delete BuildArtifact from filesystem`
   - Post: `BuildArtifact no longer exists at recorded path`
