import * as fs from "node:fs";
import * as path from "node:path";
import ts from "typescript";

type JsonPrimitive = string | number | boolean | null;
type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue };
type AttributeKind = "string" | "number" | "boolean" | "array" | "object" | "union";
type WordPressAttributeKind = "string" | "number" | "boolean" | "array" | "object";

interface AttributeConstraints {
	format: string | null;
	maxLength: number | null;
	maximum: number | null;
	minLength: number | null;
	minimum: number | null;
	pattern: string | null;
	typeTag: string | null;
}

interface AttributeNode {
	constraints: AttributeConstraints;
	defaultValue?: JsonValue;
	enumValues: Array<string | number | boolean> | null;
	items?: AttributeNode;
	kind: AttributeKind;
	path: string;
	properties?: Record<string, AttributeNode>;
	required: boolean;
	union?: AttributeUnion | null;
}

interface AttributeUnion {
	branches: Record<string, AttributeNode>;
	discriminator: string;
}

interface BlockJsonAttribute {
	default?: JsonValue;
	enum?: Array<string | number | boolean>;
	type: WordPressAttributeKind;
}

interface ManifestAttribute {
	typia: {
		constraints: AttributeConstraints;
		defaultValue: JsonValue | null;
		hasDefault: boolean;
	};
	ts: {
		items: ManifestAttribute | null;
		kind: AttributeKind;
		properties: Record<string, ManifestAttribute> | null;
		required: boolean;
		union: ManifestUnion | null;
	};
	wp: {
		defaultValue: JsonValue | null;
		enum: Array<string | number | boolean> | null;
		hasDefault: boolean;
		type: WordPressAttributeKind;
	};
}

interface ManifestUnion {
	branches: Record<string, ManifestAttribute>;
	discriminator: string;
}

interface ManifestDocument {
	attributes: Record<string, ManifestAttribute>;
	manifestVersion: 2;
	sourceType: string;
}

export interface SyncBlockMetadataOptions {
	blockJsonFile: string;
	manifestFile?: string;
	phpValidatorFile?: string;
	projectRoot?: string;
	sourceTypeName: string;
	typesFile: string;
}

export interface SyncBlockMetadataResult {
	attributeNames: string[];
	blockJsonPath: string;
	lossyProjectionWarnings: string[];
	manifestPath: string;
	phpGenerationWarnings: string[];
	phpValidatorPath: string;
}

interface AnalysisContext {
	allowedExternalPackages: Set<string>;
	checker: ts.TypeChecker;
	packageNameCache: Map<string, string | null>;
	projectRoot: string;
	program: ts.Program;
	recursionGuard: Set<string>;
}

const SUPPORTED_TAGS = new Set([
	"Default",
	"Format",
	"MaxLength",
	"Maximum",
	"MinLength",
	"Minimum",
	"Pattern",
	"Type",
]);

const DEFAULT_CONSTRAINTS = (): AttributeConstraints => ({
	format: null,
	maxLength: null,
	maximum: null,
	minLength: null,
	minimum: null,
	pattern: null,
	typeTag: null,
});

export async function syncBlockMetadata(
	options: SyncBlockMetadataOptions,
): Promise<SyncBlockMetadataResult> {
	const projectRoot = path.resolve(options.projectRoot ?? process.cwd());
	const typesFilePath = path.resolve(projectRoot, options.typesFile);
	const blockJsonPath = path.resolve(projectRoot, options.blockJsonFile);
	const manifestRelativePath =
		options.manifestFile ?? path.join(path.dirname(options.blockJsonFile), "typia.manifest.json");
	const manifestPath = path.resolve(
		projectRoot,
		manifestRelativePath,
	);
	const phpValidatorPath = path.resolve(
		projectRoot,
		options.phpValidatorFile ?? path.join(path.dirname(manifestRelativePath), "typia-validator.php"),
	);

	const ctx = createAnalysisContext(projectRoot, typesFilePath);
	const sourceFile = ctx.program.getSourceFile(typesFilePath);
	if (sourceFile === undefined) {
		throw new Error(`Unable to load types file: ${typesFilePath}`);
	}

	const declaration = findNamedDeclaration(sourceFile, options.sourceTypeName);
	if (declaration === undefined) {
		throw new Error(
			`Unable to find source type "${options.sourceTypeName}" in ${path.relative(projectRoot, typesFilePath)}`,
		);
	}

	const rootNode = parseNamedDeclaration(declaration, ctx, options.sourceTypeName, true);
	if (rootNode.kind !== "object" || rootNode.properties === undefined) {
		throw new Error(`Source type "${options.sourceTypeName}" must resolve to an object shape`);
	}

	const blockJson = JSON.parse(fs.readFileSync(blockJsonPath, "utf8")) as Record<string, unknown>;
	const lossyProjectionWarnings: string[] = [];

	blockJson.attributes = Object.fromEntries(
		Object.entries(rootNode.properties).map(([key, node]) => [
			key,
			createBlockJsonAttribute(node, lossyProjectionWarnings),
		]),
	);
	blockJson.example = {
		attributes: Object.fromEntries(
			Object.entries(rootNode.properties).map(([key, node]) => [key, createExampleValue(node, key)]),
		),
	};

	const manifest: ManifestDocument = {
		attributes: Object.fromEntries(
			Object.entries(rootNode.properties).map(([key, node]) => [key, createManifestAttribute(node)]),
		),
		manifestVersion: 2,
		sourceType: options.sourceTypeName,
	};

	fs.writeFileSync(blockJsonPath, JSON.stringify(blockJson, null, "\t"));
	fs.mkdirSync(path.dirname(manifestPath), { recursive: true });
	fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, "\t"));

	const phpValidator = renderPhpValidator(manifest);
	fs.mkdirSync(path.dirname(phpValidatorPath), { recursive: true });
	fs.writeFileSync(phpValidatorPath, phpValidator.source);

	return {
		attributeNames: Object.keys(rootNode.properties),
		blockJsonPath,
		lossyProjectionWarnings: [...new Set(lossyProjectionWarnings)].sort(),
		manifestPath,
		phpGenerationWarnings: [...new Set(phpValidator.warnings)].sort(),
		phpValidatorPath,
	};
}

