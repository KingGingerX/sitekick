# SiteKick Scheduled Outreach Automation
# Run this via Windows Task Scheduler to auto-send follow-ups daily
# Usage: .\scripts\schedule-outreach.ps1 -BaseUrl "http://localhost:3000"

param(
    [string]$BaseUrl = "http://localhost:3000",
    [string]$AdminPassword = $env:ADMIN_PASSWORD,
    [int]$Stage = 2
)

$ErrorActionPreference = "Stop"

if (-not $AdminPassword) {
    Write-Error "ADMIN_PASSWORD environment variable or parameter is required"
    exit 1
}

# Login
$loginBody = @{ password = $AdminPassword } | ConvertTo-Json -Compress
$loginResponse = Invoke-RestMethod -Uri "$BaseUrl/api/auth/login" -Method POST -Body $loginBody -ContentType "application/json" -SessionVariable session

if (-not $loginResponse.ok) {
    Write-Error "Login failed"
    exit 1
}

Write-Host "Logged in successfully" -ForegroundColor Green

# Send bulk follow-ups for specified stage
$bulkBody = @{ stage = $Stage } | ConvertTo-Json -Compress
$bulkResponse = Invoke-RestMethod -Uri "$BaseUrl/api/outreach" -Method PUT -Body $bulkBody -ContentType "application/json" -WebSession $session

Write-Host "Bulk outreach complete: $($bulkResponse.sent) sent, $($bulkResponse.skipped) skipped" -ForegroundColor Cyan
