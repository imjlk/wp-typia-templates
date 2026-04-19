import { describe, expect, test } from "bun:test";
import {
	createReadlinePromptWithInterface,
} from "../src/runtime/cli-prompt.js";

function createStubInterface(answers: string[]) {
	const prompts: string[] = [];
	let closed = 0;

	return {
		adapter: {
			close() {
				closed += 1;
			},
			question(prompt: string, resolve: (answer: string) => void) {
				prompts.push(prompt);
				resolve(answers.shift() ?? "");
			},
		},
		get closeCalls() {
			return closed;
		},
		get prompts() {
			return prompts;
		},
	};
}

describe("@wp-typia/project-tools cli prompt", () => {
	test("text retries iteratively until validation passes", async () => {
		const stub = createStubInterface(["a", "valid-name"]);
		const errors: string[] = [];
		const originalError = console.error;
		console.error = (...args: unknown[]) => {
			errors.push(args.join(" "));
		};

		try {
			const prompt = createReadlinePromptWithInterface(stub.adapter);
			const value = await prompt.text(
				"Project name",
				"demo",
				(current) => current.length >= 4 || "Too short",
			);
			prompt.close();

			expect(value).toBe("valid-name");
			expect(stub.prompts).toEqual([
				"Project name [default: demo]: ",
				"Project name [default: demo]: ",
			]);
			expect(errors).toEqual(["❌ Project name: Too short. Press Enter to keep \"demo\"."]);
			expect(stub.closeCalls).toBe(1);
		} finally {
			console.error = originalError;
		}
	});

	test("select retries iteratively until a valid choice is provided", async () => {
		const stub = createStubInterface(["9", "persistence"]);
		const errors: string[] = [];
		const logs: string[] = [];
		const originalError = console.error;
		const originalLog = console.log;
		console.error = (...args: unknown[]) => {
			errors.push(args.join(" "));
		};
		console.log = (...args: unknown[]) => {
			logs.push(args.join(" "));
		};

		try {
			const prompt = createReadlinePromptWithInterface(stub.adapter);
			const value = await prompt.select("Template", [
				{ label: "Basic", value: "basic" },
				{ label: "Persistence", value: "persistence" },
			]);
			prompt.close();

			expect(value).toBe("persistence");
			expect(stub.prompts).toEqual([
				"Choice [default: 1, ? for options]: ",
				"Choice [default: 1, ? for options]: ",
			]);
			expect(logs).toEqual([
				"Template",
				"  Enter a number, option label, or option value. Press Enter to keep the default, or type ? to list choices again.",
				"  1. Basic (default)",
				"  2. Persistence",
			]);
			expect(errors).toEqual([
				"❌ Invalid selection: 9. Enter 1-2, one of: basic, persistence, or press Enter for \"Basic\".",
			]);
			expect(stub.closeCalls).toBe(1);
		} finally {
			console.error = originalError;
			console.log = originalLog;
		}
	});

	test("select accepts help tokens and case-insensitive labels", async () => {
		const stub = createStubInterface(["?", "help", "list", "storage persistence"]);
		const logs: string[] = [];
		const originalLog = console.log;
		console.log = (...args: unknown[]) => {
			logs.push(args.join(" "));
		};

		try {
			const prompt = createReadlinePromptWithInterface(stub.adapter);
			const value = await prompt.select("Template", [
				{ label: "Basic", value: "basic", hint: "Starter block" },
				{ label: "Storage Persistence", value: "persistence", hint: "Storage helpers" },
			]);
			prompt.close();

			expect(value).toBe("persistence");
			expect(logs).toEqual([
				"Template",
				"  Enter a number, option label, or option value. Press Enter to keep the default, or type ? to list choices again.",
				"  1. Basic (default)",
				"     Starter block",
				"  2. Storage Persistence [persistence]",
				"     Storage helpers",
				"Template",
				"  Enter a number, option label, or option value. Press Enter to keep the default, or type ? to list choices again.",
				"  1. Basic (default)",
				"     Starter block",
				"  2. Storage Persistence [persistence]",
				"     Storage helpers",
				"Template",
				"  Enter a number, option label, or option value. Press Enter to keep the default, or type ? to list choices again.",
				"  1. Basic (default)",
				"     Starter block",
				"  2. Storage Persistence [persistence]",
				"     Storage helpers",
				"Template",
				"  Enter a number, option label, or option value. Press Enter to keep the default, or type ? to list choices again.",
				"  1. Basic (default)",
				"     Starter block",
				"  2. Storage Persistence [persistence]",
				"     Storage helpers",
			]);
		} finally {
			console.log = originalLog;
		}
	});
});
