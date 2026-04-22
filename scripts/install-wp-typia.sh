#!/bin/sh

set -eu

REPO="${WP_TYPIA_RELEASE_REPO:-imjlk/wp-typia}"
LATEST_RELEASE_URL="${WP_TYPIA_LATEST_RELEASE_URL:-https://api.github.com/repos/${REPO}/releases/latest}"
RELEASE_DOWNLOAD_BASE_URL="${WP_TYPIA_RELEASE_DOWNLOAD_BASE_URL:-https://github.com/${REPO}/releases/download}"
MANIFEST_NAME="${WP_TYPIA_STANDALONE_MANIFEST_NAME:-standalone-manifest.env}"
CHECKSUMS_NAME="${WP_TYPIA_STANDALONE_CHECKSUMS_NAME:-SHA256SUMS}"

VERSION="latest"
INSTALL_DIR="${HOME}/.local/bin"

usage() {
	cat <<'EOF'
Install or update the standalone wp-typia binary.

Options:
  --version <tag|latest>   Install a specific GitHub release tag. Defaults to latest.
  --install-dir <path>     Install destination. Defaults to ~/.local/bin
  --update                 Accepted for explicit update flows.
  --force                  Accepted for explicit overwrite flows.
EOF
}

while [ "$#" -gt 0 ]; do
	case "$1" in
		--version)
			VERSION="${2:?Expected a value after --version}"
			shift 2
			;;
		--install-dir)
			INSTALL_DIR="${2:?Expected a value after --install-dir}"
			shift 2
			;;
		--update|--force)
			shift
			;;
		--help|-h)
			usage
			exit 0
			;;
		*)
			echo "Unsupported option: $1" >&2
			usage >&2
			exit 1
			;;
	esac
done

resolve_latest_tag() {
	curl -fsSL "$LATEST_RELEASE_URL" \
		| sed -n 's/.*"tag_name"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p' \
		| head -n 1
}

resolve_os() {
	case "$(uname -s)" in
		Darwin)
			printf '%s' "darwin"
			;;
		Linux)
			printf '%s' "linux"
			;;
		*)
			echo "Unsupported OS for install-wp-typia.sh. Use the PowerShell installer on Windows." >&2
			exit 1
			;;
	esac
}

resolve_arch() {
	case "$(uname -m)" in
		x86_64|amd64)
			printf '%s' "x64"
			;;
		arm64|aarch64)
			printf '%s' "arm64"
			;;
		*)
			echo "Unsupported architecture for standalone wp-typia install: $(uname -m)" >&2
			exit 1
			;;
	esac
}

compute_sha256() {
	if command -v sha256sum >/dev/null 2>&1; then
		sha256sum "$1" | awk '{print $1}'
		return
	fi

	if command -v shasum >/dev/null 2>&1; then
		shasum -a 256 "$1" | awk '{print $1}'
		return
	fi

	echo "Unable to locate sha256sum or shasum for checksum verification." >&2
	exit 1
}

ensure_command() {
	if command -v "$1" >/dev/null 2>&1; then
		return
	fi

	echo "Missing required command: $1" >&2
	exit 1
}

ensure_command curl
ensure_command tar

TARGET="$(resolve_os)-$(resolve_arch)"
TARGET_KEY="$(printf '%s' "$TARGET" | tr '-' '_')"
RELEASE_TAG="$VERSION"

if [ "$RELEASE_TAG" = "latest" ]; then
	RELEASE_TAG="$(resolve_latest_tag)"
fi

if [ -z "$RELEASE_TAG" ]; then
	echo "Unable to resolve a wp-typia release tag." >&2
	exit 1
fi

TMPDIR_ROOT="${TMPDIR:-/tmp}"
TMPDIR_PATH="$(mktemp -d "${TMPDIR_ROOT%/}/wp-typia-install.XXXXXX")"
trap 'rm -rf "$TMPDIR_PATH"' EXIT INT TERM

