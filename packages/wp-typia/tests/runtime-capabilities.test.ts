import { describe, expect, test } from "bun:test";

import {
	isInteractiveTerminal,
	supportsInteractiveTui,
} from "../src/runtime-capabilities";

describe("wp-typia runtime capability detection", () => {
	test("interactive terminals require TTY stdin/stdout and a non-dumb TERM", () => {
		expect(
			isInteractiveTerminal({
				stdin: { isTTY: true },
				stdout: { isTTY: true },
				term: "xterm-256color",
			}),
		).toBe(true);
		expect(
			isInteractiveTerminal({
				stdin: { isTTY: false },
				stdout: { isTTY: true },
				term: "xterm-256color",
			}),
		).toBe(false);
		expect(
			isInteractiveTerminal({
				stdin: { isTTY: true },
				stdout: { isTTY: false },
				term: "xterm-256color",
			}),
		).toBe(false);
		expect(
			isInteractiveTerminal({
				stdin: { isTTY: true },
				stdout: { isTTY: true },
				term: "dumb",
			}),
		).toBe(false);
	});

	test("interactive TUI support requires both Bun and an interactive terminal", () => {
		expect(
			supportsInteractiveTui({
				hasBunRuntime: true,
				stdin: { isTTY: true },
				stdout: { isTTY: true },
				term: "xterm-256color",
			}),
		).toBe(true);
		expect(
			supportsInteractiveTui({
				hasBunRuntime: false,
				stdin: { isTTY: true },
				stdout: { isTTY: true },
				term: "xterm-256color",
			}),
		).toBe(false);
		expect(
			supportsInteractiveTui({
				hasBunRuntime: true,
				stdin: { isTTY: false },
				stdout: { isTTY: true },
				term: "xterm-256color",
			}),
		).toBe(false);
	});
});
