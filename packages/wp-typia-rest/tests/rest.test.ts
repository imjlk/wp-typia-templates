import { describe, expect, test } from "bun:test";
import type { ApiFetch } from "@wordpress/api-fetch";

import {
	callEndpoint,
	createEndpoint,
	createHeadersDecoder,
	createParameterDecoder,
	createQueryDecoder,
	createValidatedFetch,
	resolveRestRouteUrl,
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

function asApiFetch(fn: (...args: any[]) => Promise<unknown>): ApiFetch {
	return fn as unknown as ApiFetch;
}

describe("@wp-typia/rest", () => {
	test("createValidatedFetch validates parsed responses", async () => {
		const fetcher = createValidatedFetch<{ count: number }>(
			(input: unknown) =>
				typeof input === "object" &&
				input !== null &&
				typeof (input as { count?: unknown }).count === "number"
					? success(input as { count: number })
					: failure<{ count: number }>("{ count: number }", "$.count"),
			asApiFetch(async () => ({ count: 2 }) as never),
		);

		const result = await fetcher.fetch({ path: "/demo" });

		expect(result.isValid).toBe(true);
		expect(result.data).toEqual({ count: 2 });
	});

	test("createValidatedFetch preserves the raw response for parse:false calls", async () => {
		const fetcher = createValidatedFetch<{ ok: boolean }>(
			(input: unknown) =>
				typeof input === "object" &&
				input !== null &&
				(input as { ok?: unknown }).ok === true
					? success(input as { ok: boolean })
					: failure<{ ok: boolean }>("{ ok: true }", "$.ok"),
			asApiFetch(async () =>
				new Response(JSON.stringify({ ok: true }), {
					headers: { "X-WP-TotalPages": "3" },
				}) as never),
		);

		const result = await fetcher.fetchWithResponse({
			parse: false,
			path: "/demo",
		});

		expect(result.response.headers.get("X-WP-TotalPages")).toBe("3");
		expect(result.validation.isValid).toBe(true);
		expect(result.validation.data).toEqual({ ok: true });
	});

	test("createValidatedFetch tolerates empty parse:false responses", async () => {
		const fetcher = createValidatedFetch<undefined>(
			(input: unknown) =>
				input === undefined ? success(undefined) : failure<undefined>("undefined"),
			asApiFetch(async () => new Response(null, { status: 204 }) as never),
		);

		const result = await fetcher.fetchWithResponse({
			parse: false,
			path: "/demo",
		});

		expect(result.response.status).toBe(204);
		expect(result.validation.isValid).toBe(true);
		expect(result.validation.data).toBeUndefined();
	});

	test("callEndpoint validates GET requests and appends query parameters", async () => {
		let seenPath = "";
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
					: toValidationResult(
							failure<{ items: number[] }>("{ items: number[] }", "$.items"),
						),
		});

		const result = await callEndpoint(
			endpoint,
			{ page: 2 },
			{
				fetchFn: asApiFetch(async (options: Record<string, unknown>) => {
					seenPath = String(options.path);
					return { items: [1, 2, 3] } as never;
				}),
			},
		);

		expect(seenPath).toBe("/items?page=2");
		expect(result.isValid).toBe(true);
		expect(result.data).toEqual({ items: [1, 2, 3] });
	});

	test("callEndpoint stringifies JSON bodies for non-GET endpoints", async () => {
		let seenBody = "";
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

		const result = await callEndpoint(
			endpoint,
			{ title: "Hello" },
			{
				fetchFn: asApiFetch(async (options: Record<string, unknown>) => {
					seenBody = String(options.body);
					return { ok: true } as never;
				}),
			},
		);

		expect(seenBody).toContain("\"title\":\"Hello\"");
		expect(result.isValid).toBe(true);
		expect(result.data).toEqual({ ok: true });
	});

	test("callEndpoint merges request-level headers", async () => {
		let seenHeaders: Record<string, unknown> | undefined;
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

		await callEndpoint(
			endpoint,
			{ title: "Hello" },
			{
				fetchFn: asApiFetch(async (options: Record<string, unknown>) => {
					seenHeaders = options.headers as Record<string, unknown> | undefined;
					return { ok: true } as never;
				}),
				requestOptions: {
					headers: {
						"X-WP-Nonce": "demo",
					},
				},
			},
		);

		expect(seenHeaders).toMatchObject({
			"Content-Type": "application/json",
			"X-WP-Nonce": "demo",
		});
	});

	test("callEndpoint preserves buildRequestOptions url for non-GET endpoints", async () => {
		let seenUrl = "";
		let seenPath: unknown;
		const endpoint = createEndpoint<{ title: string }, { ok: boolean }>({
			buildRequestOptions: () => ({
				url: "http://localhost:8889/wp-json/demo/v1/items/",
			}),
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

		await callEndpoint(
			endpoint,
			{ title: "Hello" },
			{
				fetchFn: asApiFetch(async (options: Record<string, unknown>) => {
					seenUrl = String(options.url);
					seenPath = options.path;
					return { ok: true } as never;
				}),
			},
		);

		expect(seenUrl).toBe("http://localhost:8889/wp-json/demo/v1/items/");
		expect(seenPath).toBeUndefined();
	});

	test("resolveRestRouteUrl canonicalizes wp-json roots and route slashes", () => {
		const resolved = resolveRestRouteUrl("/demo/v1/items", "http://localhost:8889/wp-json/");

		expect(resolved).toBe("http://localhost:8889/wp-json/demo/v1/items/");
	});

	test("resolveRestRouteUrl preserves query strings while canonicalizing routes", () => {
		const resolved = resolveRestRouteUrl("/demo/v1/items?page=2", "http://localhost:8889/wp-json/");

		expect(resolved).toBe("http://localhost:8889/wp-json/demo/v1/items/?page=2");
	});

	test("resolveRestRouteUrl preserves rest_route roots", () => {
		const resolved = resolveRestRouteUrl("/demo/v1/items", "http://localhost:8889/index.php?rest_route=/");

		expect(resolved).toBe("http://localhost:8889/index.php?rest_route=%2Fdemo%2Fv1%2Fitems%2F");
	});

	test("createQueryDecoder and createHeadersDecoder accept explicit validation decoders", () => {
		const decodeQuery = createQueryDecoder<{ page: number; search?: string }>((input: string | URLSearchParams) => {
			const params = typeof input === "string" ? new URLSearchParams(input) : input;
			const page = Number(params.get("page") ?? "0");
			const search = params.get("search") ?? undefined;
			return Number.isFinite(page)
				? success({ page, ...(search ? { search } : {}) })
				: failure<{ page: number; search?: string }>("{ page: number }", "$.page");
		});
		const decodeHeaders = createHeadersDecoder<{ authorization: string }>((headers: Record<string, string | string[] | undefined>) =>
			typeof headers.authorization === "string"
				? success({ authorization: headers.authorization })
				: failure<{ authorization: string }>("{ authorization: string }", "$.authorization"),
		);

		const queryResult = decodeQuery("page=2&search=blocks");
		const headerResult = decodeHeaders(
			new Headers({
				authorization: "Bearer demo",
			}),
		);

		expect(queryResult.isValid).toBe(true);
		expect(queryResult.data).toEqual({
			page: 2,
			search: "blocks",
		});
		expect(headerResult.isValid).toBe(true);
		expect(headerResult.data).toEqual({
			authorization: "Bearer demo",
		});
	});

	test("createParameterDecoder decodes primitive values", () => {
		const decode = createParameterDecoder<string | number | boolean | bigint | null>();

		expect(decode("true")).toBe(true);
		expect(decode("42")).toBe(42);
		expect(decode("9007199254740993")).toBe(BigInt("9007199254740993"));
		expect(decode("null")).toBeNull();
		expect(decode("slug-value")).toBe("slug-value");
	});
});
