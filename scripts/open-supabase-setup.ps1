# One-click Supabase setup helper for Universes of RPG
$project = "qfataluxujybeiksfjjg"
$netlifyUrl = "https://universofrpg.netlify.app"

$sqlPath = Join-Path $PSScriptRoot "..\supabase\migrations\001_initial_schema.sql"
$sql = Get-Content $sqlPath -Raw
Set-Clipboard -Value $sql

Start-Process "https://supabase.com/dashboard/project/$project/sql/new"
Start-Sleep -Seconds 1
Start-Process "https://supabase.com/dashboard/project/$project/auth/url-configuration"

Write-Host ""
Write-Host "=== Supabase setup ===" -ForegroundColor Magenta
Write-Host ""
Write-Host "SQL migration copied to clipboard!" -ForegroundColor Green
Write-Host "  1. In SQL Editor: Ctrl+V -> Run"
Write-Host ""
Write-Host "Auth URL Configuration:" -ForegroundColor Cyan
Write-Host "  Site URL:       $netlifyUrl"
Write-Host "  Redirect URLs (add both, one per line):"
Write-Host "    $netlifyUrl/auth/callback"
Write-Host "    http://localhost:3000/auth/callback"
Write-Host ""
