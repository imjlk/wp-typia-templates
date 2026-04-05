import * as fs from "node:fs";
import * as path from "node:path";

import ts from "typescript";

import {
	type AnalysisContext,
	createAnalysisContext,
} from "./metadata-analysis.js";
import { cloneJsonValue } from "./json-utils.js";
import {
	type AttributeConstraints,
	type AttributeNode,
	type JsonValue,
	type WordPressAttributeSource,
	baseNode,
	cloneProperties,
	defaultAttributeConstraints,
	withRequired,
} from "./metadata-model.js";

const SUPPORTED_TAGS = new Set([
	"Default",
	"ExclusiveMaximum",
	"ExclusiveMinimum",
	"Format",
	"MaxLength",
	"MaxItems",
	"Maximum",
	"MinLength",
	"MinItems",
	"Minimum",
	"MultipleOf",
	"Pattern",
	"Selector",
	"Source",
	"Type",
]);

/**
 * Analyze one named source type from a TypeScript module.
 *
 * @param options Metadata analysis options including the project root, source
 * type name, and types file path.
 * @returns The resolved project root plus the parsed root attribute node for
 * the requested source type.
 */
export function analyzeSourceType(
	options: {
		projectRoot?: string;
		sourceTypeName: string;
		typesFile: string;
	},
): { projectRoot: string; rootNode: AttributeNode } {
	const projectRoot = path.resolve(options.projectRoot ?? process.cwd());
	const rootNodes = analyzeSourceTypes(
		{
			projectRoot,
			typesFile: options.typesFile,
		},
		[options.sourceTypeName],
	);

	return {
		projectRoot,
		rootNode: rootNodes[options.sourceTypeName],
	};
}

/**
 * Analyze multiple named source types from a TypeScript module.
 *
 * @param options Metadata analysis options including the optional project root
 * and the relative types file path to parse.
 * @param sourceTypeNames Exported type or interface names to resolve from the
 * configured types file.
 * @returns A record keyed by source type name with parsed attribute-node trees
 * for each requested type.
 */
export function analyzeSourceTypes(
	options: {
		projectRoot?: string;
		typesFile: string;
	},
	sourceTypeNames: string[],
): Record<string, AttributeNode> {
	const projectRoot = path.resolve(options.projectRoot ?? process.cwd());
	const typesFilePath = path.resolve(projectRoot, options.typesFile);
	const ctx = createAnalysisContext(projectRoot, typesFilePath);
	const sourceFile = ctx.program.getSourceFile(typesFilePath);
	if (sourceFile === undefined) {
		throw new Error(`Unable to load types file: ${typesFilePath}`);
	}

	return Object.fromEntries(
		sourceTypeNames.map((sourceTypeName) => {
			const declaration = findNamedDeclaration(sourceFile, sourceTypeName);
			if (declaration === undefined) {
				throw new Error(
					`Unable to find source type "${sourceTypeName}" in ${path.relative(projectRoot, typesFilePath)}`,
				);
			}

			return [
				sourceTypeName,
				parseNamedDeclaration(declaration, ctx, sourceTypeName, true),
			];
		}),
	);
}

function findNamedDeclaration(
	sourceFile: ts.SourceFile,
	name: string,
): ts.InterfaceDeclaration | ts.TypeAliasDeclaration | undefined {
	for (const statement of sourceFile.statements) {
		if (
			(ts.isInterfaceDeclaration(statement) ||
				ts.isTypeAliasDeclaration(statement)) &&
			statement.name.text === name
		) {
			return statement;
		}
	}
	return undefined;
}

/**
 * Parse an interface or type alias declaration into one attribute-node tree.
 *
 * @param declaration TypeScript declaration node to parse.
 * @param ctx Shared analysis context used for type resolution and recursion
 * detection.
 * @param pathLabel Human-readable path label for diagnostics.
 * @param required Whether the resulting node should be marked as required.
 * @returns The parsed attribute-node representation for the declaration.
 */
