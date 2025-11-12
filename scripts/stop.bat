@echo off
setlocal
set "PS_PATH=%SystemRoot%\System32\WindowsPowerShell\v1.0\powershell.exe"
if not exist "%PS_PATH%" (
    set "PS_PATH=%ProgramFiles%\PowerShell\7\pwsh.exe"
    if not exist "%PS_PATH%" (
        echo Error: PowerShell not found!
        echo Please run the script directly: .\scripts\STOP_ALL_SERVICES.ps1
        exit /b 1
    )
)
call "%PS_PATH%" -ExecutionPolicy Bypass -File "%~dp0STOP_ALL_SERVICES.ps1"
endlocal

