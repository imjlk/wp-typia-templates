import { readFileSync } from "node:fs";
import { describe, expect, test } from "bun:test";

describe("repository error and export contracts", () => {
	test("documents the chosen error taxonomy and runtime subpath semantics", () => {
		const readme = readFileSync(new URL("../../README.md", import.meta.url), "utf8");
		const apiGuide = readFileSync(new URL("../../docs/API.md", import.meta.url), "utf8");
		const contractGuide = readFileSync(
			new URL("../../docs/error-export-contracts.md", import.meta.url),
			"utf8",
		);
		const importPolicy = readFileSync(
			new URL("../../docs/runtime-import-policy.md", import.meta.url),
			"utf8",
		);
		const runtimeSurface = readFileSync(
			new URL("../../docs/runtime-surface.md", import.meta.url),
			"utf8",
		);

		expect(readme).toContain("Error and Export Contract Guide");
		expect(apiGuide).toContain("@wp-typia/rest/http");
		expect(apiGuide).toContain("@wp-typia/rest/client");
		expect(apiGuide).toContain("WpTypiaContractError");
		expect(contractGuide).toContain("ValidationResult<T>");
		expect(contractGuide).toContain("EndpointValidationResult<Req, Res>");
		expect(contractGuide).toContain("WpTypiaContractError");
		expect(contractGuide).toContain("ApiClientConfigurationError");
		expect(contractGuide).toContain("RestRootResolutionError");
		expect(contractGuide).toContain("@wp-typia/rest/client");
		expect(contractGuide).toContain("@wp-typia/rest/http");
		expect(importPolicy).toContain("@wp-typia/api-client");
		expect(importPolicy).toContain("@wp-typia/rest/http");
		expect(importPolicy).toContain("RestQueryHookUsageError");
		expect(runtimeSurface).toContain("@wp-typia/rest/client");
		expect(runtimeSurface).toContain("@wp-typia/api-client/runtime-primitives");
	});
});
