import { describe, expect, test } from "bun:test";

import {
	ARCHIVED_NPM_ENTRYPOINTS,
	renderArchivedNpmDeprecationCommand,
	renderArchivedNpmDeprecationMessage,
	renderArchivedNpmDeprecationPlan,
} from "../../scripts/lib/archived-package-policy.mjs";

describe("archived-package-policy", () => {
	test("renders the archived npm entrypoint deprecation message with the supported migration path", () => {
		expect(renderArchivedNpmDeprecationMessage(ARCHIVED_NPM_ENTRYPOINTS[0])).toBe(
			"create-wp-typia is archived. Use `npx wp-typia create <project-dir>` or `bunx wp-typia create <project-dir>` instead.",
		);
	});

	test("renders copy-pastable npm deprecate commands for archived entrypoints", () => {
		expect(renderArchivedNpmDeprecationCommand(ARCHIVED_NPM_ENTRYPOINTS[0])).toBe(
			'npm deprecate create-wp-typia@"*" "create-wp-typia is archived. Use `npx wp-typia create <project-dir>` or `bunx wp-typia create <project-dir>` instead."',
		);
	});

	test("renders a maintainer-facing deprecation plan", () => {
		expect(renderArchivedNpmDeprecationPlan()).toContain(
			"Archived npm entrypoint deprecation plan:",
		);
		expect(renderArchivedNpmDeprecationPlan()).toContain(
			'npm deprecate create-wp-typia@"*" "create-wp-typia is archived. Use `npx wp-typia create <project-dir>` or `bunx wp-typia create <project-dir>` instead."',
		);
	});
});