function createAnalysisContext(projectRoot: string, typesFilePath: string): AnalysisContext {
	const configPath = ts.findConfigFile(projectRoot, ts.sys.fileExists, "tsconfig.json");
	const compilerOptions: ts.CompilerOptions = {
		allowJs: false,
		esModuleInterop: true,
		module: ts.ModuleKind.NodeNext,
		moduleResolution: ts.ModuleResolutionKind.NodeNext,
		resolveJsonModule: true,
		skipLibCheck: true,
		target: ts.ScriptTarget.ES2022,
	};

	let rootNames = [typesFilePath];

	if (configPath !== undefined) {
		const configFile = ts.readConfigFile(configPath, ts.sys.readFile);
		if (configFile.error) {
			throw formatDiagnosticError(configFile.error);
		}

		const parsed = ts.parseJsonConfigFileContent(
			configFile.config,
			ts.sys,
			path.dirname(configPath),
			compilerOptions,
			configPath,
		);

		if (parsed.errors.length > 0) {
			throw formatDiagnosticError(parsed.errors[0]);
		}

		rootNames = parsed.fileNames.includes(typesFilePath)
			? parsed.fileNames
			: [...parsed.fileNames, typesFilePath];
		Object.assign(compilerOptions, parsed.options);
	}

	const program = ts.createProgram({
		options: compilerOptions,
		rootNames,
	});
	const diagnostics = ts.getPreEmitDiagnostics(program);
	const blockingDiagnostic = diagnostics.find(
		(diagnostic) =>
			diagnostic.category === ts.DiagnosticCategory.Error &&
			diagnostic.file?.fileName === typesFilePath,
	);
	if (blockingDiagnostic) {
		throw formatDiagnosticError(blockingDiagnostic);
	}

	return {
		allowedExternalPackages: new Set(["@wp-typia/block-types"]),
		checker: program.getTypeChecker(),
		packageNameCache: new Map(),
		projectRoot,
		program,
		recursionGuard: new Set<string>(),
	};
}

function findNamedDeclaration(
	sourceFile: ts.SourceFile,
	name: string,
): ts.InterfaceDeclaration | ts.TypeAliasDeclaration | undefined {
	for (const statement of sourceFile.statements) {
		if ((ts.isInterfaceDeclaration(statement) || ts.isTypeAliasDeclaration(statement)) && statement.name.text === name) {
			return statement;
		}
	}
	return undefined;
}

function parseNamedDeclaration(
	declaration: ts.InterfaceDeclaration | ts.TypeAliasDeclaration,
	ctx: AnalysisContext,
	pathLabel: string,
	required: boolean,
): AttributeNode {
	const recursionKey = `${declaration.getSourceFile().fileName}:${declaration.name.text}`;
	if (ctx.recursionGuard.has(recursionKey)) {
		throw new Error(`Recursive types are not supported: ${pathLabel}`);
	}

	ctx.recursionGuard.add(recursionKey);
	try {
		if (ts.isInterfaceDeclaration(declaration)) {
			return parseInterfaceDeclaration(declaration, ctx, pathLabel, required);
		}
		return withRequired(parseTypeNode(declaration.type, ctx, pathLabel), required);
	} finally {
		ctx.recursionGuard.delete(recursionKey);
	}
}

function parseInterfaceDeclaration(
	declaration: ts.InterfaceDeclaration,
	ctx: AnalysisContext,
	pathLabel: string,
	required: boolean,
): AttributeNode {
	const properties: Record<string, AttributeNode> = {};

	for (const heritageClause of declaration.heritageClauses ?? []) {
		if (heritageClause.token !== ts.SyntaxKind.ExtendsKeyword) {
			continue;
		}

		for (const baseType of heritageClause.types) {
			const baseNode = parseTypeReference(baseType, ctx, `${pathLabel}<extends>`);
			if (baseNode.kind !== "object" || baseNode.properties === undefined) {
				throw new Error(`Only object-like interface extensions are supported: ${pathLabel}`);
			}
			Object.assign(properties, cloneProperties(baseNode.properties));
		}
	}

	for (const member of declaration.members) {
		if (!ts.isPropertySignature(member) || member.type === undefined) {
			throw new Error(`Unsupported member in ${pathLabel}; only typed properties are supported`);
		}

		const propertyName = getPropertyName(member.name);
		properties[propertyName] = withRequired(
			parseTypeNode(member.type, ctx, `${pathLabel}.${propertyName}`),
			member.questionToken === undefined,
		);
	}

	return {
		constraints: DEFAULT_CONSTRAINTS(),
		enumValues: null,
		kind: "object",
		path: pathLabel,
		properties,
		required,
		union: null,
	};
}

function parseTypeNode(node: ts.TypeNode, ctx: AnalysisContext, pathLabel: string): AttributeNode {
	if (ts.isParenthesizedTypeNode(node)) {
		return parseTypeNode(node.type, ctx, pathLabel);
	}
	if (ts.isIntersectionTypeNode(node)) {
		return parseIntersectionType(node, ctx, pathLabel);
	}
	if (ts.isUnionTypeNode(node)) {
		return parseUnionType(node, ctx, pathLabel);
	}
	if (ts.isTypeLiteralNode(node)) {
		return parseTypeLiteral(node, ctx, pathLabel);
	}
	if (ts.isArrayTypeNode(node)) {
		return {
			constraints: DEFAULT_CONSTRAINTS(),
			enumValues: null,
			items: withRequired(parseTypeNode(node.elementType, ctx, `${pathLabel}[]`), true),
			kind: "array",
			path: pathLabel,
			required: true,
			union: null,
		};
	}
	if (ts.isLiteralTypeNode(node)) {
		return parseLiteralType(node, pathLabel);
	}
	if (ts.isTypeReferenceNode(node)) {
		return parseTypeReference(node, ctx, pathLabel);
	}
	if (node.kind === ts.SyntaxKind.StringKeyword) {
		return baseNode("string", pathLabel);
	}
	if (node.kind === ts.SyntaxKind.NumberKeyword || node.kind === ts.SyntaxKind.BigIntKeyword) {
		return baseNode("number", pathLabel);
	}
	if (node.kind === ts.SyntaxKind.BooleanKeyword) {
		return baseNode("boolean", pathLabel);
	}

	throw new Error(`Unsupported type node at ${pathLabel}: ${node.getText()}`);
}

