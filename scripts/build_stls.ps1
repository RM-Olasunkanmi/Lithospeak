# Requires: Python and OpenSCAD

[CmdletBinding()]
param(
    [switch]$IncludePlateReference,
    [string]$OpenScadPath
)

$ErrorActionPreference = 'Stop'

function Resolve-OpenScadPath {
    param([string]$PreferredPath)

    if ($PreferredPath) {
        if (-not (Test-Path -LiteralPath $PreferredPath)) {
            throw "OpenSCAD was not found at '$PreferredPath'."
        }

        return (Resolve-Path -LiteralPath $PreferredPath).Path
    }

    $command = Get-Command openscad -ErrorAction SilentlyContinue
    if ($command) {
        return $command.Source
    }

    $commonPaths = @(
        'C:\Program Files\OpenSCAD\openscad.exe',
        'C:\Program Files (x86)\OpenSCAD\openscad.exe',
        "$env:LOCALAPPDATA\Programs\OpenSCAD\openscad.exe"
    )

    foreach ($path in $commonPaths) {
        if (Test-Path -LiteralPath $path) {
            return $path
        }
    }

    throw 'OpenSCAD was not found. Install it or pass -OpenScadPath "C:\path\to\openscad.exe".'
}

function Invoke-OpenScadExport {
    param(
        [string]$Exe,
        [string]$Part,
        [string]$OutputPath,
        [string]$ScadFile
    )

    $commandLine = '"{0}" -D "part=\"{1}\"" -o "{2}" "{3}"' -f $Exe, $Part, $OutputPath, $ScadFile
    cmd /c $commandLine

    if (-not $?) {
        throw "OpenSCAD export failed for part '$Part'."
    }
}

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectRoot = Split-Path -Parent $scriptDir

$configText = Get-Content -LiteralPath (Join-Path $projectRoot 'config.py') -Raw
$versionMatch = [regex]::Match($configText, 'VERSION\s*=\s*"([^"]+)"')
if (-not $versionMatch.Success) {
    throw 'Failed to read VERSION from config.py.'
}

$version = $versionMatch.Groups[1].Value
$projectName = 'RotatingPhotoSphere'
$outputDir = Join-Path $projectRoot "output\v$version"
$scadFile = Join-Path $projectRoot 'scad\sphere_lamp.scad'

if (-not (Test-Path -LiteralPath $projectRoot)) {
    throw "Project root '$projectRoot' was not found."
}

if (-not (Test-Path -LiteralPath $scadFile)) {
    throw "SCAD entrypoint '$scadFile' was not found."
}

if (-not (Test-Path -LiteralPath $outputDir)) {
    New-Item -ItemType Directory -Path $outputDir | Out-Null
}

$openScadExe = Resolve-OpenScadPath -PreferredPath $OpenScadPath

python (Join-Path $projectRoot 'scripts\build_lithophane_data.py')
if (-not $?) {
    throw 'Failed to generate OpenSCAD input data.'
}

$exports = @(
    @{ Part = 'sphere'; Output = Join-Path $outputDir "${projectName}_v${version}_Sphere.stl" },
    @{ Part = 'base'; Output = Join-Path $outputDir "${projectName}_v${version}_Base.stl" },
    @{ Part = 'fit_test'; Output = Join-Path $outputDir "${projectName}_v${version}_FitTest.stl" }
)

foreach ($export in $exports) {
    Invoke-OpenScadExport -Exe $openScadExe -Part $export.Part -OutputPath $export.Output -ScadFile $scadFile
}

if ($IncludePlateReference) {
    $plateOutput = Join-Path $outputDir "${projectName}_v${version}_plate_reference.png"
    Invoke-OpenScadExport -Exe $openScadExe -Part 'plate' -OutputPath $plateOutput -ScadFile $scadFile
}

"Generated STL output in $outputDir"
