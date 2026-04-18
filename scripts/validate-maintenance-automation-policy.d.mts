export interface MaintenanceAutomationPolicyResult {
  errors: string[];
  valid: boolean;
}

export declare const MAINTENANCE_AUTOMATION_POLICY: Readonly<{
  dependabotEcosystems: readonly string[];
  docsFile: 'apps/docs/src/content/docs/maintainers/maintenance-automation-policy.md';
  docsRequiredSnippets: readonly string[];
  ciScript: 'node scripts/validate-maintenance-automation-policy.mjs';
}>;

export declare function validateMaintenanceAutomationPolicy(
  repoRoot?: string,
): MaintenanceAutomationPolicyResult;

export declare function runCli(options?: {
  cwd?: string;
  stdout?: { write(chunk: string): unknown };
  stderr?: { write(chunk: string): unknown };
}): 0 | 1;
