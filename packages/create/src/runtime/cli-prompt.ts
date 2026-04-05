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

	return {
		async text(message: string, defaultValue: string, validate?: ValidateInput): Promise<string> {
			const suffix = defaultValue ? ` (${defaultValue})` : "";
			const answer = await new Promise<string>((resolve) => {
				rl.question(`${message}${suffix}: `, resolve);
			});

			const value = String(answer).trim() || defaultValue;
			if (validate) {
				const result = validate(value);
				if (result !== true) {
					console.error(`❌ ${typeof result === "string" ? result : "Invalid input"}`);
					return this.text(message, defaultValue, validate);
				}
			}

			return value;
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
			return this.select(message, options, defaultValue);
		},
		close(): void {
			rl.close();
		},
	};
}
