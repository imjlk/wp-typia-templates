import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const sourceRoot = resolve(import.meta.dir, "..", "src");

test("metadata-core keeps artifact sync and endpoint-client helpers in dedicated modules", () => {
	const metadataCoreSource = readFileSync(
		resolve(sourceRoot, "metadata-core.ts"),
		"utf8",
	);
	const artifactHelperSource = readFileSync(
		resolve(sourceRoot, "metadata-core-artifacts.ts"),
		"utf8",
	);
	const endpointClientHelperSource = readFileSync(
		resolve(sourceRoot, "metadata-core-endpoint-client.ts"),
		"utf8",
	);

	expect(metadataCoreSource).toContain('from \'./metadata-core-artifacts.js\'');
	expect(metadataCoreSource).toContain('from \'./metadata-core-endpoint-client.js\'');
	expect(metadataCoreSource).not.toContain("function reconcileGeneratedArtifacts(");
	expect(metadataCoreSource).not.toContain("function resolveSyncBlockMetadataPaths(");
	expect(metadataCoreSource).not.toContain("function normalizeSyncRestOpenApiOptions(");
	expect(metadataCoreSource).not.toContain("function normalizeSyncEndpointClientOptions(");
	expect(metadataCoreSource).not.toContain("function normalizeSyncBlockMetadataFailure(");
	expect(artifactHelperSource).toContain("export function reconcileGeneratedArtifacts(");
	expect(artifactHelperSource).toContain("export function normalizeSyncBlockMetadataFailure(");
	expect(endpointClientHelperSource).toContain("export function normalizeSyncRestOpenApiOptions(");
	expect(endpointClientHelperSource).toContain("export function toValidatorAccessExpression(");
});
