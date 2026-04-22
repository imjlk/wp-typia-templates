param(
	[string]$Version = "latest",
	[string]$InstallDir = "$env:LOCALAPPDATA\wp-typia\bin",
	[switch]$Update,
	[switch]$Force
)

$ErrorActionPreference = "Stop"

if ($Update.IsPresent) {
	Write-Verbose "Parameter -Update is accepted for compatibility; install always replaces the target binary."
}

if ($Force.IsPresent) {
	Write-Verbose "Parameter -Force is accepted for compatibility; install always replaces the target binary."
}

$Repo = if ($env:WP_TYPIA_RELEASE_REPO) {
	$env:WP_TYPIA_RELEASE_REPO
} else {
	"imjlk/wp-typia"
}
$LatestReleaseUrl = if ($env:WP_TYPIA_LATEST_RELEASE_URL) {
	$env:WP_TYPIA_LATEST_RELEASE_URL
} else {
	"https://api.github.com/repos/$Repo/releases/latest"
}
$ReleaseDownloadBaseUrl = if ($env:WP_TYPIA_RELEASE_DOWNLOAD_BASE_URL) {
	$env:WP_TYPIA_RELEASE_DOWNLOAD_BASE_URL.TrimEnd("/")
} else {
	"https://github.com/$Repo/releases/download"
}
$ManifestName = if ($env:WP_TYPIA_STANDALONE_MANIFEST_NAME) {
	$env:WP_TYPIA_STANDALONE_MANIFEST_NAME
} else {
	"standalone-manifest.env"
}
$ChecksumsName = if ($env:WP_TYPIA_STANDALONE_CHECKSUMS_NAME) {
	$env:WP_TYPIA_STANDALONE_CHECKSUMS_NAME
} else {
	"SHA256SUMS"
}

function Get-ReleaseTag {
	param([string]$RequestedVersion)

	if ($RequestedVersion -ne "latest") {
		return $RequestedVersion
	}

	return (Invoke-RestMethod -Uri $LatestReleaseUrl).tag_name
}

function Get-TargetKey {
	$arch = [System.Runtime.InteropServices.RuntimeInformation]::OSArchitecture.ToString()
	switch ($arch) {
		"X64" { return "windows_x64" }
		default {
			throw "Unsupported Windows architecture for the standalone wp-typia installer: $arch"
		}
	}
}

function Read-EnvManifest {
	param([string]$Path)

	$map = @{}
	foreach ($line in Get-Content -Path $Path) {
		if ([string]::IsNullOrWhiteSpace($line) -or $line.StartsWith("#")) {
			continue
		}

		$key, $value = $line -split "=", 2
		if ($null -eq $value) {
			continue
		}
		$map[$key] = $value
	}

	return $map
}

$releaseTag = Get-ReleaseTag -RequestedVersion $Version
if ([string]::IsNullOrWhiteSpace($releaseTag)) {
	throw "Unable to resolve a wp-typia release tag."
}

$targetKey = Get-TargetKey
$tempRoot = Join-Path ([System.IO.Path]::GetTempPath()) ("wp-typia-install-" + [System.Guid]::NewGuid().ToString("N"))
New-Item -ItemType Directory -Path $tempRoot | Out-Null

try {
	$manifestPath = Join-Path $tempRoot $ManifestName
	$checksumsPath = Join-Path $tempRoot $ChecksumsName

	Invoke-WebRequest -Uri "$ReleaseDownloadBaseUrl/$releaseTag/$ManifestName" -OutFile $manifestPath
	Invoke-WebRequest -Uri "$ReleaseDownloadBaseUrl/$releaseTag/$ChecksumsName" -OutFile $checksumsPath

	$manifest = Read-EnvManifest -Path $manifestPath
	$assetName = $manifest["ASSET_$targetKey"]
	$binaryName = $manifest["BINARY_$targetKey"]

	if ([string]::IsNullOrWhiteSpace($assetName) -or [string]::IsNullOrWhiteSpace($binaryName)) {
		throw "No standalone asset was published for Windows x64 in release $releaseTag."
	}

	$archivePath = Join-Path $tempRoot $assetName
	Invoke-WebRequest -Uri "$ReleaseDownloadBaseUrl/$releaseTag/$assetName" -OutFile $archivePath

	$expectedChecksum = (
		Get-Content -Path $checksumsPath |
			Where-Object { $_ -match "  $([regex]::Escape($assetName))$" } |
			ForEach-Object { ($_ -split "\s+", 2)[0] } |
			Select-Object -First 1
	)
	if ([string]::IsNullOrWhiteSpace($expectedChecksum)) {
		throw "Unable to resolve checksum for $assetName."
	}

	$actualChecksum = (Get-FileHash -Algorithm SHA256 -Path $archivePath).Hash.ToLowerInvariant()
	if ($actualChecksum -ne $expectedChecksum.ToLowerInvariant()) {
		throw "Checksum verification failed for $assetName."
	}

	$extractDir = Join-Path $tempRoot "extract"
	New-Item -ItemType Directory -Path $extractDir | Out-Null
	Expand-Archive -Path $archivePath -DestinationPath $extractDir -Force

	$sourceBinaryPath = Join-Path $extractDir $binaryName
	if (-not (Test-Path -LiteralPath $sourceBinaryPath)) {
		throw "Expected extracted binary $binaryName was missing."
	}

	New-Item -ItemType Directory -Path $InstallDir -Force | Out-Null
	$destinationPath = Join-Path $InstallDir $binaryName
	$tempDestinationPath = "$destinationPath.new"
	Copy-Item -Path $sourceBinaryPath -Destination $tempDestinationPath -Force
	Move-Item -Path $tempDestinationPath -Destination $destinationPath -Force

	$sourceSupportPath = Join-Path $extractDir ".wp-typia"
	if (Test-Path -LiteralPath $sourceSupportPath) {
		$destinationSupportPath = Join-Path $InstallDir ".wp-typia"
		$tempSupportPath = "$destinationSupportPath.new"
		if (Test-Path -LiteralPath $tempSupportPath) {
			Remove-Item -Path $tempSupportPath -Recurse -Force
		}
		Copy-Item -Path $sourceSupportPath -Destination $tempSupportPath -Recurse -Force
		if (Test-Path -LiteralPath $destinationSupportPath) {
			Remove-Item -Path $destinationSupportPath -Recurse -Force
		}
		Move-Item -Path $tempSupportPath -Destination $destinationSupportPath -Force
	}

	Write-Host "Installed $binaryName from $releaseTag to $destinationPath"
	if (-not (($env:PATH -split ';') -contains $InstallDir)) {
		Write-Host "Add $InstallDir to PATH to use $binaryName without the full path."
	}
}
finally {
	Remove-Item -Path $tempRoot -Recurse -Force -ErrorAction SilentlyContinue
}
