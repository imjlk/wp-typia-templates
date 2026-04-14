/* eslint-disable prettier/prettier, @typescript-eslint/method-signature-style */
import { parseManifestDocument } from '@wp-typia/block-runtime/editor';
import currentManifest from '../../../typia.manifest.json';
import type { ManifestDocument, MigrationRiskSummary } from '../helpers';

interface MigrationRegistryEntry {
	fromMigrationVersion: string;
	manifest: ManifestDocument;
	riskSummary: MigrationRiskSummary;
	rule: {
		migrate(input: Record<string, unknown>): Record<string, unknown>;
		unresolved?: readonly string[];
	};
}

export const migrationRegistry: {
	currentMigrationVersion: string;
	currentManifest: ManifestDocument;
	entries: MigrationRegistryEntry[];
} = {
	currentMigrationVersion: 'v1',
	currentManifest: parseManifestDocument< ManifestDocument >( currentManifest ),
	entries: [],
};

export default migrationRegistry;
