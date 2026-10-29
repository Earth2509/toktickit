# First browser attempt: environment failure, not a passing run

The first clean-main browser attempt started after the five successful default
suite/build commands on 29 October 2026. It inherited sandbox LOCALAPPDATA and
looked for Chromium in the sandbox's cache instead of the installed user cache.
The generated Playwright error-context files were inspected and reported:

```
Error: browserType.launch: Executable doesn't exist at
C:\Users\ASUS\AppData\Local\Packages\sandbox.{156a52f0-bff7-467d-a25f-b89e78259788}\AC\ms-playwright\chromium_headless_shell-1234\chrome-headless-shell-win64\chrome-headless-shell.exe
```

No browser-level product assertions ran in that attempt. Its collector was
interrupted after the child web-server streams remained open. Consequently this
note is an observed diagnostic transcription, NOT complete captured stdout, an
exit-code record from Playwright, or a passing browser result.

The repeat explicitly points PLAYWRIGHT_BROWSERS_PATH at the existing
`C:/Users/ASUS/AppData/Local/ms-playwright` cache and uses different isolated ports.
It does not install a different browser or change main's test configuration.
Only its separately completed log and manifest may establish a passing result.
