# SiteKick Staging Deploy
# Builds and deploys to a staging Docker container on port 3001

param(
    [string]$EnvFile = ".env.staging",
    [int]$Port = 3001
)

$ErrorActionPreference = "Stop"

if (-not (Test-Path $EnvFile)) {
    Write-Warning "Staging env file not found at $EnvFile — using .env.local"
    $EnvFile = ".env.local"
}

& "$PSScriptRoot\deploy.ps1" -EnvFile $EnvFile -Port $Port
