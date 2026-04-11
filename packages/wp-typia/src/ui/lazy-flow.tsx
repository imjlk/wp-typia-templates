import { createElement, useEffect, useState, type ComponentType } from "react";

import {
	resolveLazyFlowComponent,
	useAlternateBufferExitKeys,
	useAlternateBufferLifecycle,
} from "./alternate-buffer-lifecycle";

type LazyFlowProps<TProps> = {
	loader: () => Promise<{ default: ComponentType<TProps> }>;
	props: TProps;
};

export function LazyFlow<TProps>({ loader, props }: LazyFlowProps<TProps>) {
	const [Component, setComponent] = useState<ComponentType<TProps> | null>(null);
	const { handleFailure } = useAlternateBufferLifecycle("wp-typia TUI flow failed");

	useAlternateBufferExitKeys({
		enabled: Component === null,
	});

	useEffect(() => {
		let disposed = false;

		void resolveLazyFlowComponent({
			isDisposed: () => disposed,
			loader,
			onFailure: handleFailure,
			onLoaded: (component) => {
				setComponent(() => component);
			},
		});

		return () => {
			disposed = true;
		};
	}, [handleFailure, loader]);

	if (!Component) {
		return null;
	}

	return createElement(Component as ComponentType<any>, props as any);
}
