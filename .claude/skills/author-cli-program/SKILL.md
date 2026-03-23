---
name: author-cli-program
description: "Use when developer initiates program creation in project directory pattern detected."
---

# author-cli-program

Trigger: developer initiates program creation in project directory

## Steps
1. **resolve-runtime**
   - Pre: `runtime name is known and runtime binary exists on PATH`
   - Action: `locate interpreter path by querying PATH environment variable`
   - Post: `absolute interpreter path is resolved and stored in Runtime.version`

2. **compose-shebang-line**
   - Pre: `absolute interpreter path is resolved`
   - Action: `concatenate '#!' with interpreter path to produce Shebang.rawLine`
   - Post: `Shebang.rawLine is a valid shebang string beginning with '#!'`

3. **write-entry-point-file**
   - Pre: `Shebang.rawLine is valid and EntryPoint.filePath parent directory exists and is writable`
   - Action: `write shebang line followed by print statement for 'Hello, World!' to EntryPoint.filePath`
   - Post: `file exists at EntryPoint.filePath with correct content; OutputMessage.text equals 'Hello, World!' encoded in source`

4. **set-executable-permission**
   - Pre: `EntryPoint.filePath exists on filesystem`
   - Action: `apply chmod +x to file at EntryPoint.filePath, setting Executable.isExecutablePermission to true`
   - Post: `file permission bits include execute for owner; Executable.invocationCommand is now valid`
