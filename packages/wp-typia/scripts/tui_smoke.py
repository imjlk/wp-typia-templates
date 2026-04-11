#!/usr/bin/env python3

from __future__ import annotations

import os
import re
import select
import shutil
import struct
import subprocess
import sys
import time
import tempfile
from dataclasses import dataclass
from pathlib import Path

if os.name != "posix":
    raise SystemExit("tui_smoke.py requires a POSIX environment (pty/termios/fcntl).")

import fcntl
import pty
import termios


ANSI_PATTERN = re.compile(
    r"""
    \x1B(?:  # ESC
        \[[0-?]*[ -/]*[@-~]  # CSI
        | \][^\x07\x1B]*(?:\x07|\x1B\\)  # OSC
        | [PX^_].*?\x1B\\  # DCS, PM, APC, SOS
        | [@-Z\\-_]  # 2-byte escape
    )
    """,
    re.VERBOSE | re.DOTALL,
)


def format_patterns(patterns: list[str]) -> str:
    return " or ".join(repr(pattern) for pattern in patterns)


def normalize_output(buffer: bytes) -> str:
    text = buffer.decode("utf-8", errors="ignore")
    text = ANSI_PATTERN.sub("", text)
    text = text.replace("\r\n", "\n").replace("\r", "\n")
    return text


def ensure_success(command: list[str], cwd: Path) -> None:
    subprocess.run(command, cwd=cwd, check=True, stdout=subprocess.DEVNULL)


def ensure_text_in_tree(root: Path, needle: str) -> None:
    ignored_dirs = {"node_modules", ".git"}
    for candidate in root.rglob("*"):
        relative_parts = candidate.relative_to(root).parts
        if any(part in ignored_dirs for part in relative_parts):
            continue
        if not candidate.is_file():
            continue
        try:
            contents = candidate.read_text(encoding="utf-8")
        except UnicodeDecodeError:
            continue
        if needle in contents:
            return
    raise RuntimeError(f"Expected to find {needle!r} somewhere under {root}.")


