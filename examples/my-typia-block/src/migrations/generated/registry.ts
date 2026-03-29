import currentManifest from "../../../typia.manifest.json";
import type { ManifestDocument } from "../helpers";

interface MigrationRegistryEntry {
	fromVersion: string;
	manifest: ManifestDocument;
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
	entries: [],
};

export default migrationRegistry;
