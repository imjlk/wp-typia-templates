import readline from "node:readline";

type ValidateInput = (value: string) => boolean | string;

interface PromptOption<T extends string> {
	hint?: string;
	label: string;
	value: T;
}

/**
 * Prompt adapter used by CLI scaffold flows and migration wizard flows.
 */
export interface ReadlinePrompt {
	close(): void;
	select<T extends string>(message: string, options: PromptOption<T>[], defaultValue?: number): Promise<T>;
	text(message: string, defaultValue: string, validate?: ValidateInput): Promise<string>;
}

export interface ReadlineQuestionAdapter {
	close(): void;
	question(query: string, callback: (answer: string) => void): void;
}

/**
 * Create the default readline-backed prompt implementation for the CLI.
 *
 * @returns A prompt adapter that reads from stdin and writes to stdout.
 */
export function createReadlinePrompt(): ReadlinePrompt {
	const rl = readline.createInterface({
		input: process.stdin,
		output: process.stdout,
	});

	return createReadlinePromptWithInterface(rl);
}

/**
 * Build a prompt adapter around a supplied readline-style question interface.
 *
 * This keeps the production CLI path unchanged while letting tests validate
 * retry behavior without stubbing global stdin/stdout.
 */
export function createReadlinePromptWithInterface(
	rl: ReadlineQuestionAdapter,
): ReadlinePrompt {
	return {
		async text(message: string, defaultValue: string, validate?: ValidateInput): Promise<string> {
			const suffix = defaultValue ? ` (${defaultValue})` : "";
			while (true) {
				const answer = await new Promise<string>((resolve) => {
					rl.question(`${message}${suffix}: `, resolve);
				});

				const value = String(answer).trim() || defaultValue;
				if (validate) {
					const result = validate(value);
					if (result !== true) {
						console.error(`❌ ${typeof result === "string" ? result : "Invalid input"}`);
						continue;
					}
				}

				return value;
			}
		},
		async select<T extends string>(
			message: string,
			options: PromptOption<T>[],
			defaultValue = 1,
		): Promise<T> {
			if (options.length === 0) {
				throw new Error(`select() requires at least one option for prompt: ${message}`);
			}

			console.log(message);
			options.forEach((option, index) => {
				const hint = option.hint ? ` - ${option.hint}` : "";
				console.log(`  ${index + 1}. ${option.label}${hint}`);
			});

			while (true) {
				const answer = await this.text("Choice", String(defaultValue));
				const numericChoice = Number(answer);
				if (!Number.isNaN(numericChoice) && options[numericChoice - 1]) {
					return options[numericChoice - 1].value;
				}

				const directChoice = options.find((option) => option.value === answer);
				if (directChoice) {
					return directChoice.value;
				}

				console.error(`❌ Invalid selection: ${answer}`);
			}
		},
		close(): void {
			rl.close();
		},
	};
}
