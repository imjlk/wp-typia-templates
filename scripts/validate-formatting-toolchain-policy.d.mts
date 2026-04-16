export interface FormattingToolchainPolicyResult {
	errors: string[];
	valid: boolean;
}

export declare const FORMATTING_TOOLCHAIN_POLICY: Readonly<{
	eslintJsVersion: "9.39.4";
	eslintVersion: "9.39.4";
	eslintConfigPrettierVersion: "10.1.8";
	prettierVersion: "3.8.2";
	rootFormatCheckScript: "node scripts/check-repo-format.mjs";
	rootFormatWriteScript: "node scripts/check-repo-format.mjs --write";
	rootLintFixScript: "eslint . --fix --max-warnings=0";
	rootLintScript: "eslint . --max-warnings=0";
	rootPolicyValidateScript: "node scripts/validate-formatting-toolchain-policy.mjs";
	typescriptEslintVersion: "8.58.2";
	generatedPackageManifestPaths: readonly string[];
	workspaceExamplePackagePaths: readonly string[];
}>;

export declare function validateFormattingToolchainPolicy(
	repoRoot?: string,
): FormattingToolchainPolicyResult;

export declare function runCli(options?: {
	cwd?: string;
	stdout?: { write(chunk: string): unknown };
	stderr?: { write(chunk: string): unknown };
}): 0 | 1;
