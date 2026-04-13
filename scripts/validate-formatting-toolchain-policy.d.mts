export interface FormattingToolchainPolicyResult {
	errors: string[];
	valid: boolean;
}

export declare const FORMATTING_TOOLCHAIN_POLICY: Readonly<{
	eslintConfigPrettierVersion: "10.1.8";
	prettierVersion: "3.8.2";
	rootFormatCheckScript: "node scripts/check-repo-format.mjs";
	rootPolicyValidateScript: "node scripts/validate-formatting-toolchain-policy.mjs";
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
