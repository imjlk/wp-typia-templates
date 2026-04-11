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
	const message = describeAlternateBufferFailure(context, error);
	exit();
	log(message);
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

export function useAlternateBufferLifecycle(
	context: string,
	options: {
		enableExitKeys?: boolean;
	} = {},
): {
	handleCancel: () => void;
	handleFailure: (error: unknown) => void;
	handleSubmit: (action: () => Promise<void>) => Promise<void>;
} {
	const runtime = useRuntime();
	const exit = useCallback(() => {
		runtime.exit();
	}, [runtime]);

	useAlternateBufferExitKeys({
		enabled: options.enableExitKeys ?? true,
		exit,
	});

	const handleCancel = useCallback(() => {
		exit();
	}, [exit]);

	const handleFailure = useCallback(
		(error: unknown) => {
			reportAlternateBufferFailure({
				context,
				error,
				exit,
			});
		},
		[context, exit],
	);

	const handleSubmit = useCallback(
		async (action: () => Promise<void>) => {
			await runAlternateBufferAction({
				action,
				context,
				exit,
			});
		},
		[context, exit],
	);

	return {
		handleCancel,
		handleFailure,
		handleSubmit,
	};
}
