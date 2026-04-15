import { readFileSync } from "node:fs";
import { describe, expect, test } from "bun:test";

describe("@wp-typia/rest export contracts", () => {
	test("publishes focused ./client and ./http entries while keeping ./react distinct", async () => {
		const packageJson = JSON.parse(
			readFileSync(new URL("../package.json", import.meta.url), "utf8"),
		) as {
			exports?: Record<string, unknown>;
		};

		expect(packageJson.exports?.["./client"]).toEqual({
			default: "./dist/client.js",
			import: "./dist/client.js",
			types: "./dist/client.d.ts",
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

		const [restRoot, restClient, restHttp, restReact] = await Promise.all([
			import(new URL("../dist/index.js", import.meta.url).href),
			import(new URL("../dist/client.js", import.meta.url).href),
			import(new URL("../dist/http.js", import.meta.url).href),
			import(new URL("../dist/react.js", import.meta.url).href),
		]);

		expect(typeof restRoot.callEndpoint).toBe("function");
		expect(typeof restRoot.createHeadersDecoder).toBe("function");
		expect(typeof restClient.callEndpoint).toBe("function");
		expect(typeof restClient.resolveRestRouteUrl).toBe("function");
		expect(typeof restClient.RestRootResolutionError).toBe("function");
		expect("createHeadersDecoder" in restClient).toBe(false);
		expect(typeof restHttp.createHeadersDecoder).toBe("function");
		expect(typeof restHttp.createParameterDecoder).toBe("function");
		expect(typeof restHttp.toValidationResult).toBe("function");
		expect("callEndpoint" in restHttp).toBe(false);
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

	test("react source isolates generic fallback casts instead of using raw as any", () => {
		const reactSource = readFileSync(
			new URL("../src/react.ts", import.meta.url),
			"utf8",
		);

		expect(reactSource).not.toContain("as any");
		expect(reactSource).toContain("selectEndpointData");
		expect(reactSource).toContain("castEndpointValidationResult");
	});
});
