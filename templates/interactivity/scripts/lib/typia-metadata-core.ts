import * as fs from "node:fs";
import * as path from "node:path";
import ts from "typescript";

type JsonPrimitive = string | number | boolean | null;
type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue };
type AttributeKind = "string" | "number" | "boolean" | "array" | "object";

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
}

interface BlockJsonAttribute {
	default?: JsonValue;
	enum?: Array<string | number | boolean>;
	type: AttributeKind;
}

interface ManifestAttribute {
	typia: {
		constraints: AttributeConstraints;
		default: JsonValue | null;
	};
	ts: {
		items: ManifestAttribute | null;
		kind: AttributeKind;
		properties: Record<string, ManifestAttribute> | null;
		required: boolean;
	};
	wp: {
		default: JsonValue | null;
		enum: Array<string | number | boolean> | null;
		type: AttributeKind;
	};
}

interface ManifestDocument {
	attributes: Record<string, ManifestAttribute>;
	manifestVersion: 1;
	sourceType: string;
}

export interface SyncBlockMetadataOptions {
	blockJsonFile: string;
	manifestFile?: string;
	projectRoot?: string;
	sourceTypeName: string;
	typesFile: string;
}

export interface SyncBlockMetadataResult {
	attributeNames: string[];
	blockJsonPath: string;
	lossyProjectionWarnings: string[];
	manifestPath: string;
}

interface AnalysisContext {
	checker: ts.TypeChecker;
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
	const manifestPath = path.resolve(
		projectRoot,
		options.manifestFile ?? path.join(path.dirname(options.blockJsonFile), "typia.manifest.json"),
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
		manifestVersion: 1,
		sourceType: options.sourceTypeName,
	};

	fs.writeFileSync(blockJsonPath, JSON.stringify(blockJson, null, "\t"));
	fs.mkdirSync(path.dirname(manifestPath), { recursive: true });
	fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, "\t"));

	return {
		attributeNames: Object.keys(rootNode.properties),
		blockJsonPath,
		lossyProjectionWarnings: [...new Set(lossyProjectionWarnings)].sort(),
		manifestPath,
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
		checker: program.getTypeChecker(),
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
		};
	}

	const withoutUndefined = node.types.filter(
		(typeNode) => typeNode.kind !== ts.SyntaxKind.UndefinedKeyword && typeNode.kind !== ts.SyntaxKind.NullKeyword,
	);

	if (withoutUndefined.length === 1) {
		return parseTypeNode(withoutUndefined[0], ctx, pathLabel);
	}

	throw new Error(`Unsupported union type at ${pathLabel}: ${node.getText()}`);
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
	if (!isProjectLocalDeclaration(declaration, ctx.projectRoot)) {
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
		type: node.kind,
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

	if (reasons.length > 0) {
		warnings.push(`${node.path}: ${reasons.join(", ")}`);
	}

	return attribute;
}

function createManifestAttribute(node: AttributeNode): ManifestAttribute {
	return {
		typia: {
			constraints: { ...node.constraints },
			default: node.defaultValue === undefined ? null : cloneJson(node.defaultValue),
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
		},
		wp: {
			default: node.defaultValue === undefined ? null : cloneJson(node.defaultValue),
			enum: node.enumValues ? [...node.enumValues] : null,
			type: node.kind,
		},
	};
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
	}
}

function baseNode(kind: AttributeKind, pathLabel: string): AttributeNode {
	return {
		constraints: DEFAULT_CONSTRAINTS(),
		enumValues: null,
		kind,
		path: pathLabel,
		required: true,
	};
}

function withRequired(node: AttributeNode, required: boolean): AttributeNode {
	return {
		...node,
		items: node.items ? withRequired(node.items, node.items.required) : undefined,
		properties: node.properties ? cloneProperties(node.properties) : undefined,
		required,
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

function formatDiagnosticError(diagnostic: ts.Diagnostic): Error {
	return new Error(
		ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n"),
	);
}
