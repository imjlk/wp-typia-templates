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
				"Project name (demo): ",
				"Project name (demo): ",
			]);
			expect(errors).toEqual(["❌ Too short"]);
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
				"Choice (1): ",
				"Choice (1): ",
			]);
			expect(logs).toEqual([
				"Template",
				"  1. Basic",
				"  2. Persistence",
			]);
			expect(errors).toEqual(["❌ Invalid selection: 9"]);
			expect(stub.closeCalls).toBe(1);
		} finally {
			console.error = originalError;
			console.log = originalLog;
		}
	});
});