function parseIntersectionType(
	node: ts.IntersectionTypeNode,
	ctx: AnalysisContext,
	pathLabel: string,
): AttributeNode {
	const tagNodes: ts.TypeReferenceNode[] = [];
	const valueNodes: ts.TypeNode[] = [];

	for (const typeNode of node.types) {
		if (ts.isTypeReferenceNode(typeNode) && getSupportedTagName(typeNode) !== null) {
			tagNodes.push(typeNode);
		} else {
			valueNodes.push(typeNode);
		}
	}

	if (valueNodes.length === 0) {
		throw new Error(`Intersection at ${pathLabel} does not contain a value type`);
	}
	if (valueNodes.length > 1) {
		throw new Error(
			`Unsupported intersection at ${pathLabel}; only a single value type plus typia tags is supported`,
		);
	}

	const parsed = parseTypeNode(valueNodes[0], ctx, pathLabel);
	for (const tagNode of tagNodes) {
		applyTag(parsed, tagNode, pathLabel);
	}

	return parsed;
}

function parseUnionType(node: ts.UnionTypeNode, ctx: AnalysisContext, pathLabel: string): AttributeNode {
	const literalValues = node.types
		.map((typeNode) => extractLiteralValue(typeNode))
		.filter((value): value is string | number | boolean => value !== undefined);

	if (literalValues.length === node.types.length && literalValues.length > 0) {
		const uniqueKinds = new Set(literalValues.map((value) => typeof value));
		if (uniqueKinds.size !== 1) {
			throw new Error(`Mixed primitive enums are not supported at ${pathLabel}`);
		}

		const kind = [...uniqueKinds][0] as "string" | "number" | "boolean";
		return {
			constraints: DEFAULT_CONSTRAINTS(),
			enumValues: literalValues,
			kind,
			path: pathLabel,
			required: true,
			union: null,
		};
	}

	const withoutUndefined = node.types.filter(
		(typeNode) => typeNode.kind !== ts.SyntaxKind.UndefinedKeyword && typeNode.kind !== ts.SyntaxKind.NullKeyword,
	);

	if (withoutUndefined.length === 1) {
		return parseTypeNode(withoutUndefined[0], ctx, pathLabel);
	}

	if (withoutUndefined.length > 1) {
		return parseDiscriminatedUnion(withoutUndefined, ctx, pathLabel);
	}

	throw new Error(`Unsupported union type at ${pathLabel}: ${node.getText()}`);
}

function parseDiscriminatedUnion(
	typeNodes: ts.TypeNode[],
	ctx: AnalysisContext,
	pathLabel: string,
): AttributeNode {
	const branchNodes = typeNodes.map((typeNode, index) => ({
		node: parseTypeNode(typeNode, ctx, `${pathLabel}<branch:${index}>`),
		source: typeNode,
	}));

	for (const branch of branchNodes) {
		if (branch.node.kind !== "object" || branch.node.properties === undefined) {
			throw new Error(
				`Unsupported union type at ${pathLabel}; only discriminated object unions are supported`,
			);
		}
	}

	const discriminator = findDiscriminatorKey(branchNodes.map((branch) => branch.node), pathLabel);
	const branches: Record<string, AttributeNode> = {};

	for (const branch of branchNodes) {
		const discriminatorNode = branch.node.properties?.[discriminator];
		const discriminatorValue = discriminatorNode?.enumValues?.[0];

		if (typeof discriminatorValue !== "string") {
			throw new Error(
				`Discriminated union at ${pathLabel} must use string literal discriminator values`,
			);
		}
		if (branches[discriminatorValue] !== undefined) {
			throw new Error(
				`Discriminated union at ${pathLabel} has duplicate discriminator value "${discriminatorValue}"`,
			);
		}

		branches[discriminatorValue] = withRequired(branch.node, true);
	}

	return {
		constraints: DEFAULT_CONSTRAINTS(),
		enumValues: null,
		kind: "union",
		path: pathLabel,
		required: true,
		union: {
			branches,
			discriminator,
		},
	};
}

function findDiscriminatorKey(branches: AttributeNode[], pathLabel: string): string {
	const candidateKeys = new Set(Object.keys(branches[0].properties ?? {}));

	for (const branch of branches.slice(1)) {
		for (const key of [...candidateKeys]) {
			if (!(branch.properties && key in branch.properties)) {
				candidateKeys.delete(key);
			}
		}
	}

	const discriminatorCandidates = [...candidateKeys].filter((key) =>
		branches.every((branch) => isDiscriminatorProperty(branch.properties?.[key])),
	);

	if (discriminatorCandidates.length !== 1) {
		throw new Error(
			`Unsupported union type at ${pathLabel}; expected exactly one shared discriminator property`,
		);
	}

	return discriminatorCandidates[0];
}

function isDiscriminatorProperty(node: AttributeNode | undefined): boolean {
	return Boolean(
		node &&
		node.required &&
		node.kind === "string" &&
		node.enumValues !== null &&
		node.enumValues.length === 1 &&
		typeof node.enumValues[0] === "string",
	);
}

function parseTypeLiteral(node: ts.TypeLiteralNode, ctx: AnalysisContext, pathLabel: string): AttributeNode {
	const properties: Record<string, AttributeNode> = {};

	for (const member of node.members) {
		if (!ts.isPropertySignature(member) || member.type === undefined) {
			throw new Error(`Unsupported inline object member at ${pathLabel}`);
		}

		const propertyName = getPropertyName(member.name);
		properties[propertyName] = withRequired(
			parseTypeNode(member.type, ctx, `${pathLabel}.${propertyName}`),
			member.questionToken === undefined,
		);
	}

	return {
		constraints: DEFAULT_CONSTRAINTS(),
		enumValues: null,
		kind: "object",
		path: pathLabel,
		properties,
		required: true,
		union: null,
	};
}

