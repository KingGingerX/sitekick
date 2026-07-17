# SiteKick Database Backup
# Backs up sitekick.db to a timestamped file in ./backups/
# Run via Task Scheduler for daily automated backups

param(
    [string]$DbPath = "./sitekick.db",
    [string]$BackupDir = "./backups"
)

$ErrorActionPreference = "Stop"

if (-not (Test-Path $DbPath)) {
    Write-Error "Database not found at $DbPath"
    exit 1
}

if (-not (Test-Path $BackupDir)) {
    New-Item -ItemType Directory -Path $BackupDir | Out-Null
}

$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$backupName = "sitekick_backup_${timestamp}.db"
$backupPath = Join-Path $BackupDir $backupName

Copy-Item -Path $DbPath -Destination $backupPath -Force
Write-Host "Backup created: $backupPath" -ForegroundColor Green

# Keep only last 30 backups
Get-ChildItem -Path $BackupDir -Filter "sitekick_backup_*.db" |
    Sort-Object LastWriteTime -Descending |
    Select-Object -Skip 30 |
    Remove-Item -Force

Write-Host "Backup complete. Retention: 30 days." -ForegroundColor Cyan