@dataclass
class PtySession:
    command: list[str]
    cwd: Path
    timeout_seconds: float = 20.0

    def __post_init__(self) -> None:
        master_fd, slave_fd = pty.openpty()
        os.environ.setdefault("TERM", "xterm-256color")
        env = os.environ.copy()
        env.update(
            {
                "TERM": "xterm-256color",
                "COLORTERM": "truecolor",
                "COLUMNS": "80",
                "LINES": "18",
            }
        )
        fcntl.ioctl(slave_fd, termios.TIOCSWINSZ, struct.pack("HHHH", 18, 80, 0, 0))
        attributes = termios.tcgetattr(slave_fd)
        attributes[0] &= ~(termios.IXON | termios.IXOFF)
        termios.tcsetattr(slave_fd, termios.TCSANOW, attributes)

        def configure_child() -> None:
            os.setsid()
            fcntl.ioctl(slave_fd, termios.TIOCSCTTY, 0)

        self.process = subprocess.Popen(
            self.command,
            cwd=self.cwd,
            env=env,
            stdin=slave_fd,
            stdout=slave_fd,
            stderr=slave_fd,
            close_fds=True,
            preexec_fn=configure_child,
        )
        os.close(slave_fd)
        os.set_blocking(master_fd, False)
        self.master_fd = master_fd
        self.buffer = bytearray()

    def close(self) -> None:
        if self.process.poll() is None:
            self.process.terminate()
            try:
                self.process.wait(timeout=5)
            except subprocess.TimeoutExpired:
                self.process.kill()
                self.process.wait(timeout=5)
        try:
            os.close(self.master_fd)
        except OSError:
            pass

    @property
    def text(self) -> str:
        return normalize_output(bytes(self.buffer))

    def _drain_once(self, timeout: float = 0.2) -> None:
        ready, _, _ = select.select([self.master_fd], [], [], timeout)
        if not ready:
            return
        while True:
            try:
                chunk = os.read(self.master_fd, 65536)
            except BlockingIOError:
                return
            except OSError:
                return
            if not chunk:
                return
            self.buffer.extend(chunk)
            if len(chunk) < 65536:
                return

    def _drain_until_idle(self, idle_timeout: float = 0.1, max_attempts: int = 10) -> None:
        for _ in range(max_attempts):
            previous_size = len(self.buffer)
            self._drain_once(idle_timeout)
            if len(self.buffer) == previous_size:
                return

    def wait_for(self, pattern: str, timeout_seconds: float | None = None) -> None:
        timeout = self.timeout_seconds if timeout_seconds is None else timeout_seconds
        deadline = time.monotonic() + timeout
        while time.monotonic() < deadline:
            self._drain_once()
            if pattern in self.text:
                return
            if self.process.poll() is not None:
                self._drain_until_idle()
                if pattern in self.text:
                    return
                raise RuntimeError(
                    f"Process exited while waiting for {pattern!r}.\nLast output:\n{self.text}"
                )
        raise RuntimeError(f"Timed out waiting for {pattern!r}.\nLast output:\n{self.text}")

    def wait_for_any(
        self, patterns: list[str], timeout_seconds: float | None = None
    ) -> str:
        timeout = self.timeout_seconds if timeout_seconds is None else timeout_seconds
        deadline = time.monotonic() + timeout
        while time.monotonic() < deadline:
            self._drain_once()
            text = self.text
            for pattern in patterns:
                if pattern in text:
                    return pattern
            if self.process.poll() is not None:
                self._drain_until_idle()
                text = self.text
                for pattern in patterns:
                    if pattern in text:
                        return pattern
                raise RuntimeError(
                    f"Process exited while waiting for {format_patterns(patterns)}.\n"
                    f"Last output:\n{self.text}"
                )
        raise RuntimeError(
            f"Timed out waiting for {format_patterns(patterns)}.\nLast output:\n{self.text}"
        )

    def send(self, payload: bytes | str) -> None:
        if isinstance(payload, str):
            payload = payload.encode("utf-8")
        os.write(self.master_fd, payload)
        time.sleep(0.2)
        self._drain_once(0)

    def send_tabs(self, count: int) -> None:
        for _ in range(count):
            self.send(b"\t")

    def select_next(self, count: int = 1) -> None:
        for _ in range(count):
            self.send(b"\x1b[B")

    def submit(self) -> None:
        self.send(b"\x13")

    def tab_until_any(
        self,
        patterns: list[str],
        *,
        max_tabs: int = 16,
        timeout_seconds: float = 1.5,
    ) -> str:
        text = self.text
        for pattern in patterns:
            if pattern in text:
                return pattern

        for _ in range(max_tabs):
            self.send(b"\t")
            try:
                return self.wait_for_any(patterns, timeout_seconds=timeout_seconds)
            except RuntimeError:
                continue

        raise RuntimeError(
            f"Timed out tabbing to {format_patterns(patterns)}.\nLast output:\n{self.text}"
        )

    def wait_for_exit(self, timeout_seconds: float | None = None) -> None:
        timeout = self.timeout_seconds if timeout_seconds is None else timeout_seconds
        deadline = time.monotonic() + timeout
        while time.monotonic() < deadline:
            self._drain_once()
            if self.process.poll() is not None:
                self._drain_until_idle()
                return
            time.sleep(0.1)
        raise RuntimeError(f"Timed out waiting for process exit.\nLast output:\n{self.text}")

    def assert_returncode(self, expected: int) -> None:
        actual = self.process.returncode
        if actual != expected:
            raise RuntimeError(
                f"Expected exit code {expected}, got {actual}.\nLast output:\n{self.text}"
            )

    def assert_nonzero_returncode(self) -> None:
        actual = self.process.returncode
        if actual in (None, 0):
            raise RuntimeError(
                f"Expected a non-zero exit code, got {actual}.\nLast output:\n{self.text}"
            )


