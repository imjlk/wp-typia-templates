import { describe, expect, test } from "bun:test";
import packageJson from "../package.json";

import {
	buildCreateCompletionPayload,
	buildCreateDryRunPayload,
	formatCreateProgressLine,
	buildMigrationCompletionPayload,
	printCompletionPayload,
} from "../src/runtime-bridge";

describe("alternate-buffer completion output helpers", () => {
	test("create completion payload preserves reviewable next steps and optional onboarding", () => {
		const payload = buildCreateCompletionPayload({
			nextSteps: ["cd demo-block", "npm install", "npm run dev"],
			optionalOnboarding: {
				note: "Run npm run sync before your first commit if you edited types.",
				steps: ["npm run sync"],
			},
			packageManager: "npm",
			projectDir: "/tmp/demo-block",
			result: {
				selectedVariant: "hero",
				variables: {
					title: "Demo Block",
				},
				warnings: ["This template enables optional migration UI."],
			},
		});

		expect(payload.title).toBe("✅ Created Demo Block in /tmp/demo-block");
		expect(payload.preambleLines).toEqual(["Template variant: hero"]);
		expect(payload.warningLines).toEqual(["This template enables optional migration UI."]);
		expect(payload.nextSteps).toEqual(["cd demo-block", "npm install", "npm run dev"]);
		expect(payload.optionalTitle).toBe("Verify and sync (optional):");
		expect(payload.optionalLines).toEqual([
			`npx --yes wp-typia@${packageJson.version} doctor`,
			"npm run sync",
		]);
		expect(payload.optionalNote).toContain("npm run sync");
	});

	test("completion printer keeps warning and next-step ordering stable", () => {
		const printed: string[] = [];
		const warned: string[] = [];

		printCompletionPayload(
			{
				nextSteps: ["cd demo-block", "npm install"],
				optionalLines: [
					`npx --yes wp-typia@${packageJson.version} doctor`,
					"npm run sync",
				],
				optionalNote: "Review the generated metadata before first commit.",
				optionalTitle: "Verify and sync (optional):",
				preambleLines: ["Template variant: hero"],
				summaryLines: ["Project directory: /tmp/demo-block"],
				title: "✅ Created Demo Block in /tmp/demo-block",
				warningLines: ["This template enables optional migration UI."],
			},
			{
				printLine: (line) => printed.push(line),
				warnLine: (line) => warned.push(line),
			},
		);

		expect(warned).toEqual(["⚠️ This template enables optional migration UI."]);
		expect(printed).toEqual([
			"Template variant: hero",
			"\n✅ Created Demo Block in /tmp/demo-block",
			"Project directory: /tmp/demo-block",
			"Next steps:",
			"  cd demo-block",
			"  npm install",
			"\nVerify and sync (optional):",
			`  npx --yes wp-typia@${packageJson.version} doctor`,
			"  npm run sync",
			"Note: Review the generated metadata before first commit.",
		]);
	});

	test("completion printer keeps warnings on the same stream by default", () => {
		const printed: string[] = [];

		printCompletionPayload(
			{
				summaryLines: ["Project directory: /tmp/demo-block"],
				title: "✅ Created Demo Block in /tmp/demo-block",
				warningLines: ["This template enables optional migration UI."],
			},
			{
				printLine: (line) => printed.push(line),
			},
		);

		expect(printed).toEqual([
			"⚠️ This template enables optional migration UI.",
			"\n✅ Created Demo Block in /tmp/demo-block",
			"Project directory: /tmp/demo-block",
		]);
	});

	test("completion printer avoids a leading blank line when no preamble or warnings were emitted", () => {
		const printed: string[] = [];

		printCompletionPayload(
			{
				summaryLines: ["Project directory: /tmp/demo-block"],
				title: "✅ Created Demo Block in /tmp/demo-block",
			},
			{
				printLine: (line) => printed.push(line),
			},
		);

		expect(printed).toEqual([
			"✅ Created Demo Block in /tmp/demo-block",
			"Project directory: /tmp/demo-block",
		]);
	});

	test("migration completion payload keeps rendered lines reviewable in order", () => {
		const payload = buildMigrationCompletionPayload({
			command: "plan",
			lines: [
				"Current migration version: v3",
				"Selected migration edge: v1 -> v3",
				"Next steps:",
				"  wp-typia migrate scaffold --from-migration-version v1",
			],
		});

		expect(payload.title).toBe("✅ Completed wp-typia migrate plan");
		expect(payload.summaryLines).toEqual([
			"Current migration version: v3",
			"Selected migration edge: v1 -> v3",
			"Next steps:",
			"  wp-typia migrate scaffold --from-migration-version v1",
		]);
	});

	test("create progress formatter keeps fallback status lines readable", () => {
		expect(
			formatCreateProgressLine({
				detail: "Copying scaffold files into the target project directory.",
				title: "Generating project files",
			}),
		).toBe(
			"⏳ Generating project files: Copying scaffold files into the target project directory.",
		);
	});

	test("dry-run create payload summarizes the planned scaffold without next steps", () => {
		const payload = buildCreateDryRunPayload({
			packageManager: "npm",
			plan: {
				dependencyInstall: "would-install",
				files: ["README.md", "package.json", "src/index.tsx"],
			},
			projectDir: "/tmp/demo-block",
			result: {
				selectedVariant: null,
				templateId: "basic",
				variables: {
					title: "Demo Block",
				},
				warnings: [],
			},
		});

		expect(payload.title).toBe("🧪 Dry run for Demo Block at /tmp/demo-block");
		expect(payload.summaryLines).toEqual([
			"Project directory: /tmp/demo-block",
			"Template: basic",
			"Package manager: npm",
			"Dependency install: would run during a real scaffold",
		]);
		expect(payload.optionalTitle).toBe("Planned files (3):");
		expect(payload.optionalLines).toEqual([
			"write README.md",
			"write package.json",
			"write src/index.tsx",
		]);
		expect(payload.nextSteps).toBeUndefined();
		expect(payload.optionalNote).toContain("--dry-run");
	});

	test("dry-run create payload preserves the skipped-by-flag dependency wording", () => {
		const payload = buildCreateDryRunPayload({
			packageManager: "npm",
			plan: {
				dependencyInstall: "skipped-by-flag",
				files: ["package.json"],
			},
			projectDir: "/tmp/demo-block",
			result: {
				selectedVariant: null,
				templateId: "basic",
				variables: {
					title: "Demo Block",
				},
				warnings: [],
			},
		});

		expect(payload.summaryLines).toContain(
			"Dependency install: already skipped via --no-install",
		);
	});
});
