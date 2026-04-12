import { useCallback, useState } from "react";

import { useRuntime } from "@bunli/runtime/app";
import { useKeyboard } from "@bunli/tui";

type AlternateBufferKeyEvent = {
	ctrl?: boolean;
	sequence?: string;
	name?: string;
};

export type AlternateBufferCompletionPayload = {
	title: string;
	preambleLines?: string[];
	summaryLines?: string[];
	nextSteps?: string[];
	optionalTitle?: string;
	optionalLines?: string[];
	optionalNote?: string;
	warningLines?: string[];
};

type AlternateBufferFailureOptions = {
	context: string;
	error: unknown;
	exit: () => void;
	log?: (message: string) => void;
};

type RunAlternateBufferActionOptions = {
	action: () => Promise<unknown>;
	context: string;
	exit: () => void;
	exitOnSuccess?: boolean;
	log?: (message: string) => void;
	onSuccess?: (result: unknown) => void;
};

type AlternateBufferLifecycleStatus = "editing" | "submitting" | "completed";

export function describeAlternateBufferFailure(context: string, error: unknown): string {
	const message = error instanceof Error ? error.message : String(error);
	return `${context}: ${message}`;
}

export function isAlternateBufferExitKey(key: AlternateBufferKeyEvent): boolean {
	return key.name === "q" || (key.ctrl === true && key.name === "c");
}

export function isAlternateBufferCompletionKey(key: AlternateBufferKeyEvent): boolean {
	return key.name === "enter" || key.sequence === "\r" || key.sequence === "\n";
}

export function reportAlternateBufferFailure({
	context,
	error,
	exit,
	log = console.error,
}: AlternateBufferFailureOptions): void {
	const message = describeAlternateBufferFailure(context, error);
	exit();
	log(message);
}

export async function runAlternateBufferAction({
	action,
	context,
	exit,
	exitOnSuccess = true,
	log = console.error,
	onSuccess,
}: RunAlternateBufferActionOptions): Promise<void> {
	try {
		const result = await action();
		onSuccess?.(result);
		if (exitOnSuccess) {
			exit();
		}
	} catch (error) {
		reportAlternateBufferFailure({ context, error, exit, log });
	}
}

export async function resolveLazyFlowComponent<TProps>({
	loader,
	onLoaded,
	onFailure,
	isDisposed,
}: {
	loader: () => Promise<{ default: React.ComponentType<TProps> }>;
	onLoaded: (component: React.ComponentType<TProps>) => void;
	onFailure: (error: unknown) => void;
	isDisposed: () => boolean;
}): Promise<void> {
	try {
		const module = await loader();
		if (!isDisposed()) {
			onLoaded(module.default);
		}
	} catch (error) {
		if (!isDisposed()) {
			onFailure(error);
		}
	}
}

export function useAlternateBufferExitKeys(options: {
	enabled?: boolean;
	exit?: () => void;
} = {}): void {
	const runtime = useRuntime();
	const exit = options.exit ?? (() => runtime.exit());
	const enabled = options.enabled ?? true;

	useKeyboard((key: AlternateBufferKeyEvent) => {
		if (!enabled) {
			return;
		}

		if (isAlternateBufferExitKey(key)) {
			exit();
		}
	});
}

export function useAlternateBufferCompletionKeys(options: {
	enabled?: boolean;
	exit?: () => void;
} = {}): void {
	const runtime = useRuntime();
	const exit = options.exit ?? (() => runtime.exit());
	const enabled = options.enabled ?? false;

	useKeyboard((key: AlternateBufferKeyEvent) => {
		if (!enabled) {
			return;
		}

		if (isAlternateBufferCompletionKey(key) || isAlternateBufferExitKey(key)) {
			exit();
		}
	});
}

function isAlternateBufferCompletionPayload(
	value: unknown,
): value is AlternateBufferCompletionPayload {
	if (!value || typeof value !== "object" || Array.isArray(value)) {
		return false;
	}

	const candidate = value as { title?: unknown };
	return typeof candidate.title === "string" && candidate.title.trim().length > 0;
}

export function useAlternateBufferLifecycle(
	context: string,
	options: {
		enableExitKeys?: boolean;
	} = {},
): {
	completion: AlternateBufferCompletionPayload | null;
	handleCancel: () => void;
	handleFailure: (error: unknown) => void;
	handleSubmit: (action: () => Promise<AlternateBufferCompletionPayload | void>) => Promise<void>;
	status: AlternateBufferLifecycleStatus;
} {
	const runtime = useRuntime();
	const [completion, setCompletion] = useState<AlternateBufferCompletionPayload | null>(null);
	const [status, setStatus] = useState<AlternateBufferLifecycleStatus>("editing");
	const exit = useCallback(() => {
		runtime.exit();
	}, [runtime]);

	useAlternateBufferExitKeys({
		enabled: (options.enableExitKeys ?? true) && status !== "completed",
		exit,
	});

	useAlternateBufferCompletionKeys({
		enabled: status === "completed",
		exit,
	});

	const handleCancel = useCallback(() => {
		setCompletion(null);
		setStatus("editing");
		exit();
	}, [exit]);

	const handleFailure = useCallback(
		(error: unknown) => {
			setCompletion(null);
			setStatus("editing");
			reportAlternateBufferFailure({
				context,
				error,
				exit,
			});
		},
		[context, exit],
	);

	const handleSubmit = useCallback(
		async (action: () => Promise<AlternateBufferCompletionPayload | void>) => {
			setCompletion(null);
			setStatus("submitting");

			try {
				const result = await action();
				if (isAlternateBufferCompletionPayload(result)) {
					setCompletion(result);
					setStatus("completed");
					return;
				}

				exit();
			} catch (error) {
				setCompletion(null);
				setStatus("editing");
				reportAlternateBufferFailure({
					context,
					error,
					exit,
				});
			}
		},
		[context, exit],
	);

	return {
		completion,
		handleCancel,
		handleFailure,
		handleSubmit,
		status,
	};
}