export function parseNamedDeclaration(
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
		return withRequired(
			parseTypeNode(declaration.type, ctx, pathLabel),
			required,
		);
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
			const baseNode = parseTypeReference(
				baseType,
				ctx,
				`${pathLabel}<extends>`,
			);
			if (baseNode.kind !== "object" || baseNode.properties === undefined) {
				throw new Error(
					`Only object-like interface extensions are supported: ${pathLabel}`,
				);
			}
			Object.assign(properties, cloneProperties(baseNode.properties));
		}
	}

	for (const member of declaration.members) {
		if (!ts.isPropertySignature(member) || member.type === undefined) {
			throw new Error(
				`Unsupported member in ${pathLabel}; only typed properties are supported`,
			);
		}

		const propertyName = getPropertyName(member.name);
		properties[propertyName] = withRequired(
			parseTypeNode(member.type, ctx, `${pathLabel}.${propertyName}`),
			member.questionToken === undefined,
		);
	}

	return {
		constraints: defaultAttributeConstraints(),
		enumValues: null,
		kind: "object",
		path: pathLabel,
		properties,
		required,
		union: null,
		wp: {
			selector: null,
			source: null,
		},
	};
}

/**
 * Parse one TypeScript type node into the internal metadata model.
 *
 * @param node TypeScript AST node describing the source type shape.
 * @param ctx Shared analysis context used for symbol and type resolution.
 * @param pathLabel Human-readable path label used in parse errors and warnings.
 * @returns The parsed attribute-node representation of the provided type node.
 */
