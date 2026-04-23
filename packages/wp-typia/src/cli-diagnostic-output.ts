import {
	createCliCommandError,
	serializeCliDiagnosticError,
	type CliDiagnosticCode,
} from "@wp-typia/project-tools/cli-diagnostics";
import {
	ADD_OPTION_METADATA,
	CREATE_OPTION_METADATA,
	GLOBAL_OPTION_METADATA,
	MIGRATE_OPTION_METADATA,
	SYNC_OPTION_METADATA,
	TEMPLATES_OPTION_METADATA,
} from "./command-option-metadata";

type CliStructuredOutputArgs = {
	agent?: unknown;
	context?: {
		store?: {
			isAIAgent?: boolean;
		};
	};
	format?: string;
	formatExplicit?: boolean;
	output: (payload: Record<string, unknown>) => void;
};

type EmitCliDiagnosticFailureOptions = {
	code?: CliDiagnosticCode;
	command: string;
	detailLines?: string[];
	error?: unknown;
	extraOutput?: Record<string, unknown>;
	summary?: string;
};

const ALL_OPTION_METADATA = {
	...GLOBAL_OPTION_METADATA,
	...CREATE_OPTION_METADATA,
	...ADD_OPTION_METADATA,
	...MIGRATE_OPTION_METADATA,
	...SYNC_OPTION_METADATA,
	...TEMPLATES_OPTION_METADATA,
} as const;

const CLI_STRING_OPTION_NAMES = new Set(
	Object.entries(ALL_OPTION_METADATA).flatMap(([name, option]) =>
			option.type === "string"
				? [
						`--${name}`,
						...("short" in option && option.short ? [`-${option.short}`] : []),
					]
				: [],
		),
);

function resolveEntrypointCliCommand(argv: string[]): string {
	for (let index = 0; index < argv.length; index += 1) {
		const arg = argv[index];
		if (!arg) {
			continue;
		}

		if (arg === "--") {
			break;
		}

		if (CLI_STRING_OPTION_NAMES.has(arg)) {
			const next = argv[index + 1];
			if (next && !next.startsWith("-")) {
				index += 1;
			}
			continue;
		}

		if (arg.startsWith("--")) {
			const [inlineName] = arg.split("=", 1);
			if (inlineName && CLI_STRING_OPTION_NAMES.has(inlineName)) {
				continue;
			}
		}

		if (arg.startsWith("-")) {
			continue;
		}

		return arg;
	}

	return "wp-typia";
}

export function prefersStructuredCliArgv(argv: string[]): boolean {
	for (let index = 0; index < argv.length; index += 1) {
		const arg = argv[index];
		if (!arg) {
			continue;
		}

		if (arg === "--") {
			return false;
		}

		if (arg === "--format") {
			return argv[index + 1] === "json";
		}

		if (arg.startsWith("--format=")) {
			return arg.slice("--format=".length) === "json";
		}
	}

	return false;
}

export function prefersStructuredCliOutput(args: CliStructuredOutputArgs): boolean {
	return (
		(args.formatExplicit && args.format !== "toon") ||
		Boolean(args.agent) ||
		Boolean(args.context?.store?.isAIAgent)
	);
}

export function emitCliDiagnosticFailure(
	args: CliStructuredOutputArgs,
	options: EmitCliDiagnosticFailureOptions,
): true | never {
	const diagnostic = createCliCommandError(options);
	if (prefersStructuredCliOutput(args)) {
		args.output({
			...(options.extraOutput ?? {}),
			error: serializeCliDiagnosticError(diagnostic),
			ok: false,
		});
		process.exitCode = 1;
		return true;
	}

	throw diagnostic;
}

export function writeStructuredCliDiagnosticError(argv: string[], error: unknown): boolean {
	if (!prefersStructuredCliArgv(argv)) {
		return false;
	}

	console.log(
		JSON.stringify(
			{
				error: serializeCliDiagnosticError(
					createCliCommandError({
						command: resolveEntrypointCliCommand(argv),
						error,
					}),
				),
				ok: false,
			},
			null,
			2,
		),
	);
	process.exitCode = 1;
	return true;
}
