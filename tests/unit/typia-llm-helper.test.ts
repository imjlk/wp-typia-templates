import { describe, expect, test } from "bun:test";

import { BLOCKS } from "../../examples/persistence-examples/scripts/block-config";
import {
	buildTypiaLlmEndpointMethodDescriptors,
	renderTypiaLlmModule,
} from "../../packages/create/src/internal/typia-llm";

const counterManifest = BLOCKS.find((block) => block.slug === "counter")?.restManifest;

describe("typia.llm internal helper", () => {
	test("maps endpoint manifests to tool/controller method descriptors", () => {
		expect(counterManifest).toBeDefined();

		const methods = buildTypiaLlmEndpointMethodDescriptors(counterManifest!);

		expect(methods).toEqual([
			{
				authMode: "public-read",
				description: "Read the current counter state.",
				inputTypeName: "PersistenceCounterQuery",
				method: "GET",
				operationId: "getPersistenceCounterState",
				outputTypeName: "PersistenceCounterResponse",
				path: "/persistence-examples/v1/counter",
				tags: ["Counter"],
			},
			{
				authMode: "public-signed-token",
				description: "Increment the current counter state.",
				inputTypeName: "PersistenceCounterIncrementRequest",
				method: "POST",
				operationId: "incrementPersistenceCounterState",
				outputTypeName: "PersistenceCounterResponse",
				path: "/persistence-examples/v1/counter",
				tags: ["Counter"],
			},
		]);
	});

	test("renders a deterministic typia.llm evaluation module from the manifest", () => {
		expect(counterManifest).toBeDefined();

		const source = renderTypiaLlmModule({
			applicationExportName: "counterLlmApplication",
			interfaceName: "CounterRestToolController",
			manifest: counterManifest!,
			structuredOutputExportName: "counterResponseStructuredOutput",
			structuredOutputTypeName: "PersistenceCounterResponse",
			typesImportPath: "../../../persistence-examples/src/blocks/counter/api-types",
		});

		expect(source).toContain('import typia from "typia";');
		expect(source).toContain("export interface CounterRestToolController");
		expect(source).toContain(
			"getPersistenceCounterState(input: PersistenceCounterQuery): PersistenceCounterResponse;",
		);
		expect(source).toContain(
			"incrementPersistenceCounterState(input: PersistenceCounterIncrementRequest): PersistenceCounterResponse;",
		);
		expect(source).toContain("REST path: GET /persistence-examples/v1/counter");
		expect(source).toContain("REST path: POST /persistence-examples/v1/counter");
		expect(source).toContain("@tag Counter");
		expect(source).toContain(
			"export const counterLlmApplication =\n\ttypia.llm.application<CounterRestToolController>();",
		);
		expect(source).toContain(
			"export const counterResponseStructuredOutput =\n\ttypia.llm.structuredOutput<PersistenceCounterResponse>();",
		);
	});
});