MANIFEST_PATH="$TMPDIR_PATH/$MANIFEST_NAME"
CHECKSUMS_PATH="$TMPDIR_PATH/$CHECKSUMS_NAME"

curl -fsSL "${RELEASE_DOWNLOAD_BASE_URL}/${RELEASE_TAG}/${MANIFEST_NAME}" -o "$MANIFEST_PATH"
curl -fsSL "${RELEASE_DOWNLOAD_BASE_URL}/${RELEASE_TAG}/${CHECKSUMS_NAME}" -o "$CHECKSUMS_PATH"

# shellcheck source=/dev/null
. "$MANIFEST_PATH"

ASSET_VAR="ASSET_${TARGET_KEY}"
BINARY_VAR="BINARY_${TARGET_KEY}"

eval "ASSET_NAME=\${${ASSET_VAR}:-}"
eval "BINARY_NAME=\${${BINARY_VAR}:-}"

if [ -z "${ASSET_NAME:-}" ] || [ -z "${BINARY_NAME:-}" ]; then
	echo "No standalone asset was published for target ${TARGET} in release ${RELEASE_TAG}." >&2
	exit 1
fi

ARCHIVE_PATH="$TMPDIR_PATH/$ASSET_NAME"
curl -fsSL "${RELEASE_DOWNLOAD_BASE_URL}/${RELEASE_TAG}/${ASSET_NAME}" -o "$ARCHIVE_PATH"

EXPECTED_CHECKSUM="$(grep "  ${ASSET_NAME}\$" "$CHECKSUMS_PATH" | awk '{print $1}')"
if [ -z "$EXPECTED_CHECKSUM" ]; then
	echo "Unable to resolve checksum for ${ASSET_NAME}." >&2
	exit 1
fi

ACTUAL_CHECKSUM="$(compute_sha256 "$ARCHIVE_PATH")"
if [ "$EXPECTED_CHECKSUM" != "$ACTUAL_CHECKSUM" ]; then
	echo "Checksum verification failed for ${ASSET_NAME}." >&2
	exit 1
fi

tar -xzf "$ARCHIVE_PATH" -C "$TMPDIR_PATH"

SOURCE_BINARY_PATH="$TMPDIR_PATH/$BINARY_NAME"
if [ ! -f "$SOURCE_BINARY_PATH" ]; then
	echo "Expected extracted binary ${BINARY_NAME} was missing." >&2
	exit 1
fi
SOURCE_SUPPORT_PATH="$TMPDIR_PATH/.wp-typia"

mkdir -p "$INSTALL_DIR"
DESTINATION_PATH="$INSTALL_DIR/$BINARY_NAME"
TEMP_DESTINATION_PATH="${DESTINATION_PATH}.new"
cp "$SOURCE_BINARY_PATH" "$TEMP_DESTINATION_PATH"
chmod +x "$TEMP_DESTINATION_PATH"
mv "$TEMP_DESTINATION_PATH" "$DESTINATION_PATH"

if [ -d "$SOURCE_SUPPORT_PATH" ]; then
	DESTINATION_SUPPORT_PATH="$INSTALL_DIR/.wp-typia"
	TEMP_SUPPORT_PATH="${DESTINATION_SUPPORT_PATH}.new"
	rm -rf "$TEMP_SUPPORT_PATH"
	cp -R "$SOURCE_SUPPORT_PATH" "$TEMP_SUPPORT_PATH"
	rm -rf "$DESTINATION_SUPPORT_PATH"
	mv "$TEMP_SUPPORT_PATH" "$DESTINATION_SUPPORT_PATH"
fi

printf 'Installed %s from %s to %s\n' "$BINARY_NAME" "$RELEASE_TAG" "$DESTINATION_PATH"

case ":$PATH:" in
	*":$INSTALL_DIR:"*)
		;;
	*)
		printf 'Add %s to PATH to use `%s` without the full path.\n' "$INSTALL_DIR" "$BINARY_NAME"
		;;
esac
