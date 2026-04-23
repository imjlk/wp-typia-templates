import type { BuiltInCodeArtifact } from "./built-in-block-code-artifacts.js";
import type { ScaffoldTemplateVariables } from "./scaffold.js";
import { renderMustacheTemplateString } from "./template-render.js";

export function renderArtifact(
	relativePath: string,
	template: string,
	view: Record<string, unknown>,
): BuiltInCodeArtifact {
	const source = renderMustacheTemplateString(template, view);
	return {
		relativePath,
		source: source.endsWith("\n") ? source : `${source}\n`,
	};
}

export function buildAlternateRenderEntryArtifact(
	relativePath: string,
	target: "email" | "mjml" | "plain-text" | "web",
	variables: ScaffoldTemplateVariables,
): BuiltInCodeArtifact {
	const template = `<?php
/**
 * Alternate ${target} render entry for {{title}}.
 *
 * @package {{pascalCase}}
 */

if ( ! defined( 'ABSPATH' ) ) {
\texit;
}

require_once __DIR__ . '/render-targets.php';

return {{phpPrefix}}_{{slugSnakeCase}}_render_target( '${target}', $attributes, $content ?? '', $block ?? null );
`;

	return renderArtifact(relativePath, template, variables);
}

export function toPhpSingleQuotedString(value: string): string {
	return `'${value.replace(/\\/g, "\\\\").replace(/'/g, "\\'")}'`;
}