function parseLiteralType(node: ts.LiteralTypeNode, pathLabel: string): AttributeNode {
	const literal = extractLiteralValue(node);
	if (literal === undefined) {
		throw new Error(`Unsupported literal type at ${pathLabel}: ${node.getText()}`);
	}

	return {
		constraints: DEFAULT_CONSTRAINTS(),
		enumValues: [literal],
		kind: typeof literal as "string" | "number" | "boolean",
		path: pathLabel,
		required: true,
		union: null,
	};
}

function parseTypeReference(
	node: ts.TypeReferenceNode | ts.ExpressionWithTypeArguments,
	ctx: AnalysisContext,
	pathLabel: string,
): AttributeNode {
	const typeName = getReferenceName(node);
	const typeArguments = node.typeArguments ?? [];

	if (typeName === "Array" || typeName === "ReadonlyArray") {
		const [itemNode] = typeArguments;
		if (itemNode === undefined) {
			throw new Error(`Array type is missing an item type at ${pathLabel}`);
		}

		return {
			constraints: DEFAULT_CONSTRAINTS(),
			enumValues: null,
			items: withRequired(parseTypeNode(itemNode, ctx, `${pathLabel}[]`), true),
			kind: "array",
			path: pathLabel,
			required: true,
			union: null,
		};
	}
	if (typeArguments.length > 0) {
		throw new Error(`Generic type references are not supported at ${pathLabel}: ${typeName}`);
	}

	const symbol = resolveSymbol(node, ctx.checker);
	if (symbol === undefined) {
		throw new Error(`Unable to resolve type reference "${typeName}" at ${pathLabel}`);
	}

	const declaration = symbol.declarations?.find(
		(candidate) =>
			ts.isInterfaceDeclaration(candidate) ||
			ts.isTypeAliasDeclaration(candidate) ||
			ts.isEnumDeclaration(candidate) ||
			ts.isClassDeclaration(candidate),
	);
	if (declaration === undefined) {
		throw new Error(`Unsupported referenced type "${typeName}" at ${pathLabel}`);
	}
	if (!isSerializableExternalDeclaration(declaration, ctx)) {
		throw new Error(
			`External or non-serializable referenced type "${typeName}" is not supported at ${pathLabel}`,
		);
	}
	if (ts.isClassDeclaration(declaration) || ts.isEnumDeclaration(declaration)) {
		throw new Error(`Class and enum references are not supported at ${pathLabel}`);
	}
	if ((declaration.typeParameters?.length ?? 0) > 0) {
		throw new Error(`Generic type declarations are not supported at ${pathLabel}: ${typeName}`);
	}

	return parseNamedDeclaration(declaration, ctx, pathLabel, true);
}

function applyTag(node: AttributeNode, tagNode: ts.TypeReferenceNode, pathLabel: string): void {
	const tagName = getSupportedTagName(tagNode);
	if (tagName === null) {
		return;
	}

	const [arg] = tagNode.typeArguments ?? [];
	if (arg === undefined) {
		throw new Error(`Tag "${tagName}" is missing its generic argument at ${pathLabel}`);
	}

	switch (tagName) {
		case "Default": {
			const value = parseDefaultValue(arg, pathLabel);
			if (value === undefined) {
				throw new Error(`Unsupported Default value at ${pathLabel}: ${arg.getText()}`);
			}
			node.defaultValue = value;
			return;
		}
		case "Format":
			node.constraints.format = parseStringLikeArgument(arg, tagName, pathLabel);
			return;
		case "Pattern":
			node.constraints.pattern = parseStringLikeArgument(arg, tagName, pathLabel);
			return;
		case "Type":
			node.constraints.typeTag = parseStringLikeArgument(arg, tagName, pathLabel);
			return;
		case "MinLength":
			node.constraints.minLength = parseNumericArgument(arg, tagName, pathLabel);
			return;
		case "MaxLength":
			node.constraints.maxLength = parseNumericArgument(arg, tagName, pathLabel);
			return;
		case "Minimum":
			node.constraints.minimum = parseNumericArgument(arg, tagName, pathLabel);
			return;
		case "Maximum":
			node.constraints.maximum = parseNumericArgument(arg, tagName, pathLabel);
			return;
		default:
			return;
	}
}

function parseDefaultValue(node: ts.TypeNode, pathLabel: string): JsonValue | undefined {
	if (ts.isParenthesizedTypeNode(node)) {
		return parseDefaultValue(node.type, pathLabel);
	}
	if (ts.isLiteralTypeNode(node)) {
		const literal = extractLiteralValue(node);
		return literal === undefined ? undefined : literal;
	}
	if (ts.isTypeLiteralNode(node)) {
		const objectValue: Record<string, JsonValue> = {};
		for (const member of node.members) {
			if (!ts.isPropertySignature(member) || member.type === undefined) {
				throw new Error(`Unsupported object Default value at ${pathLabel}`);
			}
			const propertyName = getPropertyName(member.name);
			const value = parseDefaultValue(member.type, `${pathLabel}.${propertyName}`);
			if (value === undefined) {
				throw new Error(`Unsupported object Default value at ${pathLabel}.${propertyName}`);
			}
			objectValue[propertyName] = value;
		}
		return objectValue;
	}
	if (ts.isTupleTypeNode(node)) {
		return node.elements.map((element, index) => {
			const value = parseDefaultValue(element, `${pathLabel}[${index}]`);
			if (value === undefined) {
				throw new Error(`Unsupported array Default value at ${pathLabel}[${index}]`);
			}
			return value;
		});
	}
	if (node.kind === ts.SyntaxKind.NullKeyword) {
		return null;
	}
	return undefined;
}

function parseNumericArgument(node: ts.TypeNode, tagName: string, pathLabel: string): number {
	const value = extractLiteralValue(node);
	if (typeof value !== "number") {
		throw new Error(`Tag "${tagName}" expects a numeric literal at ${pathLabel}`);
	}
	return value;
}

function parseStringLikeArgument(node: ts.TypeNode, tagName: string, pathLabel: string): string {
	const value = extractLiteralValue(node);
	if (typeof value !== "string") {
		throw new Error(`Tag "${tagName}" expects a string literal at ${pathLabel}`);
	}
	return value;
}

