import { readFileSync } from "node:fs";
import { describe, expect, test } from "bun:test";

describe("@wp-typia/rest export contracts", () => {
	test("publishes legacy root aliases for ./client and ./http while keeping ./react distinct", async () => {
		const packageJson = JSON.parse(
			readFileSync(new URL("../package.json", import.meta.url), "utf8"),
		) as {
			exports?: Record<string, unknown>;
		};

		expect(packageJson.exports?.["./client"]).toEqual({
			default: "./dist/index.js",
			import: "./dist/index.js",
			types: "./dist/index.d.ts",
		});
		expect(packageJson.exports?.["./http"]).toEqual({
			default: "./dist/index.js",
			import: "./dist/index.js",
			types: "./dist/index.d.ts",
		});
		expect(packageJson.exports?.["./react"]).toEqual({
			default: "./dist/react.js",
			import: "./dist/react.js",
			types: "./dist/react.d.ts",
		});

		const importRestClient = new Function(
			'return import("@wp-typia/rest/client");',
		) as () => Promise<Record<string, unknown>>;
		const importRestHttp = new Function(
			'return import("@wp-typia/rest/http");',
		) as () => Promise<Record<string, unknown>>;
		const [restRoot, restClient, restHttp, restReact] = await Promise.all([
			import("@wp-typia/rest"),
			importRestClient(),
			importRestHttp(),
			import("@wp-typia/rest/react"),
		]);

		expect(typeof restRoot.callEndpoint).toBe("function");
		expect(typeof restRoot.createHeadersDecoder).toBe("function");
		expect(typeof restClient.callEndpoint).toBe("function");
		expect(typeof restClient.createHeadersDecoder).toBe("function");
		expect(typeof restHttp.callEndpoint).toBe("function");
		expect(typeof restHttp.createHeadersDecoder).toBe("function");
		expect(typeof restReact.useEndpointQuery).toBe("function");
		expect("callEndpoint" in restReact).toBe(false);
	});

	test("built root entry preserves ESM-safe .js re-export specifiers", () => {
		const builtIndexJs = readFileSync(
			new URL("../dist/index.js", import.meta.url),
			"utf8",
		);
		const builtIndexDts = readFileSync(
			new URL("../dist/index.d.ts", import.meta.url),
			"utf8",
		);

		expect(builtIndexJs).toContain('from "./client.js"');
		expect(builtIndexJs).toContain('from "./errors.js"');
		expect(builtIndexJs).toContain('from "./http.js"');
		expect(builtIndexDts).toContain('from "./client.js"');
		expect(builtIndexDts).toContain('from "./errors.js"');
		expect(builtIndexDts).toContain('from "./http.js"');
	});
});