def create_workspace_fixture(pkg_dir: Path, smoke_root: Path, repo_root: Path) -> Path:
    ensure_success(
        [
            "bun",
            str(pkg_dir / "bin/wp-typia.js"),
            "create",
            "smoke-workspace",
            "--template",
            "workspace",
            "--package-manager",
            "bun",
            "--no-install",
            "-y",
        ],
        smoke_root,
    )
    workspace = smoke_root / "smoke-workspace"
    workspace_node_modules = workspace / "node_modules"
    if not workspace_node_modules.exists():
        shutil.copytree(
            repo_root / "node_modules",
            workspace_node_modules,
            symlinks=True,
            dirs_exist_ok=True,
        )
    wp_typia_node_modules = workspace_node_modules / "@wp-typia"
    wp_typia_node_modules.mkdir(parents=True, exist_ok=True)
    for package_name, package_path in {
        "api-client": repo_root / "packages/wp-typia-api-client",
        "block-runtime": repo_root / "packages/wp-typia-block-runtime",
        "block-types": repo_root / "packages/wp-typia-block-types",
        "project-tools": repo_root / "packages/wp-typia-project-tools",
        "rest": repo_root / "packages/wp-typia-rest",
    }.items():
        target = wp_typia_node_modules / package_name
        if target.exists() or target.is_symlink():
            continue
        target.symlink_to(package_path, target_is_directory=True)
    ensure_success(
        [
            "bun",
            str(pkg_dir / "bin/wp-typia.js"),
            "add",
            "block",
            "counter-card",
            "--template",
            "basic",
        ],
        workspace,
    )
    return workspace


def run_create_basic_smoke(pkg_dir: Path, smoke_root: Path) -> None:
    print("Running create basic smoke...", flush=True)
    session = PtySession(
        [
            "bun",
            str(pkg_dir / "bin/wp-typia.js"),
            "create",
            "smoke-create-basic",
            "--package-manager",
            "npm",
            "--no-install",
        ],
        smoke_root,
    )
    try:
        session.wait_for("Create a wp-typia project")
        session.wait_for_any(["> Project directory *", "Project directory *"])
        session.tab_until_any(["> Template"])
        session.tab_until_any(["> Package manager"])
        session.tab_until_any(["> Namespace"])
        session.tab_until_any(["> Text domain"])
        session.tab_until_any(["> PHP prefix"])
        session.tab_until_any(["> [x] Skip dependency install", "> [ ] Skip dependency install"])
        session.tab_until_any(
            ["> [x] Use defaults without prompts", "> [ ] Use defaults without prompts"]
        )
        session.tab_until_any(["> [x] Add wp-env preset", "> [ ] Add wp-env preset"])
        session.tab_until_any(["> [x] Add test preset", "> [ ] Add test preset"])
        session.tab_until_any(["> [x] Add migration UI", "> [ ] Add migration UI"])
        session.submit()
        session.wait_for_exit()
        session.assert_returncode(0)
        if not (smoke_root / "smoke-create-basic" / "package.json").exists():
            raise RuntimeError("Expected create basic smoke to scaffold a package.json.")
    finally:
        session.close()


def run_create_persistence_smoke(pkg_dir: Path, smoke_root: Path) -> None:
    print("Running create persistence smoke...", flush=True)
    session = PtySession(
        [
            "bun",
            str(pkg_dir / "bin/wp-typia.js"),
            "create",
            "smoke-create-persistence",
            "--template",
            "persistence",
            "--package-manager",
            "npm",
            "--no-install",
            "--data-storage",
            "custom-table",
            "--persistence-policy",
            "authenticated",
        ],
        smoke_root,
    )
    try:
        session.wait_for("Create a wp-typia project")
        session.wait_for_any(["> Project directory *", "Project directory *"])
        session.tab_until_any(["> Template"])
        session.tab_until_any(["> Package manager"])
        session.tab_until_any(["> Namespace"])
        session.tab_until_any(["> Text domain"])
        session.tab_until_any(["> PHP prefix"])
        session.tab_until_any(["> Data storage"])
        session.tab_until_any(["> Persistence policy"])
        session.tab_until_any(["> [x] Skip dependency install", "> [ ] Skip dependency install"])
        session.tab_until_any(
            ["> [x] Use defaults without prompts", "> [ ] Use defaults without prompts"]
        )
        session.tab_until_any(["> [x] Add wp-env preset", "> [ ] Add wp-env preset"])
        session.tab_until_any(["> [x] Add test preset", "> [ ] Add test preset"])
        session.tab_until_any(["> [x] Add migration UI", "> [ ] Add migration UI"])
        session.send("q")
        session.wait_for_exit()
        session.assert_returncode(0)
        if (smoke_root / "smoke-create-persistence").exists():
            raise RuntimeError("Expected create persistence cancel smoke to avoid scaffolding.")
    finally:
        session.close()