function extractLiteralValue(node: ts.TypeNode): string | number | boolean | undefined {
	if (ts.isParenthesizedTypeNode(node)) {
		return extractLiteralValue(node.type);
	}
	if (node.kind === ts.SyntaxKind.TrueKeyword) {
		return true;
	}
	if (node.kind === ts.SyntaxKind.FalseKeyword) {
		return false;
	}
	if (!ts.isLiteralTypeNode(node)) {
		return undefined;
	}

	if (ts.isStringLiteral(node.literal)) {
		return node.literal.text;
	}
	if (ts.isNumericLiteral(node.literal)) {
		return Number(node.literal.text);
	}
	if (node.literal.kind === ts.SyntaxKind.TrueKeyword) {
		return true;
	}
	if (node.literal.kind === ts.SyntaxKind.FalseKeyword) {
		return false;
	}
	return undefined;
}

function createBlockJsonAttribute(
	node: AttributeNode,
	warnings: string[],
): BlockJsonAttribute {
	const attribute: BlockJsonAttribute = {
		type: getWordPressKind(node),
	};

	if (node.defaultValue !== undefined) {
		attribute.default = cloneJson(node.defaultValue);
	}
	if (node.enumValues !== null && node.enumValues.length > 0) {
		attribute.enum = [...node.enumValues];
	}

	const reasons: string[] = [];
	if (node.constraints.format !== null) reasons.push("format");
	if (node.constraints.maxLength !== null) reasons.push("maxLength");
	if (node.constraints.maximum !== null) reasons.push("maximum");
	if (node.constraints.minLength !== null) reasons.push("minLength");
	if (node.constraints.minimum !== null) reasons.push("minimum");
	if (node.constraints.pattern !== null) reasons.push("pattern");
	if (node.constraints.typeTag !== null) reasons.push("typeTag");
	if (node.kind === "array" && node.items !== undefined) reasons.push("items");
	if (node.kind === "object" && node.properties !== undefined) reasons.push("properties");
	if (node.kind === "union" && node.union !== null) reasons.push("union");

	if (reasons.length > 0) {
		warnings.push(`${node.path}: ${reasons.join(", ")}`);
	}

	return attribute;
}

function createManifestAttribute(node: AttributeNode): ManifestAttribute {
	return {
		typia: {
			constraints: { ...node.constraints },
			defaultValue: node.defaultValue === undefined ? null : cloneJson(node.defaultValue),
			hasDefault: node.defaultValue !== undefined,
		},
		ts: {
			items: node.items ? createManifestAttribute(node.items) : null,
			kind: node.kind,
			properties: node.properties
				? Object.fromEntries(
						Object.entries(node.properties).map(([key, property]) => [key, createManifestAttribute(property)]),
					)
				: null,
			required: node.required,
			union: node.union
				? {
						branches: Object.fromEntries(
							Object.entries(node.union.branches).map(([key, branch]) => [key, createManifestAttribute(branch)]),
						),
						discriminator: node.union.discriminator,
					}
				: null,
		},
		wp: {
			defaultValue: node.defaultValue === undefined ? null : cloneJson(node.defaultValue),
			enum: node.enumValues ? [...node.enumValues] : null,
			hasDefault: node.defaultValue !== undefined,
			type: getWordPressKind(node),
		},
	};
}

