import type { ScaffoldTemplateVariables } from "../../packages/create/src/runtime/scaffold";

export function createTestScaffoldTemplateVariables(
	overrides: Partial<ScaffoldTemplateVariables> = {},
): ScaffoldTemplateVariables {
	const base: ScaffoldTemplateVariables = {
		apiClientPackageVersion: "^0.2.0",
		author: "Test Author",
		blockRuntimePackageVersion: "^0.2.3",
		blockTypesPackageVersion: "^0.2.0",
		category: "widgets",
		compoundChildTitle: "Demo Item",
		compoundChildTitleJson: JSON.stringify("Demo Item"),
		compoundPersistenceEnabled: "false",
		createPackageVersion: "^0.8.0",
		cssClassName: "wp-block-demo-block",
		dashCase: "demo-block",
		dashicon: "smiley",
		dataStorageMode: "custom-table",
		description: "Demo description",
		isAuthenticatedPersistencePolicy: "true",
		isPublicPersistencePolicy: "false",
		keyword: "demo",
		namespace: "demo",
		needsMigration: "false",
		pascalCase: "DemoBlock",
		persistencePolicy: "authenticated",
		phpPrefix: "demo_block",
		phpPrefixUpper: "DEMO_BLOCK",
		publicWriteRequestIdDeclaration: "publicWriteRequestId?: string;",
		restPackageVersion: "^0.2.0",
		restWriteAuthIntent: "authenticated",
		restWriteAuthMechanism: "rest-nonce",
		restWriteAuthMode: "authenticated-rest-nonce",
		slug: "demo-block",
		slugCamelCase: "demoBlock",
		slugKebabCase: "demo-block",
		slugSnakeCase: "demo_block",
		textDomain: "demo-block",
		textdomain: "demo-block",
		title: "Demo Block",
		titleCase: "Demo Block",
		titleJson: JSON.stringify("Demo Block"),
	};

	return {
		...base,
		...overrides,
	} as ScaffoldTemplateVariables;
}
