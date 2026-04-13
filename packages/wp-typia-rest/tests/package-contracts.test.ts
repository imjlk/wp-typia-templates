import { readFileSync } from "node:fs";
import { describe, expect, test } from "bun:test";

describe("@wp-typia/rest export contracts", () => {
	test("publishes distinct decoder and react subpaths while keeping ./client as a compatibility alias", async () => {
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
			default: "./dist/http.js",
			import: "./dist/http.js",
			types: "./dist/http.d.ts",
		});
		expect(packageJson.exports?.["./react"]).toEqual({
			default: "./dist/react.js",
			import: "./dist/react.js",
			types: "./dist/react.d.ts",
		});

		const importRestClient = new Function(
			'return import("@wp-typia/rest/client");',
		) as () => Promise<Record<string, unknown>>;
		const [restRoot, restClient, restHttp, restReact] = await Promise.all([
			import("@wp-typia/rest"),
			importRestClient(),
			import("@wp-typia/rest/http"),
			import("@wp-typia/rest/react"),
		]);

		expect(typeof restRoot.callEndpoint).toBe("function");
		expect(typeof restRoot.createHeadersDecoder).toBe("function");
		expect(typeof restClient.callEndpoint).toBe("function");
		expect(typeof restClient.createHeadersDecoder).toBe("function");
		expect(typeof restHttp.createHeadersDecoder).toBe("function");
		expect("callEndpoint" in restHttp).toBe(false);
		expect(typeof restReact.useEndpointQuery).toBe("function");
		expect("callEndpoint" in restReact).toBe(false);
	});
});
