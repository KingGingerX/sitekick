# SiteKick Deploy Script
# Usage: .\scripts\deploy.ps1

param(
    [string]$EnvFile = ".env.local",
    [int]$Port = 3000
)

$ErrorActionPreference = "Stop"
$ImageName = "sitekick"
$ContainerName = "sitekick-app"

Write-Host "=== SiteKick Deploy ===" -ForegroundColor Cyan

# Validate env file exists
if (-not (Test-Path $EnvFile)) {
    Write-Error "Environment file not found: $EnvFile"
    exit 1
}

# Stop and remove existing container
$existing = docker ps -aq -f "name=$ContainerName"
if ($existing) {
    Write-Host "Stopping existing container..." -ForegroundColor Yellow
    docker stop $ContainerName | Out-Null
    docker rm $ContainerName | Out-Null
}

# Build image
Write-Host "Building Docker image..." -ForegroundColor Green
docker build -t $ImageName .

# Run container
Write-Host "Starting container on port $Port..." -ForegroundColor Green
docker run -d `
    --name $ContainerName `
    -p "${Port}:3000" `
    --env-file $EnvFile `
    -v "${PWD}/sitekick.db:/app/sitekick.db" `
    --restart unless-stopped `
    $ImageName

Write-Host "Done! App running at http://localhost:$Port" -ForegroundColor Cyan
Write-Host "Health check: http://localhost:$Port/api/health" -ForegroundColor Gray
