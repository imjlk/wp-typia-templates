import type {
	EndpointManifestDefinition,
	EndpointManifestEndpointDefinition,
} from "../runtime/metadata-core.js";

export interface TypiaLlmEndpointMethodDescriptor {
	authMode: EndpointManifestEndpointDefinition["authMode"];
	description?: string;
	inputTypeName: string | null;
	method: EndpointManifestEndpointDefinition["method"];
	operationId: string;
	outputTypeName: string;
	path: string;
	tags: readonly string[];
}

export interface RenderTypiaLlmModuleOptions {
	applicationExportName: string;
	interfaceName: string;
	manifest: EndpointManifestDefinition;
	structuredOutputExportName: string;
	structuredOutputTypeName: string;
	typesImportPath: string;
}

function getEndpointInputTypeName(
	manifest: EndpointManifestDefinition,
	endpoint: EndpointManifestEndpointDefinition,
): string | null {
	const contractName =
		endpoint.method === "GET" ? endpoint.queryContract ?? null : endpoint.bodyContract ?? null;

	if (!contractName) {
		return null;
	}

	const contract = manifest.contracts[contractName];
	if (!contract) {
		throw new Error(
			`Endpoint "${endpoint.operationId}" references missing input contract "${contractName}".`,
		);
	}

	return contract.sourceTypeName;
}

function getEndpointOutputTypeName(
	manifest: EndpointManifestDefinition,
	endpoint: EndpointManifestEndpointDefinition,
): string {
	const contract = manifest.contracts[endpoint.responseContract];
	if (!contract) {
		throw new Error(
			`Endpoint "${endpoint.operationId}" references missing response contract "${endpoint.responseContract}".`,
		);
	}

	return contract.sourceTypeName;
}

function escapeJsDocLine(line: string): string {
	return line.replace(/\*\//g, "* /");
}

function renderMethodJsDoc(method: TypiaLlmEndpointMethodDescriptor): string {
	const lines = [
		"/**",
		` * ${escapeJsDocLine(method.description ?? method.operationId)}`,
		" *",
		` * REST path: ${method.method} ${method.path}`,
		` * Auth mode: ${method.authMode}`,
		...method.tags.map((tag) => ` * @tag ${escapeJsDocLine(tag)}`),
		" */",
	];

	return lines.join("\n");
}

function renderMethodSignature(method: TypiaLlmEndpointMethodDescriptor): string {
	const inputSignature =
		method.inputTypeName === null ? "" : `input: ${method.inputTypeName}`;

	return `${method.operationId}(${inputSignature}): ${method.outputTypeName};`;
}

export function buildTypiaLlmEndpointMethodDescriptors(
	manifest: EndpointManifestDefinition,
): TypiaLlmEndpointMethodDescriptor[] {
	return manifest.endpoints.map((endpoint) => ({
		authMode: endpoint.authMode,
		description: endpoint.summary,
		inputTypeName: getEndpointInputTypeName(manifest, endpoint),
		method: endpoint.method,
		operationId: endpoint.operationId,
		outputTypeName: getEndpointOutputTypeName(manifest, endpoint),
		path: endpoint.path,
		tags: endpoint.tags ?? [],
	}));
}

export function renderTypiaLlmModule({
	applicationExportName,
	interfaceName,
	manifest,
	structuredOutputExportName,
	structuredOutputTypeName,
	typesImportPath,
}: RenderTypiaLlmModuleOptions): string {
	const methods = buildTypiaLlmEndpointMethodDescriptors(manifest);
	const importedTypeNames = new Set<string>([structuredOutputTypeName]);

	for (const method of methods) {
		importedTypeNames.add(method.outputTypeName);
		if (method.inputTypeName) {
			importedTypeNames.add(method.inputTypeName);
		}
	}

	const imports = Array.from(importedTypeNames).sort().join(",\n\t");
	const methodBlocks = methods
		.map((method) => {
			const jsDoc = renderMethodJsDoc(method)
				.split("\n")
				.map((line) => `\t${line}`)
				.join("\n");

			return `${jsDoc}\n\t${renderMethodSignature(method)}`;
		})
		.join("\n\n");

	return `import typia from "typia";
import type {
\t${imports},
} from "${typesImportPath}";

export interface ${interfaceName} {
${methodBlocks}
}

export const ${applicationExportName} =
\ttypia.llm.application<${interfaceName}>();

export const ${structuredOutputExportName} =
\ttypia.llm.structuredOutput<${structuredOutputTypeName}>();
`;
}