export function parseTypeNode(
	node: ts.TypeNode,
	ctx: AnalysisContext,
	pathLabel: string,
): AttributeNode {
	if (ts.isParenthesizedTypeNode(node)) {
		return parseTypeNode(node.type, ctx, pathLabel);
	}
	if (ts.isIndexedAccessTypeNode(node)) {
		return parseIndexedAccessType(node, ctx, pathLabel);
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
			constraints: defaultAttributeConstraints(),
			enumValues: null,
			items: withRequired(
				parseTypeNode(node.elementType, ctx, `${pathLabel}[]`),
				true,
			),
			kind: "array",
			path: pathLabel,
			required: true,
			union: null,
			wp: {
				selector: null,
				source: null,
			},
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
	if (
		node.kind === ts.SyntaxKind.NumberKeyword ||
		node.kind === ts.SyntaxKind.BigIntKeyword
	) {
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
		if (
			ts.isTypeReferenceNode(typeNode) &&
			getSupportedTagName(typeNode) !== null
		) {
			tagNodes.push(typeNode);
		} else {
			valueNodes.push(typeNode);
		}
	}

	if (valueNodes.length === 0) {
		throw new Error(
			`Intersection at ${pathLabel} does not contain a value type`,
		);
	}

	const parsedNodes = valueNodes.map((valueNode) =>
		parseTypeNode(valueNode, ctx, pathLabel),
	);
	const parsed =
		parsedNodes.length === 1
			? parsedNodes[0]
			: mergePrimitiveIntersection(parsedNodes, pathLabel);
	for (const tagNode of tagNodes) {
		applyTag(parsed, tagNode, pathLabel);
	}

	return parsed;
}

function parseIndexedAccessType(
	node: ts.IndexedAccessTypeNode,
	ctx: AnalysisContext,
	pathLabel: string,
): AttributeNode {
	const keyValue = extractLiteralValue(node.indexType);
	if (typeof keyValue !== "string" && typeof keyValue !== "number") {
		throw new Error(
			`Indexed access requires a string or number literal key at ${pathLabel}: ${node.indexType.getText()}`,
		);
	}

	const propertyKey = String(keyValue);
	const propertyDeclaration = resolveIndexedAccessPropertyDeclaration(
		node.objectType,
		propertyKey,
		ctx,
		pathLabel,
	);
	if (propertyDeclaration.type === undefined) {
		throw new Error(
			`Indexed access property "${propertyKey}" is missing an explicit type at ${pathLabel}`,
		);
	}

	return withRequired(
		parseTypeNode(propertyDeclaration.type, ctx, pathLabel),
		propertyDeclaration.questionToken === undefined,
	);
}

function parseUnionType(
	node: ts.UnionTypeNode,
	ctx: AnalysisContext,
	pathLabel: string,
): AttributeNode {
	const literalValues = node.types
		.map((typeNode) => extractLiteralValue(typeNode))
		.filter(
			(value): value is string | number | boolean => value !== undefined,
		);

	if (literalValues.length === node.types.length && literalValues.length > 0) {
		const uniqueKinds = new Set(literalValues.map((value) => typeof value));
		if (uniqueKinds.size !== 1) {
			throw new Error(
				`Mixed primitive enums are not supported at ${pathLabel}`,
			);
		}

		const kind = [...uniqueKinds][0] as "string" | "number" | "boolean";
		return {
			constraints: defaultAttributeConstraints(),
			enumValues: literalValues,
			kind,
			path: pathLabel,
			required: true,
			union: null,
			wp: {
				selector: null,
				source: null,
			},
		};
	}

	const withoutUndefined = node.types.filter(
		(typeNode) =>
			typeNode.kind !== ts.SyntaxKind.UndefinedKeyword &&
			typeNode.kind !== ts.SyntaxKind.NullKeyword,
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

	const discriminator = findDiscriminatorKey(
		branchNodes.map((branch) => branch.node),
		pathLabel,
	);
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
		constraints: defaultAttributeConstraints(),
		enumValues: null,
		kind: "union",
		path: pathLabel,
		required: true,
		union: {
			branches,
			discriminator,
		},
		wp: {
			selector: null,
			source: null,
		},
	};
}

function findDiscriminatorKey(
	branches: AttributeNode[],
	pathLabel: string,
): string {
	const candidateKeys = new Set(Object.keys(branches[0].properties ?? {}));

	for (const branch of branches.slice(1)) {
		for (const key of [...candidateKeys]) {
			if (!(branch.properties && key in branch.properties)) {
				candidateKeys.delete(key);
			}
		}
	}

	const discriminatorCandidates = [...candidateKeys].filter((key) =>
		branches.every((branch) =>
			isDiscriminatorProperty(branch.properties?.[key]),
		),
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

function parseTypeLiteral(
	node: ts.TypeLiteralNode,
	ctx: AnalysisContext,
	pathLabel: string,
): AttributeNode {
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
		constraints: defaultAttributeConstraints(),
		enumValues: null,
		kind: "object",
		path: pathLabel,
		properties,
		required: true,
		union: null,
		wp: {
			selector: null,
			source: null,
		},
	};
}

function parseLiteralType(
	node: ts.LiteralTypeNode,
	pathLabel: string,
): AttributeNode {
	const literal = extractLiteralValue(node);
	if (literal === undefined) {
		throw new Error(
			`Unsupported literal type at ${pathLabel}: ${node.getText()}`,
		);
	}

	return {
		constraints: defaultAttributeConstraints(),
		enumValues: [literal],
		kind: typeof literal as "string" | "number" | "boolean",
		path: pathLabel,
		required: true,
		union: null,
		wp: {
			selector: null,
			source: null,
		},
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
			constraints: defaultAttributeConstraints(),
			enumValues: null,
			items: withRequired(parseTypeNode(itemNode, ctx, `${pathLabel}[]`), true),
			kind: "array",
			path: pathLabel,
			required: true,
			union: null,
			wp: {
				selector: null,
				source: null,
			},
		};
	}
	if (typeArguments.length > 0) {
		throw new Error(
			`Generic type references are not supported at ${pathLabel}: ${typeName}`,
		);
	}

	const symbol = resolveSymbol(node, ctx.checker);
	if (symbol === undefined) {
		throw new Error(
			`Unable to resolve type reference "${typeName}" at ${pathLabel}`,
		);
	}

	const declaration = symbol.declarations?.find(
		(candidate) =>
			ts.isInterfaceDeclaration(candidate) ||
			ts.isTypeAliasDeclaration(candidate) ||
			ts.isEnumDeclaration(candidate) ||
			ts.isClassDeclaration(candidate),
	);
	if (declaration === undefined) {
		throw new Error(
			`Unsupported referenced type "${typeName}" at ${pathLabel}`,
		);
	}
	if (!isSerializableExternalDeclaration(declaration, ctx)) {
		throw new Error(
			`External or non-serializable referenced type "${typeName}" is not supported at ${pathLabel}`,
		);
	}
	if (ts.isClassDeclaration(declaration) || ts.isEnumDeclaration(declaration)) {
		throw new Error(
			`Class and enum references are not supported at ${pathLabel}`,
		);
	}
	if ((declaration.typeParameters?.length ?? 0) > 0) {
		throw new Error(
			`Generic type declarations are not supported at ${pathLabel}: ${typeName}`,
		);
	}

	return parseNamedDeclaration(declaration, ctx, pathLabel, true);
}

function resolveIndexedAccessPropertyDeclaration(
	objectTypeNode: ts.TypeNode,
	propertyKey: string,
	ctx: AnalysisContext,
	pathLabel: string,
): ts.PropertySignature | ts.PropertyDeclaration {
	const objectType = ctx.checker.getTypeFromTypeNode(objectTypeNode);
	const propertySymbol = ctx.checker
		.getPropertiesOfType(objectType)
		.find((candidate) => candidate.name === propertyKey);

	if (propertySymbol === undefined) {
		throw new Error(
			`Indexed access could not resolve property "${propertyKey}" at ${pathLabel}`,
		);
	}

	const valueDeclaration = propertySymbol.valueDeclaration;
	const declaration =
		valueDeclaration !== undefined &&
		(ts.isPropertySignature(valueDeclaration) ||
			ts.isPropertyDeclaration(valueDeclaration))
			? valueDeclaration
			: propertySymbol.declarations?.find(
					(
						candidate,
					): candidate is ts.PropertySignature | ts.PropertyDeclaration =>
						ts.isPropertySignature(candidate) ||
						ts.isPropertyDeclaration(candidate),
			  );
	if (declaration === undefined) {
		throw new Error(
			`Indexed access property "${propertyKey}" does not resolve to a typed property at ${pathLabel}`,
		);
	}
	if (!isSerializableExternalDeclaration(declaration, ctx)) {
		throw new Error(
			`External or non-serializable indexed access property "${propertyKey}" is not supported at ${pathLabel}`,
		);
	}

	return declaration;
}

function mergePrimitiveIntersection(
	nodes: AttributeNode[],
	pathLabel: string,
): AttributeNode {
	const [first, ...rest] = nodes;

	if (!isPrimitiveCompatibleNode(first)) {
		throw new Error(
			`Unsupported intersection at ${pathLabel}; only primitive-compatible intersections are supported`,
		);
	}

	let merged = withRequired(first, first.required);
	for (const node of rest) {
		if (!isPrimitiveCompatibleNode(node) || node.kind !== merged.kind) {
			throw new Error(
				`Unsupported intersection at ${pathLabel}; only a single primitive kind plus typia tags is supported`,
			);
		}

		merged = {
			...merged,
			constraints: mergeConstraints(
				merged.constraints,
				node.constraints,
				pathLabel,
			),
			defaultValue: mergeDefaultValue(
				merged.defaultValue,
				node.defaultValue,
				pathLabel,
			),
			enumValues: intersectEnumValues(
				merged.enumValues,
				node.enumValues,
				pathLabel,
			),
			required: merged.required && node.required,
		};
	}

	return merged;
}

function isPrimitiveCompatibleNode(node: AttributeNode): boolean {
	return (
		(node.kind === "string" ||
			node.kind === "number" ||
			node.kind === "boolean") &&
		node.items === undefined &&
		node.properties === undefined &&
		node.union === null
	);
}

function mergeConstraints(
	left: AttributeConstraints,
	right: AttributeConstraints,
	pathLabel: string,
): AttributeConstraints {
	return {
		exclusiveMaximum: mergeMaximumLike(
			left.exclusiveMaximum,
			right.exclusiveMaximum,
		),
		exclusiveMinimum: mergeMinimumLike(
			left.exclusiveMinimum,
			right.exclusiveMinimum,
		),
		format: mergeExactLike(left.format, right.format, pathLabel, "format"),
		maxLength: mergeMaximumLike(left.maxLength, right.maxLength),
		maxItems: mergeMaximumLike(left.maxItems, right.maxItems),
		maximum: mergeMaximumLike(left.maximum, right.maximum),
		minLength: mergeMinimumLike(left.minLength, right.minLength),
		minItems: mergeMinimumLike(left.minItems, right.minItems),
		minimum: mergeMinimumLike(left.minimum, right.minimum),
		multipleOf: mergeExactLike(
			left.multipleOf,
			right.multipleOf,
			pathLabel,
			"multipleOf",
		),
		pattern: mergeExactLike(left.pattern, right.pattern, pathLabel, "pattern"),
		typeTag: mergeExactLike(left.typeTag, right.typeTag, pathLabel, "typeTag"),
	};
}

function mergeMinimumLike(
	left: number | null,
	right: number | null,
): number | null {
	if (left === null) {
		return right;
	}
	if (right === null) {
		return left;
	}
	return Math.max(left, right);
}

function mergeMaximumLike(
	left: number | null,
	right: number | null,
): number | null {
	if (left === null) {
		return right;
	}
	if (right === null) {
		return left;
	}
	return Math.min(left, right);
}

function mergeExactLike<T extends string | number>(
	left: T | null,
	right: T | null,
	pathLabel: string,
	label: string,
): T | null {
	if (left === null) {
		return right;
	}
	if (right === null) {
		return left;
	}
	if (left !== right) {
		throw new Error(
			`Conflicting ${label} constraints in intersection at ${pathLabel}: ${left} vs ${right}`,
		);
	}
	return left;
}

function mergeDefaultValue(
	left: JsonValue | undefined,
	right: JsonValue | undefined,
	pathLabel: string,
): JsonValue | undefined {
	if (left === undefined) {
		return right;
	}
	if (right === undefined) {
		return left;
	}
	if (!jsonValuesEqual(left, right)) {
		throw new Error(
			`Conflicting default values in intersection at ${pathLabel}`,
		);
	}
	return cloneJsonValue(left);
}

function jsonValuesEqual(left: JsonValue, right: JsonValue): boolean {
	if (left === right) {
		return true;
	}
	if (
		left === null ||
		right === null ||
		typeof left !== "object" ||
		typeof right !== "object"
	) {
		return false;
	}
	if (Array.isArray(left) || Array.isArray(right)) {
		if (!Array.isArray(left) || !Array.isArray(right)) {
			return false;
		}
		if (left.length !== right.length) {
			return false;
		}

		return left.every((value, index) => jsonValuesEqual(value, right[index]));
	}

	const leftEntries = Object.entries(left);
	const rightEntries = Object.entries(right);
	if (leftEntries.length !== rightEntries.length) {
		return false;
	}

	return leftEntries.every(([key, value]) =>
		Object.prototype.hasOwnProperty.call(right, key) &&
		jsonValuesEqual(value, right[key]),
	);
}

function intersectEnumValues(
	left: Array<string | number | boolean> | null,
	right: Array<string | number | boolean> | null,
	pathLabel: string,
): Array<string | number | boolean> | null {
	if (left === null) {
		return right ? [...right] : null;
	}
	if (right === null) {
		return [...left];
	}

	const allowed = new Set(right);
	const intersection = left.filter((value) => allowed.has(value));
	if (intersection.length === 0) {
		throw new Error(`Intersection at ${pathLabel} resolves to an empty enum`);
	}
	return intersection;
}

function applyTag(
	node: AttributeNode,
	tagNode: ts.TypeReferenceNode,
	pathLabel: string,
): void {
	const tagName = getSupportedTagName(tagNode);
	if (tagName === null) {
		return;
	}

	const [arg] = tagNode.typeArguments ?? [];
	if (arg === undefined) {
		throw new Error(
			`Tag "${tagName}" is missing its generic argument at ${pathLabel}`,
		);
	}

	switch (tagName) {
		case "Default": {
			const value = parseDefaultValue(arg, pathLabel);
			if (value === undefined) {
				throw new Error(
					`Unsupported Default value at ${pathLabel}: ${arg.getText()}`,
				);
			}
			node.defaultValue = value;
			return;
		}
		case "Format":
			node.constraints.format = parseStringLikeArgument(
				arg,
				tagName,
				pathLabel,
			);
			return;
		case "Pattern":
			node.constraints.pattern = parseStringLikeArgument(
				arg,
				tagName,
				pathLabel,
			);
			return;
		case "Selector":
			node.wp.selector = parseStringLikeArgument(arg, tagName, pathLabel);
			return;
		case "Source":
			node.wp.source = parseWordPressAttributeSource(arg, pathLabel);
			return;
		case "Type":
			node.constraints.typeTag = parseStringLikeArgument(
				arg,
				tagName,
				pathLabel,
			);
			return;
		case "MinLength":
			node.constraints.minLength = parseNumericArgument(
				arg,
				tagName,
				pathLabel,
			);
			return;
		case "MaxLength":
			node.constraints.maxLength = parseNumericArgument(
				arg,
				tagName,
				pathLabel,
			);
			return;
		case "MinItems":
			node.constraints.minItems = parseNumericArgument(arg, tagName, pathLabel);
			return;
		case "MaxItems":
			node.constraints.maxItems = parseNumericArgument(arg, tagName, pathLabel);
			return;
		case "Minimum":
			node.constraints.minimum = parseNumericArgument(arg, tagName, pathLabel);
			return;
		case "Maximum":
			node.constraints.maximum = parseNumericArgument(arg, tagName, pathLabel);
			return;
		case "ExclusiveMinimum":
			node.constraints.exclusiveMinimum = parseNumericArgument(
				arg,
				tagName,
				pathLabel,
			);
			return;
		case "ExclusiveMaximum":
			node.constraints.exclusiveMaximum = parseNumericArgument(
				arg,
				tagName,
				pathLabel,
			);
			return;
		case "MultipleOf":
			node.constraints.multipleOf = parseNumericArgument(
				arg,
				tagName,
				pathLabel,
			);
			return;
		default:
			return;
	}
}

function parseDefaultValue(
	node: ts.TypeNode,
	pathLabel: string,
): JsonValue | undefined {
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
			const value = parseDefaultValue(
				member.type,
				`${pathLabel}.${propertyName}`,
			);
			if (value === undefined) {
				throw new Error(
					`Unsupported object Default value at ${pathLabel}.${propertyName}`,
				);
			}
			objectValue[propertyName] = value;
		}
		return objectValue;
	}
	if (ts.isTupleTypeNode(node)) {
		return node.elements.map((element, index) => {
			const value = parseDefaultValue(element, `${pathLabel}[${index}]`);
			if (value === undefined) {
				throw new Error(
					`Unsupported array Default value at ${pathLabel}[${index}]`,
				);
			}
			return value;
		});
	}
	if (node.kind === ts.SyntaxKind.NullKeyword) {
		return null;
	}
	return undefined;
}

