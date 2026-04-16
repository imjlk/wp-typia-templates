export declare const LINT_CONFIG_FILES: readonly string[];

export declare function hasExplicitLintTargets(args: string[]): boolean;

export declare function runWpScriptsLintJsCompat(options?: {
  args?: string[];
  cwd?: string;
  env?: NodeJS.ProcessEnv;
}): number;