function renderPhpValidator(manifest: ManifestDocument): { source: string; warnings: string[] } {
	const warnings: string[] = [];

	for (const [key, attribute] of Object.entries(manifest.attributes)) {
		collectPhpGenerationWarnings(attribute, key, warnings);
	}

	const phpManifest = renderPhpValue(manifest, 2);

	return {
		source: `<?php
declare(strict_types=1);

/**
 * Generated from typia.manifest.json. Do not edit manually.
 */
return new class {
\tprivate array $manifest = ${phpManifest};

\tpublic function apply_defaults(array $attributes): array
\t{
\t\treturn $this->applyDefaultsForObject($attributes, $this->manifest['attributes'] ?? []);
\t}

\tpublic function validate(array $attributes): array
\t{
\t\t$normalized = $this->apply_defaults($attributes);
\t\t$errors = [];

\t\tforeach (($this->manifest['attributes'] ?? []) as $name => $attribute) {
\t\t\t$this->validateAttribute(
\t\t\t\tarray_key_exists($name, $normalized),
\t\t\t\t$normalized[$name] ?? null,
\t\t\t\t$attribute,
\t\t\t\t(string) $name,
\t\t\t\t$errors,
\t\t\t);
\t\t}

\t\treturn [
\t\t\t'errors' => $errors,
\t\t\t'valid' => count($errors) === 0,
\t\t];
\t}

\tpublic function is_valid(array $attributes): bool
\t{
\t\treturn $this->validate($attributes)['valid'];
\t}

\tprivate function applyDefaultsForObject(array $attributes, array $schema): array
\t{
\t\t$result = $attributes;

\t\tforeach ($schema as $name => $attribute) {
\t\t\tif (!array_key_exists($name, $result)) {
\t\t\t\tif ($this->hasDefault($attribute)) {
\t\t\t\t\t$result[$name] = $attribute['typia']['defaultValue'];
\t\t\t\t}
\t\t\t\tcontinue;
\t\t\t}

\t\t\t$result[$name] = $this->applyDefaultsForNode($result[$name], $attribute);
\t\t}

\t\treturn $result;
\t}

\tprivate function applyDefaultsForNode($value, array $attribute)
\t{
\t\tif ($value === null) {
\t\t\treturn null;
\t\t}

\t\t$kind = $attribute['ts']['kind'] ?? $attribute['wp']['type'] ?? null;
\t\tif ($kind === 'union') {
\t\t\treturn $this->applyDefaultsForUnion($value, $attribute);
\t\t}
\t\tif ($kind === 'object' && is_array($value) && !$this->isListArray($value)) {
\t\t\treturn $this->applyDefaultsForObject($value, $attribute['ts']['properties'] ?? []);
\t\t}
\t\tif (
\t\t\t$kind === 'array' &&
\t\t\tis_array($value) &&
\t\t\t$this->isListArray($value) &&
\t\t\tisset($attribute['ts']['items']) &&
\t\t\tis_array($attribute['ts']['items'])
\t\t) {
\t\t\t$result = [];
\t\t\tforeach ($value as $index => $item) {
\t\t\t\t$result[$index] = $this->applyDefaultsForNode($item, $attribute['ts']['items']);
\t\t\t}
\t\t\treturn $result;
\t\t}

\t\treturn $value;
\t}

\tprivate function applyDefaultsForUnion($value, array $attribute)
\t{
\t\tif (!is_array($value) || $this->isListArray($value)) {
\t\t\treturn $value;
\t\t}

\t\t$union = $attribute['ts']['union'] ?? null;
\t\tif (!is_array($union)) {
\t\t\treturn $value;
\t\t}

\t\t$discriminator = $union['discriminator'] ?? null;
\t\tif (!is_string($discriminator) || !array_key_exists($discriminator, $value)) {
\t\t\treturn $value;
\t\t}

\t\t$branchKey = $value[$discriminator];
\t\tif (!is_string($branchKey) || !isset($union['branches'][$branchKey]) || !is_array($union['branches'][$branchKey])) {
\t\t\treturn $value;
\t\t}

\t\treturn $this->applyDefaultsForNode($value, $union['branches'][$branchKey]);
\t}

\tprivate function validateAttribute(bool $exists, $value, array $attribute, string $path, array &$errors): void
\t{
\t\tif (!$exists) {
\t\t\tif (($attribute['ts']['required'] ?? false) && !$this->hasDefault($attribute)) {
\t\t\t\t$errors[] = sprintf('%s is required', $path);
\t\t\t}
\t\t\treturn;
\t\t}

\t\t$kind = $attribute['ts']['kind'] ?? $attribute['wp']['type'] ?? null;
\t\tif (!is_string($kind) || $kind === '') {
\t\t\t$errors[] = sprintf('%s has an invalid schema kind', $path);
\t\t\treturn;
\t\t}
\t\tif ($value === null) {
\t\t\t$errors[] = sprintf('%s must be %s', $path, $this->expectedKindLabel($attribute));
\t\t\treturn;
\t\t}

\t\tif (($attribute['wp']['enum'] ?? null) !== null && !$this->valueInEnum($value, $attribute['wp']['enum'])) {
\t\t\t$errors[] = sprintf('%s must be one of %s', $path, implode(', ', $attribute['wp']['enum']));
\t\t}

\t\tswitch ($kind) {
\t\t\tcase 'string':
\t\t\t\tif (!is_string($value)) {
\t\t\t\t\t$errors[] = sprintf('%s must be string', $path);
\t\t\t\t\treturn;
\t\t\t\t}
\t\t\t\t$this->validateString($value, $attribute, $path, $errors);
\t\t\t\treturn;
\t\t\tcase 'number':
\t\t\t\tif (!$this->isNumber($value)) {
\t\t\t\t\t$errors[] = sprintf('%s must be number', $path);
\t\t\t\t\treturn;
\t\t\t\t}
\t\t\t\t$this->validateNumber($value, $attribute, $path, $errors);
\t\t\t\treturn;
\t\t\tcase 'boolean':
\t\t\t\tif (!is_bool($value)) {
\t\t\t\t\t$errors[] = sprintf('%s must be boolean', $path);
\t\t\t\t}
\t\t\t\treturn;
\t\t\tcase 'array':
\t\t\t\tif (!is_array($value) || !$this->isListArray($value)) {
\t\t\t\t\t$errors[] = sprintf('%s must be array', $path);
\t\t\t\t\treturn;
\t\t\t\t}
\t\t\t\tif (isset($attribute['ts']['items']) && is_array($attribute['ts']['items'])) {
\t\t\t\t\tforeach ($value as $index => $item) {
\t\t\t\t\t\t$this->validateAttribute(true, $item, $attribute['ts']['items'], sprintf('%s[%s]', $path, (string) $index), $errors);
\t\t\t\t\t}
\t\t\t\t}
\t\t\t\treturn;
\t\t\tcase 'object':
\t\t\t\tif (!is_array($value) || $this->isListArray($value)) {
\t\t\t\t\t$errors[] = sprintf('%s must be object', $path);
\t\t\t\t\treturn;
\t\t\t\t}
\t\t\t\tforeach (($attribute['ts']['properties'] ?? []) as $name => $child) {
\t\t\t\t\t$this->validateAttribute(
\t\t\t\t\t\tarray_key_exists($name, $value),
\t\t\t\t\t\t$value[$name] ?? null,
\t\t\t\t\t\t$child,
\t\t\t\t\t\tsprintf('%s.%s', $path, (string) $name),
\t\t\t\t\t\t$errors,
\t\t\t\t\t);
\t\t\t\t}
\t\t\t\treturn;
\t\t\tcase 'union':
\t\t\t\t$this->validateUnion($value, $attribute, $path, $errors);
\t\t\t\treturn;
\t\t\tdefault:
\t\t\t\t$errors[] = sprintf('%s has unsupported schema kind %s', $path, $kind);
\t\t}
\t}

\tprivate function validateUnion($value, array $attribute, string $path, array &$errors): void
\t{
\t\tif (!is_array($value) || $this->isListArray($value)) {
\t\t\t$errors[] = sprintf('%s must be object', $path);
\t\t\treturn;
\t\t}

\t\t$union = $attribute['ts']['union'] ?? null;
\t\tif (!is_array($union)) {
\t\t\t$errors[] = sprintf('%s has invalid union schema metadata', $path);
\t\t\treturn;
\t\t}

\t\t$discriminator = $union['discriminator'] ?? null;
\t\tif (!is_string($discriminator) || $discriminator === '') {
\t\t\t$errors[] = sprintf('%s has invalid union discriminator metadata', $path);
\t\t\treturn;
\t\t}
\t\tif (!array_key_exists($discriminator, $value)) {
\t\t\t$errors[] = sprintf('%s.%s is required', $path, $discriminator);
\t\t\treturn;
\t\t}

\t\t$branchKey = $value[$discriminator];
\t\tif (!is_string($branchKey)) {
\t\t\t$errors[] = sprintf('%s.%s must be string', $path, $discriminator);
\t\t\treturn;
\t\t}
\t\tif (!isset($union['branches'][$branchKey]) || !is_array($union['branches'][$branchKey])) {
\t\t\t$errors[] = sprintf('%s.%s must be one of %s', $path, $discriminator, implode(', ', array_keys($union['branches'] ?? [])));
\t\t\treturn;
\t\t}

\t\t$this->validateAttribute(true, $value, $union['branches'][$branchKey], $path, $errors);
\t}

\tprivate function validateString(string $value, array $attribute, string $path, array &$errors): void
\t{
\t\t$constraints = $attribute['typia']['constraints'] ?? [];

\t\tif (isset($constraints['minLength']) && is_int($constraints['minLength']) && strlen($value) < $constraints['minLength']) {
\t\t\t$errors[] = sprintf('%s must be at least %d characters', $path, $constraints['minLength']);
\t\t}
\t\tif (isset($constraints['maxLength']) && is_int($constraints['maxLength']) && strlen($value) > $constraints['maxLength']) {
\t\t\t$errors[] = sprintf('%s must be at most %d characters', $path, $constraints['maxLength']);
\t\t}
\t\tif (
\t\t\tisset($constraints['pattern']) &&
\t\t\tis_string($constraints['pattern']) &&
\t\t\t$constraints['pattern'] !== '' &&
\t\t\t!$this->matchesPattern($constraints['pattern'], $value)
\t\t) {
\t\t\t$errors[] = sprintf('%s does not match %s', $path, $constraints['pattern']);
\t\t}
\t\tif (
\t\t\tisset($constraints['format']) &&
\t\t\t$constraints['format'] === 'uuid' &&
\t\t\t!$this->matchesUuid($value)
\t\t) {
\t\t\t$errors[] = sprintf('%s must be a uuid', $path);
\t\t}
\t}

\tprivate function validateNumber($value, array $attribute, string $path, array &$errors): void
\t{
\t\t$constraints = $attribute['typia']['constraints'] ?? [];

\t\tif (isset($constraints['minimum']) && $this->isNumber($constraints['minimum']) && $value < $constraints['minimum']) {
\t\t\t$errors[] = sprintf('%s must be >= %s', $path, (string) $constraints['minimum']);
\t\t}
\t\tif (isset($constraints['maximum']) && $this->isNumber($constraints['maximum']) && $value > $constraints['maximum']) {
\t\t\t$errors[] = sprintf('%s must be <= %s', $path, (string) $constraints['maximum']);
\t\t}
\t\tif (($constraints['typeTag'] ?? null) === 'uint32') {
\t\t\tif (!is_int($value) || $value < 0 || $value > 4294967295) {
\t\t\t\t$errors[] = sprintf('%s must be a uint32', $path);
\t\t\t}
\t\t}
\t}

\tprivate function hasDefault(array $attribute): bool
\t{
\t\treturn ($attribute['typia']['hasDefault'] ?? false) === true;
\t}

\tprivate function valueInEnum($value, array $enum): bool
\t{
\t\tforeach ($enum as $candidate) {
\t\t\tif ($candidate === $value) {
\t\t\t\treturn true;
\t\t\t}
\t\t}
\t\treturn false;
\t}

\tprivate function matchesPattern(string $pattern, string $value): bool
\t{
\t\t$escapedPattern = str_replace('~', '\\\\~', $pattern);
\t\t$result = @preg_match('~' . $escapedPattern . '~u', $value);
\t\treturn $result === 1;
\t}

\tprivate function matchesUuid(string $value): bool
\t{
\t\treturn preg_match('/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i', $value) === 1;
\t}

\tprivate function isNumber($value): bool
\t{
\t\treturn is_int($value) || is_float($value);
\t}

\tprivate function isListArray(array $value): bool
\t{
\t\t$expectedKey = 0;
\t\tforeach ($value as $key => $_item) {
\t\t\tif ($key !== $expectedKey) {
\t\t\t\treturn false;
\t\t\t}
\t\t\t$expectedKey += 1;
\t\t}
\t\treturn true;
\t}

\tprivate function expectedKindLabel(array $attribute): string
\t{
\t\t$kind = $attribute['ts']['kind'] ?? $attribute['wp']['type'] ?? 'value';
\t\treturn $kind === 'union' ? 'object' : (string) $kind;
\t}
};
`,
		warnings,
	};
}

