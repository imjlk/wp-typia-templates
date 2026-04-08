import { createElement, useEffect, useState, type ComponentType } from "react";

type LazyFlowProps<TProps> = {
	loader: () => Promise<{ default: ComponentType<TProps> }>;
	props: TProps;
};

export function LazyFlow<TProps>({ loader, props }: LazyFlowProps<TProps>) {
	const [Component, setComponent] = useState<ComponentType<TProps> | null>(null);
	const [errorMessage, setErrorMessage] = useState<string | null>(null);

	useEffect(() => {
		let disposed = false;

		void loader()
			.then((module) => {
				if (!disposed) {
					setComponent(() => module.default);
				}
			})
			.catch((error) => {
				if (!disposed) {
					setErrorMessage(error instanceof Error ? error.message : String(error));
				}
			});

		return () => {
			disposed = true;
		};
	}, [loader]);

	if (errorMessage) {
		return errorMessage;
	}

	if (!Component) {
		return null;
	}

	return createElement(Component as ComponentType<any>, props as any);
}
