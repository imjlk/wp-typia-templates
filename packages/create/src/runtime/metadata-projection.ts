import { cloneJsonValue } from "./json-utils.js";
import {
	type AttributeNode,
	type BlockJsonAttribute,
	type JsonValue,
	type ManifestAttribute,
	type ManifestDocument,
	getWordPressKind,
} from "./metadata-model.js";

export function createBlockJsonAttribute(
	node: AttributeNode,
	warnings: string[],
): BlockJsonAttribute {
	const attribute: BlockJsonAttribute = {
		type: getWordPressKind(node),
	};

	if (node.defaultValue !== undefined) {
		attribute.default = cloneJsonValue(node.defaultValue);
	}
	if (node.enumValues !== null && node.enumValues.length > 0) {
		attribute.enum = [...node.enumValues];
	}
	if (node.wp.source !== null) {
		attribute.source = node.wp.source;
	}
	if (node.wp.selector !== null) {
		attribute.selector = node.wp.selector;
	}

	const reasons: string[] = [];
	if (node.constraints.exclusiveMaximum !== null)
		reasons.push("exclusiveMaximum");
	if (node.constraints.exclusiveMinimum !== null)
		reasons.push("exclusiveMinimum");
	if (node.constraints.format !== null) reasons.push("format");
	if (node.constraints.maxLength !== null) reasons.push("maxLength");
	if (node.constraints.maxItems !== null) reasons.push("maxItems");
	if (node.constraints.maximum !== null) reasons.push("maximum");
	if (node.constraints.minLength !== null) reasons.push("minLength");
	if (node.constraints.minItems !== null) reasons.push("minItems");
	if (node.constraints.minimum !== null) reasons.push("minimum");
	if (node.constraints.multipleOf !== null) reasons.push("multipleOf");
	if (node.constraints.pattern !== null) reasons.push("pattern");
	if (node.constraints.typeTag !== null) reasons.push("typeTag");
	if (node.kind === "array" && node.items !== undefined) reasons.push("items");
	if (node.kind === "object" && node.properties !== undefined)
		reasons.push("properties");
	if (node.kind === "union" && node.union !== null) reasons.push("union");

	if (reasons.length > 0) {
		warnings.push(`${node.path}: ${reasons.join(", ")}`);
	}

	return attribute;
}

export function createManifestAttribute(node: AttributeNode): ManifestAttribute {
	return {
		typia: {
			constraints: { ...node.constraints },
			defaultValue:
				node.defaultValue === undefined ? null : cloneJsonValue(node.defaultValue),
			hasDefault: node.defaultValue !== undefined,
		},
		ts: {
			items: node.items ? createManifestAttribute(node.items) : null,
			kind: node.kind,
			properties: node.properties
				? Object.fromEntries(
						Object.entries(node.properties).map(([key, property]) => [
							key,
							createManifestAttribute(property),
						]),
				  )
				: null,
			required: node.required,
			union: node.union
				? {
						branches: Object.fromEntries(
							Object.entries(node.union.branches).map(([key, branch]) => [
								key,
								createManifestAttribute(branch),
							]),
						),
						discriminator: node.union.discriminator,
				  }
				: null,
		},
		wp: {
			defaultValue:
				node.defaultValue === undefined ? null : cloneJsonValue(node.defaultValue),
			enum: node.enumValues ? [...node.enumValues] : null,
			hasDefault: node.defaultValue !== undefined,
			...(node.wp.selector !== null ? { selector: node.wp.selector } : {}),
			...(node.wp.source !== null ? { source: node.wp.source } : {}),
			type: getWordPressKind(node),
		},
	};
}

export function createManifestDocument(
	sourceTypeName: string,
	attributes: Record<string, AttributeNode>,
): ManifestDocument {
	return {
		attributes: Object.fromEntries(
			Object.entries(attributes).map(([key, node]) => [
				key,
				createManifestAttribute(node),
			]),
		),
		manifestVersion: 2,
		sourceType: sourceTypeName,
	};
}

export function validateWordPressExtractionAttributes(
	attributes: Record<string, AttributeNode>,
): void {
	for (const attribute of Object.values(attributes)) {
		validateWordPressExtractionAttribute(attribute, true);
	}
}

export function validateWordPressExtractionAttribute(
	node: AttributeNode,
	isTopLevel = false,
): void {
	const hasSelector = node.wp.selector !== null;
	const hasSource = node.wp.source !== null;

	if (hasSelector || hasSource) {
		if (!isTopLevel) {
			throw new Error(
				`WordPress extraction tags are only supported on top-level block attributes at ${node.path}`,
			);
		}
		if (!hasSelector || !hasSource) {
			throw new Error(
				`WordPress extraction tags require both Source and Selector at ${node.path}`,
			);
		}
		if (node.kind !== "string") {
			throw new Error(
				`WordPress extraction tags are only supported on string attributes at ${node.path}`,
			);
		}
	}

	if (node.items !== undefined) {
		validateWordPressExtractionAttribute(node.items, false);
	}
	if (node.properties !== undefined) {
		for (const property of Object.values(node.properties)) {
			validateWordPressExtractionAttribute(property, false);
		}
	}
	if (node.union?.branches) {
		for (const branch of Object.values(node.union.branches)) {
			validateWordPressExtractionAttribute(branch, false);
		}
	}
}

export function createExampleValue(node: AttributeNode, key: string): JsonValue {
	if (node.defaultValue !== undefined) {
		return cloneJsonValue(node.defaultValue);
	}
	if (node.enumValues !== null && node.enumValues.length > 0) {
		return cloneJsonValue(node.enumValues[0]);
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
				Object.entries(node.properties ?? {}).map(
					([propertyKey, propertyNode]) => [
						propertyKey,
						createExampleValue(propertyNode, propertyKey),
					],
				),
			);
		case "union": {
			const firstBranch = node.union
				? Object.values(node.union.branches)[0]
				: undefined;
			if (!firstBranch || firstBranch.kind !== "object") {
				return {};
			}
			return Object.fromEntries(
				Object.entries(firstBranch.properties ?? {}).map(
					([propertyKey, propertyNode]) => [
						propertyKey,
						createExampleValue(propertyNode, propertyKey),
					],
				),
			);
		}
	}
}
