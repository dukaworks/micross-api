# Stop MicrossAPI dev processes (backend on 3001, frontend dev server on 5173).
# Port 3000 is intentionally left untouched (belongs to another workspace).

$ErrorActionPreference = 'SilentlyContinue'

Write-Host '=== BEFORE ==='
Get-Process -Name micross-api -ErrorAction SilentlyContinue |
    Select-Object Id, ProcessName, StartTime | Format-Table -AutoSize
netstat -ano | Select-String ':3001|:5173'

$killed = @()

# 1. backend binary
Get-Process -Name micross-api -ErrorAction SilentlyContinue | ForEach-Object {
    $killed += $_.Id
    Stop-Process -Id $_.Id -Force -ErrorAction SilentlyContinue
}

# 2. whatever still listens on 3001 / 5173
foreach ($pt in @(5173, 3001)) {
    $lines = netstat -ano | Select-String ":$pt\s"
    foreach ($ln in $lines) {
        $fields = ($ln.ToString().Trim() -split '\s+')
        $procId = $fields[-1]
        if ($procId -match '^\d+$' -and [int]$procId -gt 4) {
            $killed += [int]$procId
            Stop-Process -Id ([int]$procId) -Force -ErrorAction SilentlyContinue
        }
    }
}

Start-Sleep -Seconds 2

Write-Host ''
Write-Host '=== AFTER ==='
Write-Host '[ports 3001 / 5173]'
$remain = netstat -ano | Select-String ':3001|:5173'
if ($remain) { $remain } else { Write-Host '  released (none)' }

Write-Host '[micross-api process]'
$p = Get-Process -Name micross-api -ErrorAction SilentlyContinue
if ($p) { $p | Select-Object Id | Format-Table -AutoSize } else { Write-Host '  closed (none)' }

Write-Host '[killed PIDs]'
Write-Host ($killed -join ', ')

Write-Host '[port 3000 - left untouched]'
netstat -ano | Select-String ':3000\s' | Select-Object -First 2