function parseNumericArgument(
	node: ts.TypeNode,
	tagName: string,
	pathLabel: string,
): number {
	const value = extractLiteralValue(node);
	if (typeof value !== "number") {
		throw new Error(
			`Tag "${tagName}" expects a numeric literal at ${pathLabel}`,
		);
	}
	return value;
}

function parseStringLikeArgument(
	node: ts.TypeNode,
	tagName: string,
	pathLabel: string,
): string {
	const value = extractLiteralValue(node);
	if (typeof value !== "string") {
		throw new Error(
			`Tag "${tagName}" expects a string literal at ${pathLabel}`,
		);
	}
	return value;
}

function parseWordPressAttributeSource(
	node: ts.TypeNode,
	pathLabel: string,
): WordPressAttributeSource {
	const value = parseStringLikeArgument(node, "Source", pathLabel);
	if (value === "html" || value === "text" || value === "rich-text") {
		return value;
	}

	throw new Error(
		`Tag "Source" only supports "html", "text", or "rich-text" at ${pathLabel}`,
	);
}

function extractLiteralValue(
	node: ts.TypeNode | ts.Node,
): string | number | boolean | undefined {
	if (ts.isParenthesizedTypeNode(node)) {
		return extractLiteralValue(node.type);
	}
	if (ts.isLiteralTypeNode(node)) {
		return extractLiteralValue(node.literal);
	}
	if (
		ts.isPrefixUnaryExpression(node) &&
		node.operator === ts.SyntaxKind.MinusToken &&
		ts.isNumericLiteral(node.operand)
	) {
		return -Number(node.operand.text);
	}
	if (node.kind === ts.SyntaxKind.TrueKeyword) {
		return true;
	}
	if (node.kind === ts.SyntaxKind.FalseKeyword) {
		return false;
	}
	if (ts.isStringLiteral(node)) {
		return node.text;
	}
	if (ts.isNumericLiteral(node)) {
		return Number(node.text);
	}
	return undefined;
}