function collectPhpGenerationWarnings(
	attribute: ManifestAttribute,
	pathLabel: string,
	warnings: string[],
): void {
	const { format, typeTag } = attribute.typia.constraints;
	if (format !== null && format !== "uuid") {
		warnings.push(`${pathLabel}: unsupported PHP validator format "${format}"`);
	}
	if (typeTag !== null && typeTag !== "uint32") {
		warnings.push(`${pathLabel}: unsupported PHP validator type tag "${typeTag}"`);
	}

	if (attribute.ts.items) {
		collectPhpGenerationWarnings(attribute.ts.items, `${pathLabel}[]`, warnings);
	}
	for (const [key, property] of Object.entries(attribute.ts.properties ?? {})) {
		collectPhpGenerationWarnings(property, `${pathLabel}.${key}`, warnings);
	}
	for (const [branchKey, branch] of Object.entries(attribute.ts.union?.branches ?? {})) {
		collectPhpGenerationWarnings(branch, `${pathLabel}<${branchKey}>`, warnings);
	}
}

function renderPhpValue(value: unknown, indentLevel: number): string {
	const indent = "\t".repeat(indentLevel);
	const nestedIndent = "\t".repeat(indentLevel + 1);

	if (value === null) {
		return "null";
	}
	if (typeof value === "string") {
		return `'${value.replace(/\\/g, "\\\\").replace(/'/g, "\\'")}'`;
	}
	if (typeof value === "number" || typeof value === "boolean") {
		return String(value);
	}
	if (Array.isArray(value)) {
		if (value.length === 0) {
			return "[]";
		}
		const items = value.map((item) => `${nestedIndent}${renderPhpValue(item, indentLevel + 1)}`);
		return `[\n${items.join(",\n")}\n${indent}]`;
	}
	if (typeof value === "object") {
		const entries = Object.entries(value as Record<string, unknown>);
		if (entries.length === 0) {
			return "[]";
		}
		const items = entries.map(
			([key, item]) =>
				`${nestedIndent}'${key.replace(/\\/g, "\\\\").replace(/'/g, "\\'")}' => ${renderPhpValue(item, indentLevel + 1)}`,
		);
		return `[\n${items.join(",\n")}\n${indent}]`;
	}

	throw new Error(`Unable to encode PHP value for manifest node: ${String(value)}`);
}

