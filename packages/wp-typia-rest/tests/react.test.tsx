import { afterAll, afterEach, describe, expect, test } from "bun:test";
import { Window } from "happy-dom";
import {
	createElement,
	createRoot,
	flushSync,
	renderToString,
} from "@wordpress/element";

import {
	createEndpoint,
	toValidationResult,
	type ValidationLike,
} from "../src/index";
import {
	EndpointDataProvider,
	createEndpointDataClient,
	useEndpointMutation,
	useEndpointQuery,
} from "../src/react";

function success<T>(data: T): ValidationLike<T> {
	return {
		data,
		errors: [],
		success: true,
	};
}

function failure<T>(expected: string, path = "(root)"): ValidationLike<T> {
	return {
		errors: [{ expected, path, value: undefined }],
		success: false,
	};
}

const domWindow = new Window();
const previousWindow = globalThis.window;
const previousDocument = globalThis.document;
const previousNavigator = globalThis.navigator;
const previousHTMLElement = globalThis.HTMLElement;
const previousHTMLIFrameElement = globalThis.HTMLIFrameElement;
const previousNode = globalThis.Node;
const previousEvent = globalThis.Event;
const previousMutationObserver = globalThis.MutationObserver;

globalThis.window = domWindow as unknown as typeof globalThis.window;
globalThis.document = domWindow.document as unknown as typeof globalThis.document;
globalThis.navigator = domWindow.navigator as unknown as typeof globalThis.navigator;
globalThis.HTMLElement = domWindow.HTMLElement as unknown as typeof globalThis.HTMLElement;
globalThis.HTMLIFrameElement =
	domWindow.HTMLIFrameElement as unknown as typeof globalThis.HTMLIFrameElement;
globalThis.Node = domWindow.Node as unknown as typeof globalThis.Node;
globalThis.Event = domWindow.Event as unknown as typeof globalThis.Event;
globalThis.MutationObserver =
	domWindow.MutationObserver as unknown as typeof globalThis.MutationObserver;

const activeUnmounts = new Set<() => Promise<void>>();

interface HookRenderer<T> {
	client: ReturnType<typeof createEndpointDataClient>;
	current: T;
	rerender(): Promise<void>;
	unmount(): Promise<void>;
}

async function createHookRenderer<T>(
	useValue: () => T,
	client = createEndpointDataClient(),
): Promise<HookRenderer<T>> {
	let current!: T;

	function Harness() {
		current = useValue();
		return null;
	}

	const container = document.createElement("div");
	document.body.appendChild(container);
	const root = createRoot(container);

	async function rerender() {
		flushSync(() => {
			root.render(
				createElement(
					EndpointDataProvider,
					{ client },
					createElement(Harness),
				),
			);
		});
		await flush();
	}

	async function unmount() {
		activeUnmounts.delete(unmount);
		flushSync(() => {
			root.unmount();
		});
		container.remove();
		await flush();
	}

	activeUnmounts.add(unmount);
	await rerender();

	return {
		client,
		get current() {
			return current;
		},
		rerender,
		unmount,
	};
}

async function flush() {
	await Promise.resolve();
	await Promise.resolve();
	await new Promise((resolve) => setTimeout(resolve, 0));
}

afterEach(() => {
	for (const unmount of [...activeUnmounts]) {
		void unmount();
	}
	document.body.innerHTML = "";
});