function getPropertyName(name: ts.PropertyName): string {
	if (
		ts.isIdentifier(name) ||
		ts.isStringLiteral(name) ||
		ts.isNumericLiteral(name)
	) {
		return name.text;
	}
	throw new Error(`Unsupported property name: ${name.getText()}`);
}

function getSupportedTagName(node: ts.TypeReferenceNode): string | null {
	const typeName = getEntityNameText(node.typeName);
	const [, tagName] = typeName.split(".");
	if (
		!typeName.startsWith("tags.") ||
		tagName === undefined ||
		!SUPPORTED_TAGS.has(tagName)
	) {
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
	return symbol.flags & ts.SymbolFlags.Alias
		? checker.getAliasedSymbol(symbol)
		: symbol;
}

function getReferenceName(
	node: ts.TypeReferenceNode | ts.ExpressionWithTypeArguments,
): string {
	if (ts.isTypeReferenceNode(node)) {
		return getEntityNameText(node.typeName);
	}
	return node.expression.getText();
}

function isProjectLocalDeclaration(
	declaration: ts.Declaration,
	projectRoot: string,
): boolean {
	const fileName = declaration.getSourceFile().fileName;
	return (
		!fileName.includes("node_modules") &&
		!path.relative(projectRoot, fileName).startsWith("..")
	);
}

function isSerializableExternalDeclaration(
	declaration: ts.Declaration,
	ctx: AnalysisContext,
): boolean {
	if (isProjectLocalDeclaration(declaration, ctx.projectRoot)) {
		return true;
	}

	const packageName = getOwningPackageName(
		declaration.getSourceFile().fileName,
		ctx.packageNameCache,
	);
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
				const packageJson = JSON.parse(
					fs.readFileSync(packageJsonPath, "utf8"),
				) as {
					name?: string;
				};
				const packageName =
					typeof packageJson.name === "string" ? packageJson.name : null;
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
