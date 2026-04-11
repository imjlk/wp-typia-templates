import { useCallback } from "react";

import { useRuntime } from "@bunli/runtime/app";
import { useKeyboard } from "@bunli/tui";

type AlternateBufferKeyEvent = {
	ctrl?: boolean;
	name?: string;
};

type AlternateBufferFailureOptions = {
	context: string;
	error: unknown;
	exit: () => void;
	log?: (message: string) => void;
};

type RunAlternateBufferActionOptions = {
	action: () => Promise<void>;
	context: string;
	exit: () => void;
	log?: (message: string) => void;
};

export function describeAlternateBufferFailure(context: string, error: unknown): string {
	const message = error instanceof Error ? error.message : String(error);
	return `${context}: ${message}`;
}

export function isAlternateBufferExitKey(key: AlternateBufferKeyEvent): boolean {
	return key.name === "q" || (key.ctrl === true && key.name === "c");
}

export function reportAlternateBufferFailure({
	context,
	error,
	exit,
	log = console.error,
}: AlternateBufferFailureOptions): void {
	log(describeAlternateBufferFailure(context, error));
	exit();
}

export async function runAlternateBufferAction({
	action,
	context,
	exit,
	log = console.error,
}: RunAlternateBufferActionOptions): Promise<void> {
	try {
		await action();
		exit();
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
	const exit = options.exit ?? runtime.exit;
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

export function useAlternateBufferLifecycle(context: string): {
	handleCancel: () => void;
	handleFailure: (error: unknown) => void;
	handleSubmit: (action: () => Promise<void>) => Promise<void>;
} {
	const runtime = useRuntime();

	useAlternateBufferExitKeys({ exit: runtime.exit });

	const handleCancel = useCallback(() => {
		runtime.exit();
	}, [runtime]);

	const handleFailure = useCallback(
		(error: unknown) => {
			reportAlternateBufferFailure({
				context,
				error,
				exit: runtime.exit,
			});
		},
		[context, runtime],
	);

	const handleSubmit = useCallback(
		async (action: () => Promise<void>) => {
			await runAlternateBufferAction({
				action,
				context,
				exit: runtime.exit,
			});
		},
		[context, runtime],
	);

	return {
		handleCancel,
		handleFailure,
		handleSubmit,
	};
}