function createExampleValue(node: AttributeNode, key: string): JsonValue {
	if (node.defaultValue !== undefined) {
		return cloneJson(node.defaultValue);
	}
	if (node.enumValues !== null && node.enumValues.length > 0) {
		return cloneJson(node.enumValues[0]);
	}

	switch (node.kind) {
		case "string":
			if (node.constraints.format === "uuid") {
				return "00000000-0000-4000-8000-000000000000";
			}
			return `Example ${key}`;
		case "number":
			return node.constraints.minimum ?? 42;
		case "boolean":
			return true;
		case "array":
			return [];
		case "object":
			return Object.fromEntries(
				Object.entries(node.properties ?? {}).map(([propertyKey, propertyNode]) => [
					propertyKey,
					createExampleValue(propertyNode, propertyKey),
				]),
			);
		case "union": {
			const firstBranch = node.union ? Object.values(node.union.branches)[0] : undefined;
			if (!firstBranch || firstBranch.kind !== "object") {
				return {};
			}
			return Object.fromEntries(
				Object.entries(firstBranch.properties ?? {}).map(([propertyKey, propertyNode]) => [
					propertyKey,
					createExampleValue(propertyNode, propertyKey),
				]),
			);
		}
	}
}

function getWordPressKind(node: AttributeNode): WordPressAttributeKind {
	return node.kind === "union" ? "object" : node.kind;
}

function baseNode(kind: AttributeKind, pathLabel: string): AttributeNode {
	return {
		constraints: DEFAULT_CONSTRAINTS(),
		enumValues: null,
		kind,
		path: pathLabel,
		required: true,
		union: null,
	};
}

function withRequired(node: AttributeNode, required: boolean): AttributeNode {
	return {
		...node,
		items: node.items ? withRequired(node.items, node.items.required) : undefined,
		properties: node.properties ? cloneProperties(node.properties) : undefined,
		required,
		union: node.union ? cloneUnion(node.union) : null,
	};
}

function cloneUnion(union: AttributeUnion): AttributeUnion {
	return {
		branches: Object.fromEntries(
			Object.entries(union.branches).map(([key, branch]) => [key, withRequired(branch, branch.required)]),
		),
		discriminator: union.discriminator,
	};
}

function cloneProperties(properties: Record<string, AttributeNode>): Record<string, AttributeNode> {
	return Object.fromEntries(
		Object.entries(properties).map(([key, node]) => [key, withRequired(node, node.required)]),
	);
}

function cloneJson<T extends JsonValue | Array<string | number | boolean>>(value: T): T {
	return JSON.parse(JSON.stringify(value)) as T;
}

function getPropertyName(name: ts.PropertyName): string {
	if (ts.isIdentifier(name) || ts.isStringLiteral(name) || ts.isNumericLiteral(name)) {
		return name.text;
	}
	throw new Error(`Unsupported property name: ${name.getText()}`);
}

function getSupportedTagName(node: ts.TypeReferenceNode): string | null {
	const typeName = getEntityNameText(node.typeName);
	const [, tagName] = typeName.split(".");
	if (!typeName.startsWith("tags.") || tagName === undefined || !SUPPORTED_TAGS.has(tagName)) {
		return null;
	}
	return tagName;
}

function getEntityNameText(name: ts.EntityName): string {
	if (ts.isIdentifier(name)) {
		return name.text;
	}
	return `${getEntityNameText(name.left)}.${name.right.text}`;
}

function resolveSymbol(
	node: ts.TypeReferenceNode | ts.ExpressionWithTypeArguments,
	checker: ts.TypeChecker,
): ts.Symbol | undefined {
	const symbol = checker.getSymbolAtLocation(
		ts.isTypeReferenceNode(node) ? node.typeName : node.expression,
	);
	if (symbol === undefined) {
		return undefined;
	}
	return symbol.flags & ts.SymbolFlags.Alias ? checker.getAliasedSymbol(symbol) : symbol;
}

function getReferenceName(node: ts.TypeReferenceNode | ts.ExpressionWithTypeArguments): string {
	if (ts.isTypeReferenceNode(node)) {
		return getEntityNameText(node.typeName);
	}
	return node.expression.getText();
}

function isProjectLocalDeclaration(declaration: ts.Declaration, projectRoot: string): boolean {
	const fileName = declaration.getSourceFile().fileName;
	return !fileName.includes("node_modules") && !path.relative(projectRoot, fileName).startsWith("..");
}

function isSerializableExternalDeclaration(declaration: ts.Declaration, ctx: AnalysisContext): boolean {
	if (isProjectLocalDeclaration(declaration, ctx.projectRoot)) {
		return true;
	}

	const packageName = getOwningPackageName(declaration.getSourceFile().fileName, ctx.packageNameCache);
	return packageName !== null && ctx.allowedExternalPackages.has(packageName);
}

function getOwningPackageName(
	fileName: string,
	cache: Map<string, string | null>,
): string | null {
	let currentDir = path.dirname(fileName);

	while (true) {
		if (cache.has(currentDir)) {
			return cache.get(currentDir) ?? null;
		}

		const packageJsonPath = path.join(currentDir, "package.json");
		if (fs.existsSync(packageJsonPath)) {
			try {
				const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8")) as {
					name?: string;
				};
				const packageName = typeof packageJson.name === "string" ? packageJson.name : null;
				cache.set(currentDir, packageName);
				return packageName;
			} catch {
				cache.set(currentDir, null);
				return null;
			}
		}

		const parentDir = path.dirname(currentDir);
		if (parentDir === currentDir) {
			cache.set(currentDir, null);
			return null;
		}

		currentDir = parentDir;
	}
}

function formatDiagnosticError(diagnostic: ts.Diagnostic): Error {
	return new Error(
		ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n"),
	);
}
