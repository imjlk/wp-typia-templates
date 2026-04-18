import { describe, expect, test } from "bun:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import {
	createCliCommandError,
	formatCliDiagnosticError,
	formatDoctorSummaryLine,
} from "@wp-typia/project-tools/cli-diagnostics";

import { addCommand } from "../src/commands/add";
import { createCommand } from "../src/commands/create";
import { migrateCommand } from "../src/commands/migrate";
import {
	isAlternateBufferCompletionKey,
	describeAlternateBufferFailure,
	isAlternateBufferExitKey,
	reportAlternateBufferFailure,
	resolveLazyFlowComponent,
	runAlternateBufferAction,
} from "../src/ui/alternate-buffer-lifecycle";
import {
	FirstPartyCompletionViewport,
	FirstPartyFormViewport,
} from "../src/ui/first-party-form";

function renderStaticMarkupSilently(element: ReturnType<typeof createElement>): string {
	const originalError = console.error;
	console.error = () => {};

	try {
		return renderToStaticMarkup(element);
	} finally {
		console.error = originalError;
	}
}

describe("alternate-buffer TUI lifecycle", () => {
	test("matches the shared quit keys", () => {
		expect(isAlternateBufferExitKey({ name: "q" })).toBe(true);
		expect(isAlternateBufferExitKey({ ctrl: true, name: "c" })).toBe(true);
		expect(isAlternateBufferExitKey({ name: "escape" })).toBe(false);
		expect(isAlternateBufferExitKey({ ctrl: true, name: "x" })).toBe(false);
	});

	test("matches the completion confirmation keys", () => {
		expect(isAlternateBufferCompletionKey({ name: "enter" })).toBe(true);
		expect(isAlternateBufferCompletionKey({ sequence: "\r" })).toBe(true);
		expect(isAlternateBufferCompletionKey({ sequence: "\n" })).toBe(true);
		expect(isAlternateBufferCompletionKey({ name: "space" })).toBe(false);
	});

	test("describes failures with context", () => {
		expect(describeAlternateBufferFailure("wp-typia create failed", new Error("boom"))).toBe(
			"wp-typia create failed: boom",
		);
		expect(describeAlternateBufferFailure("wp-typia add failed", "plain")).toBe(
			"wp-typia add failed: plain",
		);
	});

	test("keeps alternate-buffer failures compact while non-interactive CLI failures expand into shared diagnostics", () => {
		expect(describeAlternateBufferFailure("wp-typia create failed", new Error("boom"))).toBe(
			"wp-typia create failed: boom",
		);

		expect(
			formatCliDiagnosticError(
				createCliCommandError({
					command: "create",
					error: new Error("boom"),
				}),
			),
		).toBe(
			[
				"wp-typia create failed",
				"Summary: Unable to complete the requested create workflow.",
				"Details:",
				"- boom",
			].join("\n"),
		);
	});

	test("wraps shared CLI diagnostic blocks in narrow terminals", () => {
		const originalColumns = process.env.COLUMNS;
		process.env.COLUMNS = "48";

		try {
			expect(
				formatCliDiagnosticError(
					createCliCommandError({
						command: "create",
						detailLines: [
							"Run `wp-typia create demo-block --template workspace` from a writable directory and retry the scaffold flow.",
						],
						summary:
							"Unable to complete the requested create workflow because the target directory already exists.",
					}),
				),
			).toBe(
				[
					"wp-typia create failed",
					"Summary: Unable to complete the requested create",
					"  workflow because the target directory already",
					"  exists.",
					"Details:",
					"- Run `wp-typia create demo-block --template",
					"  workspace` from a writable directory and retry",
					"  the scaffold flow.",
				].join("\n"),
			);
		} finally {
			if (originalColumns === undefined) {
				delete process.env.COLUMNS;
			} else {
				process.env.COLUMNS = originalColumns;
			}
		}
	});

	test("keeps doctor summaries within very narrow terminal widths", () => {
		const originalColumns = process.env.COLUMNS;
		process.env.COLUMNS = "32";

		try {
			expect(
				formatDoctorSummaryLine([
					{ detail: "ready", label: "Doctor scope", status: "pass" as const },
					{ detail: "ready", label: "Bun", status: "pass" as const },
				]),
			).toBe(
				[
					"PASS wp-typia doctor summary:",
					"  2/2 checks passed",
				].join("\n"),
			);
		} finally {
			if (originalColumns === undefined) {
				delete process.env.COLUMNS;
			} else {
				process.env.COLUMNS = originalColumns;
			}
		}
	});

	test("reports failures and exits immediately", () => {
		const messages: string[] = [];
		const events: string[] = [];
		let exited = 0;

		reportAlternateBufferFailure({
			context: "wp-typia migrate failed",
			error: new Error("bad state"),
			exit: () => {
				events.push("exit");
				exited += 1;
			},
			log: (message) => {
				events.push("log");
				messages.push(message);
			},
		});

		expect(messages).toEqual(["wp-typia migrate failed: bad state"]);
		expect(events).toEqual(["exit", "log"]);
		expect(exited).toBe(1);
	});

	test("run helper exits after success", async () => {
		const messages: string[] = [];
		let exited = 0;
		let ran = false;

		await runAlternateBufferAction({
			action: async () => {
				ran = true;
			},
			context: "wp-typia create failed",
			exit: () => {
				exited += 1;
			},
			log: (message) => {
				messages.push(message);
			},
		});

		expect(ran).toBe(true);
		expect(messages).toEqual([]);
		expect(exited).toBe(1);
	});

	test("run helper can defer exit while completion state takes over", async () => {
		const completion = {
			nextSteps: ["cd demo", "npm install"],
			title: "✅ Created Demo Block",
		};
		let exited = 0;
		let received: unknown;

		await runAlternateBufferAction({
			action: async () => completion,
			context: "wp-typia create failed",
			exit: () => {
				exited += 1;
			},
			exitOnSuccess: false,
			onSuccess: (result) => {
				received = result;
			},
		});

		expect(received).toEqual(completion);
		expect(exited).toBe(0);
	});

	test("run helper reports failure and exits", async () => {
		const messages: string[] = [];
		let exited = 0;

		await runAlternateBufferAction({
			action: async () => {
				throw new Error("command exploded");
			},
			context: "wp-typia add failed",
			exit: () => {
				exited += 1;
			},
			log: (message) => {
				messages.push(message);
			},
		});

		expect(messages).toEqual(["wp-typia add failed: command exploded"]);
		expect(exited).toBe(1);
	});

	test("lazy-flow loader resolves the component when still mounted", async () => {
		let loaded = false;
		let failed = false;

		await resolveLazyFlowComponent({
			isDisposed: () => false,
			loader: async () => ({
				default: () => null,
			}),
			onFailure: () => {
				failed = true;
			},
			onLoaded: () => {
				loaded = true;
			},
		});

		expect(loaded).toBe(true);
		expect(failed).toBe(false);
	});

	test("lazy-flow loader reports failures while mounted", async () => {
		let loaded = false;
		let failure: unknown;

		await resolveLazyFlowComponent({
			isDisposed: () => false,
			loader: async () => {
				throw new Error("lazy import failed");
			},
			onFailure: (error) => {
				failure = error;
			},
			onLoaded: () => {
				loaded = true;
			},
		});

		expect(loaded).toBe(false);
		expect(failure).toBeInstanceOf(Error);
		expect((failure as Error).message).toBe("lazy import failed");
	});

	test("lazy-flow loader stays silent after disposal", async () => {
		let loaded = false;
		let failed = false;

		await resolveLazyFlowComponent({
			isDisposed: () => true,
			loader: async () => {
				throw new Error("lazy import failed");
			},
			onFailure: () => {
				failed = true;
			},
			onLoaded: () => {
				loaded = true;
			},
		});

		expect(loaded).toBe(false);
		expect(failed).toBe(false);
	});

	test("interactive commands keep alternate-buffer rendering enabled", () => {
		expect(createCommand.tui?.renderer?.bufferMode).toBe("alternate");
		expect(addCommand.tui?.renderer?.bufferMode).toBe("alternate");
		expect(migrateCommand.tui?.renderer?.bufferMode).toBe("alternate");
		expect(typeof createCommand.render).toBe("function");
		expect(typeof addCommand.render).toBe("function");
		expect(typeof migrateCommand.render).toBe("function");
	});

	test("shared first-party submit surface replaces stale create fields while submitting", () => {
		const rendered = renderStaticMarkupSilently(
			createElement(
				FirstPartyFormViewport,
				{
					isSubmitting: true,
					scrollTop: 2,
					submittingDescription: "Preparing your wp-typia project files...",
					submittingTitle: "Creating project...",
					viewportHeight: 8,
				},
				createElement("text", { content: "Project directory" }),
				createElement("text", { content: "Template" }),
				createElement("text", { content: "Package manager" }),
			),
		);

		expect(rendered).toContain('data-form-surface="submitting"');
		expect(rendered).toContain("Creating project...");
		expect(rendered).toContain("Preparing your wp-typia project files...");
		expect(rendered).not.toContain("<scrollbox");
		expect(rendered).not.toContain("Project directory");
		expect(rendered).not.toContain("Template");
		expect(rendered).not.toContain("Package manager");
	});

	test("shared first-party submit surface keeps the scrollbox body when idle", () => {
		const rendered = renderStaticMarkupSilently(
			createElement(
				FirstPartyFormViewport,
				{
					isSubmitting: false,
					scrollTop: 4,
					submittingTitle: "Creating project...",
					viewportHeight: 8,
				},
				createElement("text", { content: "Project directory" }),
			),
		);

		expect(rendered).toContain("<scrollbox");
		expect(rendered).toContain("Project directory");
		expect(rendered).not.toContain('data-form-surface="submitting"');
	});

	test("shared first-party completion surface renders next steps and close hints", () => {
		const rendered = renderStaticMarkupSilently(
			createElement(FirstPartyCompletionViewport, {
				completion: {
					nextSteps: ["cd demo-block", "npm install", "npm run dev"],
					optionalLines: ["npm run sync"],
					optionalNote: "Review the generated metadata before first commit.",
					optionalTitle: "Optional before first commit:",
					preambleLines: ["Template variant: hero"],
					summaryLines: ["Project directory: /tmp/demo-block"],
					title: "✅ Created Demo Block in /tmp/demo-block",
					warningLines: ["This template enables optional migration UI."],
				},
				viewportHeight: 10,
			}),
		);

		expect(rendered).toContain('data-form-surface="completed"');
		expect(rendered).toContain("✅ Created Demo Block in /tmp/demo-block");
		expect(rendered).toContain("Next steps:");
		expect(rendered).toContain("cd demo-block");
		expect(rendered).toContain("Optional before first commit:");
		expect(rendered).toContain("Review the generated metadata before first commit.");
		expect(rendered).toContain("PgUp/PgDn");
		expect(rendered).toContain("Home/End");
		expect(rendered).toContain("Enter: close | q: exit | Ctrl+C: quit");
	});
});