def run_add_variation_smoke(pkg_dir: Path, workspace: Path) -> None:
    print("Running add variation smoke...", flush=True)
    session = PtySession(
        ["bun", str(pkg_dir / "bin/wp-typia.js"), "add", "variation"],
        workspace,
    )
    try:
        session.wait_for("Extend a wp-typia workspace")
        session.tab_until_any(["> Variation name"])
        session.send("hero-card")
        session.tab_until_any(["> Target block"])
        session.submit()
        session.wait_for_exit()
        session.assert_returncode(0)
        ensure_text_in_tree(workspace, "hero-card")
    finally:
        session.close()


def run_add_hooked_block_smoke(pkg_dir: Path, workspace: Path) -> None:
    print("Running add hooked-block smoke...", flush=True)
    session = PtySession(
        ["bun", str(pkg_dir / "bin/wp-typia.js"), "add", "hooked-block"],
        workspace,
    )
    try:
        session.wait_for("Extend a wp-typia workspace")
        session.tab_until_any(["> Target block"])
        session.tab_until_any(["> Anchor block name"])
        session.send("core/post-content")
        session.tab_until_any(["> Hook position"])
        session.submit()
        session.wait_for_exit()
        session.assert_returncode(0)
        ensure_text_in_tree(workspace, "blockHooks")
        ensure_text_in_tree(workspace, "core/post-content")
    finally:
        session.close()


def run_migrate_fixtures_smoke(pkg_dir: Path, workspace: Path) -> None:
    print("Running migrate fixtures smoke...", flush=True)
    session = PtySession(
        ["bun", str(pkg_dir / "bin/wp-typia.js"), "migrate", "fixtures"],
        workspace,
    )
    try:
        session.wait_for("Run wp-typia migration workflows")
        session.tab_until_any(["> From migration version"])
        session.send("v1")
        session.tab_until_any(["> To migration version"])
        session.tab_until_any(
            ["> [x] All configured migration versions", "> [ ] All configured migration versions"]
        )
        session.send(" ")
        session.tab_until_any(["> [x] Force overwrite", "> [ ] Force overwrite"])
        session.send(" ")
        session.submit()
        session.wait_for_exit()
        session.assert_returncode(0)
    finally:
        session.close()


def run_bunli_diagnostic_smoke(pkg_dir: Path, repo_root: Path) -> None:
    print("Running Bunli diagnostic smoke...", flush=True)
    session = PtySession(
        ["bun", str(pkg_dir / "tests/fixtures/bunli-diagnostic-cli.tsx"), "diagnostic"],
        repo_root,
    )
    try:
        session.wait_for("Bunli diagnostic fixture")
        session.wait_for_any(["> Mode", "Mode"])
        session.select_next()
        session.wait_for_any(["Target", "─Target"])
        session.wait_for_any(["Toggle advanced", "Toggle─advanced", "[a]gToggle", "Toggle"])
        session.tab_until_any(
            [
                "> [x] Toggle advanced",
                "> [ ] Toggle advanced",
                "> [x]Toggleadvanced",
                "> [ ]Toggleadvanced",
                "> Toggle advanced",
                "> Toggle",
            ]
        )
        session.send(" ")
        session._drain_until_idle()
    finally:
        session.close()


def main() -> int:
    repo_root = Path(__file__).resolve().parents[3]
    pkg_dir = Path(__file__).resolve().parents[1]

    subprocess.run(["bun", "run", "generate"], cwd=pkg_dir, check=True, stdout=subprocess.DEVNULL)

    smoke_root = Path(tempfile.mkdtemp(prefix="wp-typia-tui-smoke-"))

    try:
        print("Preparing workspace fixture...", flush=True)
        workspace = create_workspace_fixture(pkg_dir, smoke_root, repo_root)
        run_create_basic_smoke(pkg_dir, smoke_root)
        run_create_persistence_smoke(pkg_dir, smoke_root)
        run_add_variation_smoke(pkg_dir, workspace)
        run_add_hooked_block_smoke(pkg_dir, workspace)
        run_migrate_fixtures_smoke(pkg_dir, workspace)
        run_bunli_diagnostic_smoke(pkg_dir, repo_root)
        return 0
    finally:
        shutil.rmtree(smoke_root, ignore_errors=True)


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except subprocess.CalledProcessError as error:
        print(f"Smoke fixture setup failed: {error}", file=sys.stderr)
        raise
    except RuntimeError as error:
        print(str(error), file=sys.stderr)
        raise SystemExit(1)
