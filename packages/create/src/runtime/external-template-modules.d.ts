declare module "mustache" {
	interface MustacheStatic {
		escape: (value: string) => string;
		render(template: string, view?: Record<string, unknown>): string;
	}

	const Mustache: MustacheStatic;
	export default Mustache;
}

declare module "npm-package-arg" {
	interface Result {
		fetchSpec?: string;
		name?: string;
		raw: string;
		registry?: boolean;
		type: string;
	}

	function npa(spec: string): Result;

	export default npa;
}

declare module "semver" {
	interface SemVerModule {
		maxSatisfying(versions: readonly string[], range: string): string | null;
	}

	const semver: SemVerModule;
	export default semver;
}
