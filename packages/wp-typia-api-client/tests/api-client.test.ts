import { describe, expect, test } from "bun:test";

import {
	callEndpoint,
	createEndpoint,
	createFetchTransport,
	toValidationResult,
	type ValidationLike,
} from "../src/index";

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

describe("@wp-typia/api-client", () => {
	test("createFetchTransport appends query parameters for GET requests", async () => {
		let seenUrl = "";
		const transport = createFetchTransport({
			baseUrl: "https://example.test/api/",
			fetchFn: async (input) => {
				seenUrl = String(input);
				return new Response(JSON.stringify({ items: [1, 2, 3] }));
			},
		});
		const endpoint = createEndpoint<{ page: number }, { items: number[] }>({
			method: "GET",
			path: "/items",
			validateRequest: (input: unknown) =>
				typeof input === "object" &&
				input !== null &&
				typeof (input as { page?: unknown }).page === "number"
					? toValidationResult(success(input as { page: number }))
					: toValidationResult(failure<{ page: number }>("{ page: number }", "$.page")),
			validateResponse: (input: unknown) =>
				typeof input === "object" &&
				input !== null &&
				Array.isArray((input as { items?: unknown }).items)
					? toValidationResult(success(input as { items: number[] }))
					: toValidationResult(failure<{ items: number[] }>("{ items: number[] }", "$.items")),
		});

		const result = await callEndpoint(endpoint, { page: 2 }, { transport });

		expect(seenUrl).toBe("https://example.test/api/items?page=2");
		expect(result.isValid).toBe(true);
		expect(result.data).toEqual({ items: [1, 2, 3] });
	});

	test("createFetchTransport stringifies JSON bodies for non-GET requests", async () => {
		let seenBody = "";
		let seenMethod = "";
		const transport = createFetchTransport({
			baseUrl: "https://example.test/api/",
			fetchFn: async (_input, init) => {
				seenMethod = String(init?.method);
				seenBody = String(init?.body);
				return new Response(JSON.stringify({ ok: true }));
			},
		});
		const endpoint = createEndpoint<{ title: string }, { ok: boolean }>({
			method: "POST",
			path: "/items",
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

		const result = await callEndpoint(endpoint, { title: "Hello" }, { transport });

		expect(seenMethod).toBe("POST");
		expect(seenBody).toContain("\"title\":\"Hello\"");
		expect(result.isValid).toBe(true);
		expect(result.data).toEqual({ ok: true });
	});

	test("callEndpoint returns request validation failures before transport execution", async () => {
		let transportCalled = false;
		const transport = createFetchTransport({
			baseUrl: "https://example.test/api/",
			fetchFn: async () => {
				transportCalled = true;
				return new Response(JSON.stringify({ ok: true }));
			},
		});
		const endpoint = createEndpoint<{ title: string }, { ok: boolean }>({
			method: "POST",
			path: "/items",
			validateRequest: () => toValidationResult(failure<{ title: string }>("{ title: string }", "$.title")),
			validateResponse: (input: unknown) =>
				typeof input === "object" &&
				input !== null &&
				(input as { ok?: unknown }).ok === true
					? toValidationResult(success(input as { ok: boolean }))
					: toValidationResult(failure<{ ok: boolean }>("{ ok: true }", "$.ok")),
		});

		const result = await callEndpoint(endpoint, { title: "Hello" }, { transport });

		expect(transportCalled).toBe(false);
		expect(result.isValid).toBe(false);
		expect(result.errors[0]?.path).toBe("$.title");
	});

	test("callEndpoint returns response validation failures after transport execution", async () => {
		const transport = createFetchTransport({
			baseUrl: "https://example.test/api/",
			fetchFn: async () => new Response(JSON.stringify({ ok: "nope" })),
		});
		const endpoint = createEndpoint<{ title: string }, { ok: boolean }>({
			method: "POST",
			path: "/items",
			validateRequest: (input: unknown) =>
				typeof input === "object" &&
				input !== null &&
				typeof (input as { title?: unknown }).title === "string"
					? toValidationResult(success(input as { title: string }))
					: toValidationResult(failure<{ title: string }>("{ title: string }", "$.title")),
			validateResponse: () => toValidationResult(failure<{ ok: boolean }>("{ ok: true }", "$.ok")),
		});

		const result = await callEndpoint(endpoint, { title: "Hello" }, { transport });

		expect(result.isValid).toBe(false);
		expect(result.errors[0]?.path).toBe("$.ok");
	});

	test("createFetchTransport supports parse:false for raw response access", async () => {
		const transport = createFetchTransport({
			baseUrl: "https://example.test/api/",
			fetchFn: async () =>
				new Response(JSON.stringify({ ok: true }), {
					headers: { "X-Total-Pages": "3" },
				}),
		});

		const response = await transport<Response, false>({
			parse: false,
			path: "/items",
		});

		expect(response.headers.get("X-Total-Pages")).toBe("3");
		await expect(response.text()).resolves.toBe('{"ok":true}');
	});
});
