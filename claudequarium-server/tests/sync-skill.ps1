# Sync Claudequarium Skill to Dubu
# Copies the skill from this repo to the dubu skills folder

$source = "D:\chung\gitstuff\chung-claudequarium\claudequarium-skill"
$destination = "D:\chung\gitstuff\chung-dubu\skills\claudequarium-skill"

# Ensure source exists
if (-not (Test-Path $source)) {
    Write-Host "Error: Source not found: $source" -ForegroundColor Red
    exit 1
}

# Create destination if it doesn't exist
if (-not (Test-Path $destination)) {
    New-Item -ItemType Directory -Path $destination -Force | Out-Null
    Write-Host "Created destination: $destination" -ForegroundColor Yellow
}

# Copy files (exclude config.env to preserve user settings at destination)
$excludeFiles = @("config.env")

Write-Host "Syncing skill..." -ForegroundColor Cyan
Write-Host "  From: $source" -ForegroundColor Gray
Write-Host "  To:   $destination" -ForegroundColor Gray

# Copy all files except excluded ones
Get-ChildItem -Path $source -Recurse | ForEach-Object {
    $relativePath = $_.FullName.Substring($source.Length + 1)
    $destPath = Join-Path $destination $relativePath

    # Skip excluded files
    if ($excludeFiles -contains $_.Name) {
        Write-Host "  Skipped: $relativePath (user config)" -ForegroundColor DarkGray
        return
    }

    if ($_.PSIsContainer) {
        # Create directory if needed
        if (-not (Test-Path $destPath)) {
            New-Item -ItemType Directory -Path $destPath -Force | Out-Null
        }
    } else {
        # Copy file
        Copy-Item -Path $_.FullName -Destination $destPath -Force
        Write-Host "  Copied: $relativePath" -ForegroundColor Green
    }
}

Write-Host "`nSync complete!" -ForegroundColor Green
