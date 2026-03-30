/* eslint-disable prettier/prettier, @typescript-eslint/method-signature-style */
import currentManifest from "../../../typia.manifest.json";
import type { ManifestDocument, MigrationRiskSummary } from "../helpers";

interface MigrationRegistryEntry {
	fromVersion: string;
	manifest: ManifestDocument;
	riskSummary: MigrationRiskSummary;
	rule: {
		migrate(input: Record<string, unknown>): Record<string, unknown>;
		unresolved?: readonly string[];
	};
}

export const migrationRegistry: {
	currentVersion: string;
	currentManifest: ManifestDocument;
	entries: MigrationRegistryEntry[];
} = {
	currentVersion: "1.0.0",
	currentManifest: currentManifest as ManifestDocument,
	entries: [

	],
};

export default migrationRegistry;