describe("@wp-typia/rest/react", () => {
	test("useEndpointQuery performs the initial fetch and reuses cached data across consumers", async () => {
		let fetchCount = 0;
		const endpoint = createEndpoint<{ page: number }, { count: number }>({
			method: "GET",
			path: "/demo/v1/items",
			validateRequest: (input: unknown) =>
				typeof input === "object" &&
				input !== null &&
				typeof (input as { page?: unknown }).page === "number"
					? toValidationResult(success(input as { page: number }))
					: toValidationResult(failure<{ page: number }>("{ page: number }", "$.page")),
			validateResponse: (input: unknown) =>
				typeof input === "object" &&
				input !== null &&
				typeof (input as { count?: unknown }).count === "number"
					? toValidationResult(success(input as { count: number }))
					: toValidationResult(failure<{ count: number }>("{ count: number }", "$.count")),
		});
		const fetchFn = (async () => {
			fetchCount += 1;
			return { count: fetchCount };
		}) as never;
		const client = createEndpointDataClient();
		const first = await createHookRenderer(
			() =>
				useEndpointQuery(endpoint, { page: 1 }, {
					fetchFn,
					staleTime: 10_000,
				}),
			client,
		);

		await flush();
		await flush();

		expect(first.current.data).toEqual({ count: 1 });
		expect(first.current.validation?.isValid).toBe(true);
		expect(fetchCount).toBe(1);

		const second = await createHookRenderer(
			() =>
				useEndpointQuery(endpoint, { page: 1 }, {
					fetchFn,
					staleTime: 10_000,
				}),
			client,
		);

		await flush();
		await flush();

		expect(second.current.data).toEqual({ count: 1 });
		expect(fetchCount).toBe(1);

		await first.unmount();
		await second.unmount();
	});

	test("useEndpointQuery throws for non-GET endpoints", () => {
		const endpoint = createEndpoint<{ title: string }, { ok: boolean }>({
			method: "POST",
			path: "/demo/v1/items",
			validateRequest: (input: unknown) =>
				typeof input === "object" &&
				input !== null &&
				typeof (input as { title?: unknown }).title === "string"
					? toValidationResult(success(input as { title: string }))
					: toValidationResult(failure<{ title: string }>("{ title: string }", "$.title")),
			validateResponse: (input: unknown) =>
				typeof input === "object" &&
				input !== null &&
				(input as { ok?: unknown }).ok === true
					? toValidationResult(success(input as { ok: boolean }))
					: toValidationResult(failure<{ ok: boolean }>("{ ok: true }", "$.ok")),
		});

		expect(() =>
			renderToString(
				createElement(() => {
					useEndpointQuery(endpoint, { title: "Hello" });
					return null;
				}),
			),
		).toThrow("useEndpointQuery only supports GET endpoints in v1.");
	});

	test("invalidate and refetch trigger fresh query execution", async () => {
		let fetchCount = 0;
		const endpoint = createEndpoint<{ page: number }, { count: number }>({
			method: "GET",
			path: "/demo/v1/items",
			validateRequest: (input: unknown) =>
				typeof input === "object" &&
				input !== null &&
				typeof (input as { page?: unknown }).page === "number"
					? toValidationResult(success(input as { page: number }))
					: toValidationResult(failure<{ page: number }>("{ page: number }", "$.page")),
			validateResponse: (input: unknown) =>
				typeof input === "object" &&
				input !== null &&
				typeof (input as { count?: unknown }).count === "number"
					? toValidationResult(success(input as { count: number }))
					: toValidationResult(failure<{ count: number }>("{ count: number }", "$.count")),
		});
		const request = { page: 1 };
		const client = createEndpointDataClient();
		const rendered = await createHookRenderer(
			() =>
				useEndpointQuery(endpoint, request, {
					fetchFn: (async () => {
						fetchCount += 1;
						return { count: fetchCount };
					}) as never,
					staleTime: 30_000,
				}),
			client,
		);

		await flush();
		await flush();
		expect(rendered.current.data).toEqual({ count: 1 });

		client.invalidate(endpoint, request);
		await flush();
		await flush();
		expect(rendered.current.data).toEqual({ count: 2 });

		await client.refetch(endpoint, request);
		await flush();
		expect(rendered.current.data).toEqual({ count: 3 });

		await rendered.unmount();
	});

	test("invalidate triggers a follow-up fetch when an older request resolves late", async () => {
		let fetchCount = 0;
		let resolveFirstFetch!: (value: { count: number }) => void;
		const endpoint = createEndpoint<{ page: number }, { count: number }>({
			method: "GET",
			path: "/demo/v1/items",
			validateRequest: (input: unknown) =>
				typeof input === "object" &&
				input !== null &&
				typeof (input as { page?: unknown }).page === "number"
					? toValidationResult(success(input as { page: number }))
					: toValidationResult(
							failure<{ page: number }>("{ page: number }", "$.page"),
						),
			validateResponse: (input: unknown) =>
				typeof input === "object" &&
				input !== null &&
				typeof (input as { count?: unknown }).count === "number"
					? toValidationResult(success(input as { count: number }))
					: toValidationResult(
							failure<{ count: number }>("{ count: number }", "$.count"),
						),
		});
		const request = { page: 1 };
		const client = createEndpointDataClient();
		const rendered = await createHookRenderer(
			() =>
				useEndpointQuery(endpoint, request, {
					fetchFn: (async () => {
						fetchCount += 1;
						if (fetchCount === 1) {
							return await new Promise<{ count: number }>((resolve) => {
								resolveFirstFetch = resolve;
							});
						}

						return { count: 2 };
					}) as never,
					staleTime: 30_000,
				}),
			client,
		);

		client.invalidate(endpoint, request);
		resolveFirstFetch({ count: 1 });

		await flush();
		await flush();

		expect(fetchCount).toBe(2);
		expect(rendered.current.data).toEqual({ count: 2 });

		await rendered.unmount();
	});

	test("useEndpointMutation invalidates matching queries after a successful mutation", async () => {
		let serverCount = 0;
		const queryEndpoint = createEndpoint<undefined, { count: number }>({
			method: "GET",
			path: "/demo/v1/count",
			validateRequest: (input: unknown) =>
				input === undefined
					? toValidationResult(success(undefined))
					: toValidationResult(failure<undefined>("undefined")),
			validateResponse: (input: unknown) =>
				typeof input === "object" &&
				input !== null &&
				typeof (input as { count?: unknown }).count === "number"
					? toValidationResult(success(input as { count: number }))
					: toValidationResult(failure<{ count: number }>("{ count: number }", "$.count")),
		});
		const mutationEndpoint = createEndpoint<{ delta: number }, { count: number }>({
			method: "POST",
			path: "/demo/v1/count",
			validateRequest: (input: unknown) =>
				typeof input === "object" &&
				input !== null &&
				typeof (input as { delta?: unknown }).delta === "number"
					? toValidationResult(success(input as { delta: number }))
					: toValidationResult(failure<{ delta: number }>("{ delta: number }", "$.delta")),
			validateResponse: (input: unknown) =>
				typeof input === "object" &&
				input !== null &&
				typeof (input as { count?: unknown }).count === "number"
					? toValidationResult(success(input as { count: number }))
					: toValidationResult(failure<{ count: number }>("{ count: number }", "$.count")),
		});
		const fetchFn = (async (options: { method?: string }) => {
			if (options.method === "GET") {
				return { count: serverCount };
			}

			serverCount += 1;
			return { count: serverCount };
		}) as never;
		const rendered = await createHookRenderer(() => ({
			mutation: useEndpointMutation(mutationEndpoint, {
				fetchFn,
				invalidate: {
					endpoint: queryEndpoint,
					request: undefined,
				},
			}),
			query: useEndpointQuery(queryEndpoint, undefined, {
				fetchFn,
				staleTime: 30_000,
			}),
		}));

		await flush();
		await flush();
		expect(rendered.current.query.data).toEqual({ count: 0 });

		await rendered.current.mutation.mutateAsync({ delta: 1 });
		await flush();
		await flush();

		expect(rendered.current.mutation.validation?.isValid).toBe(true);
		expect(rendered.current.query.data).toEqual({ count: 1 });
	});

	test("onMutate can optimistically update cached data and rollback on error", async () => {
		let rejectMutation!: (error: Error) => void;
		const queryEndpoint = createEndpoint<{ page: number }, { count: number }>({
			method: "GET",
			path: "/demo/v1/items",
			validateRequest: (input: unknown) =>
				typeof input === "object" &&
				input !== null &&
				typeof (input as { page?: unknown }).page === "number"
					? toValidationResult(success(input as { page: number }))
					: toValidationResult(failure<{ page: number }>("{ page: number }", "$.page")),
			validateResponse: (input: unknown) =>
				typeof input === "object" &&
				input !== null &&
				typeof (input as { count?: unknown }).count === "number"
					? toValidationResult(success(input as { count: number }))
					: toValidationResult(failure<{ count: number }>("{ count: number }", "$.count")),
		});
		const mutationEndpoint = createEndpoint<{ page: number }, { count: number }>({
			method: "POST",
			path: "/demo/v1/items",
			validateRequest: (input: unknown) =>
				typeof input === "object" &&
				input !== null &&
				typeof (input as { page?: unknown }).page === "number"
					? toValidationResult(success(input as { page: number }))
					: toValidationResult(failure<{ page: number }>("{ page: number }", "$.page")),
			validateResponse: (input: unknown) =>
				typeof input === "object" &&
				input !== null &&
				typeof (input as { count?: unknown }).count === "number"
					? toValidationResult(success(input as { count: number }))
					: toValidationResult(failure<{ count: number }>("{ count: number }", "$.count")),
		});
		const fetchFn = (async (options: { method?: string }) => {
			if (options.method === "GET") {
				return { count: 1 };
			}

			return await new Promise((_, reject) => {
				rejectMutation = reject as (error: Error) => void;
			});
		}) as never;
		const request = { page: 1 };
		const rendered = await createHookRenderer(() => ({
			mutation: useEndpointMutation<
				{ page: number },
				{ count: number },
				{ previous: { count: number } | undefined }
			>(mutationEndpoint, {
				fetchFn,
				onError: (_error, variables, client, context) => {
					if (context?.previous) {
						client.setData(queryEndpoint, variables, context.previous);
					}
				},
				onMutate: (variables, client) => {
					const previous = client.getData(queryEndpoint, variables);
					client.setData(queryEndpoint, variables, { count: 2 });
					return { previous };
				},
			}),
			query: useEndpointQuery(queryEndpoint, request, {
				fetchFn,
				staleTime: 30_000,
			}),
		}));

		await flush();
		await flush();
		expect(rendered.current.query.data).toEqual({ count: 1 });

		const pending = rendered.current.mutation
			.mutateAsync(request)
			.catch(() => undefined);
		await flush();
		expect(rendered.current.query.data).toEqual({ count: 2 });

		rejectMutation(new Error("boom"));
		await pending;
		await flush();

		expect(rendered.current.mutation.error).toBeInstanceOf(Error);
		expect(rendered.current.query.data).toEqual({ count: 1 });
	});

	test("query validation failures surface through validation without setting transport errors", async () => {
		const endpoint = createEndpoint<{ page: number }, { count: number }>({
			method: "GET",
			path: "/demo/v1/items",
			validateRequest: (input: unknown) =>
				typeof input === "object" &&
				input !== null &&
				typeof (input as { page?: unknown }).page === "number"
					? toValidationResult(success(input as { page: number }))
					: toValidationResult(failure<{ page: number }>("{ page: number }", "$.page")),
			validateResponse: (input: unknown) =>
				typeof input === "object" &&
				input !== null &&
				typeof (input as { count?: unknown }).count === "number"
					? toValidationResult(success(input as { count: number }))
					: toValidationResult(failure<{ count: number }>("{ count: number }", "$.count")),
		});
		const rendered = await createHookRenderer(() =>
			useEndpointQuery(endpoint, { page: 1 }, {
				fetchFn: (async () => ({ nope: true })) as never,
			}),
		);

		await flush();
		await flush();

		expect(rendered.current.error).toBeNull();
		expect(rendered.current.validation?.isValid).toBe(false);
		expect(rendered.current.validation?.errors[0]?.path).toBe("$.count");
	});

	test("transport errors surface separately from validation and resolveCallOptions reruns per execution", async () => {
		let shouldThrow = true;
		let seenNonce = "";
		const endpoint = createEndpoint<{ page: number }, { ok: boolean }>({
			method: "POST",
			path: "/demo/v1/items",
			validateRequest: (input: unknown) =>
				typeof input === "object" &&
				input !== null &&
				typeof (input as { page?: unknown }).page === "number"
					? toValidationResult(success(input as { page: number }))
					: toValidationResult(failure<{ page: number }>("{ page: number }", "$.page")),
			validateResponse: (input: unknown) =>
				typeof input === "object" &&
				input !== null &&
				(input as { ok?: unknown }).ok === true
					? toValidationResult(success(input as { ok: boolean }))
					: toValidationResult(failure<{ ok: boolean }>("{ ok: true }", "$.ok")),
		});
		let nonce = "nonce-a";
		const rendered = await createHookRenderer(() =>
			useEndpointMutation(endpoint, {
				fetchFn: (async (options: { headers?: Record<string, string> }) => {
					seenNonce = options.headers?.["x-wp-nonce"] ?? "";
					if (shouldThrow) {
						throw new Error("offline");
					}
					return { ok: true };
				}) as never,
				resolveCallOptions: () => ({
					requestOptions: {
						headers: {
							"X-WP-Nonce": nonce,
						},
					},
				}),
			}),
		);

		await rendered.current.mutateAsync({ page: 1 }).catch(() => undefined);
		await flush();

		expect(rendered.current.error).toBeInstanceOf(Error);
		expect(rendered.current.validation).toBeNull();
		expect(seenNonce).toBe("nonce-a");

		shouldThrow = false;
		nonce = "nonce-b";

		await rendered.current.mutateAsync({ page: 2 });
		await flush();

		expect(rendered.current.error).toBeNull();
		expect(rendered.current.validation?.isValid).toBe(true);
		expect(seenNonce).toBe("nonce-b");
	});
});

afterAll(() => {
	globalThis.window = previousWindow;
	globalThis.document = previousDocument;
	globalThis.navigator = previousNavigator;
	globalThis.HTMLElement = previousHTMLElement;
	globalThis.HTMLIFrameElement = previousHTMLIFrameElement;
	globalThis.Node = previousNode;
	globalThis.Event = previousEvent;
	globalThis.MutationObserver = previousMutationObserver;
});
