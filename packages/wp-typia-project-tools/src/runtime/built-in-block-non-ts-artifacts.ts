import type { BuiltInCodeArtifact } from "./built-in-block-code-artifacts.js";
import type { ScaffoldTemplateVariables } from "./scaffold.js";
import type { BuiltInTemplateId } from "./template-registry.js";
import { renderMustacheTemplateString } from "./template-render.js";

const BASIC_STYLE_TEMPLATE = `/**
 * {{title}} Block Styles
 */

.{{cssClassName}} {
	padding: 20px;
	border: 1px solid #ddd;
	border-radius: 4px;
	background-color: #fff;
	box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);

	&.is-hidden {
		display: none;
	}

	&__content {
		font-size: 16px;
		line-height: 1.6;
		color: #333;

		// Alignment styles
		&[data-align="center"] {
			text-align: center;
		}

		&[data-align="right"] {
			text-align: right;
		}

		&[data-align="justify"] {
			text-align: justify;
		}
	}

	// Hover state
	&:hover {
		box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
		transition: box-shadow 0.2s ease;
	}
}
`;

const BASIC_EDITOR_STYLE_TEMPLATE = `/**
 * {{title}} Block Editor Styles
 */

.{{cssClassName}} {
	outline: 1px dashed #ddd;
	outline-offset: -1px;
}
`;

const BASIC_RENDER_TEMPLATE = `<?php
/**
 * Optional server render placeholder for {{title}}.
 *
 * The basic scaffold stays static by default. Keep \`src/save.tsx\` as the
 * canonical frontend output unless you intentionally convert this block into a
 * dynamic render path and add \`render\` to \`block.json\`.
 *
 * @package {{slug}}
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

?>
<div class="{{cssClassName}}__server-placeholder" hidden>
	<?php esc_html_e( 'Server render placeholder.', '{{textDomain}}' ); ?>
</div>
`;

const INTERACTIVITY_STYLE_TEMPLATE = `.{{cssClassName}} {
  position: relative;
  padding: 1rem;
  border: 1px solid #dcdcde;
  border-radius: 0.75rem;
  background: #fff;

  &__content {
    display: grid;
    gap: 0.75rem;
  }

  &__counter {
    display: inline-flex;
    gap: 0.35rem;
    align-items: center;
    font-size: 0.9rem;
    font-weight: 600;
  }

  &__progress {
    width: 100%;
    height: 0.5rem;
    overflow: hidden;
    background: #f0f0f1;
    border-radius: 999px;
  }

  &__progress-bar {
    height: 100%;
    background: #3858e9;
    transition: width 0.2s ease;
  }

  &__animation {
    min-height: 1.5rem;
    font-size: 0.85rem;
    color: #3858e9;
    opacity: 0;
    transition: opacity 0.2s ease;

    &.is-active {
      opacity: 1;
    }
  }

  &__completion {
    font-weight: 700;
    color: #06752d;
  }

  &__reset {
    align-self: start;
    padding: 0.4rem 0.7rem;
    border: 1px solid #dcdcde;
    border-radius: 999px;
    background: transparent;
    cursor: pointer;
  }
}
`;

const INTERACTIVITY_EDITOR_STYLE_TEMPLATE = `/**
 * {{title}} Block Editor Styles
 */

.{{cssClassName}} {
	outline: 1px dashed #ddd;
	outline-offset: -1px;
}
`;

const PERSISTENCE_STYLE_TEMPLATE = `.{{cssClassName}} {
	border: 1px solid #dcdcde;
	border-radius: 12px;
	padding: 16px;
	background: #fff;

	&__meta {
		color: #50575e;
		font-size: 13px;
		margin: 8px 0 0;
	}
}

.{{frontendCssClassName}} {
	display: grid;
	gap: 12px;
	border: 1px solid #dcdcde;
	border-radius: 12px;
	padding: 16px;
	background: #f6f7f7;

	&__count {
		display: inline-flex;
		min-width: 3rem;
		justify-content: center;
		font-weight: 700;
	}

	&__notice,
	&__error {
		margin: 0;
		font-size: 13px;
	}

	&__notice {
		color: #50575e;
	}

	&__error {
		color: #b32d2e;
	}

	button {
		width: fit-content;
	}
}
`;

const PERSISTENCE_RENDER_TEMPLATE = `<?php
/**
 * Dynamic render entry for the {{title}} block.
 *
 * @package {{pascalCase}}
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

$validator_path = __DIR__ . '/typia-validator.php';
if ( ! file_exists( $validator_path ) ) {
	return '';
}

$validator = require $validator_path;
if ( ! is_object( $validator ) || ! method_exists( $validator, 'apply_defaults' ) || ! method_exists( $validator, 'validate' ) ) {
	return '';
}

$normalized   = $validator->apply_defaults( is_array( $attributes ) ? $attributes : array() );
$validation   = $validator->validate( $normalized );
$resource_key = isset( $normalized['resourceKey'] ) ? (string) $normalized['resourceKey'] : '';

if ( empty( $validation['valid'] ) || '' === $resource_key ) {
	return '';
}

$alignment          = isset( $normalized['alignment'] ) ? (string) $normalized['alignment'] : 'left';
$button_label       = isset( $normalized['buttonLabel'] ) ? (string) $normalized['buttonLabel'] : 'Persist Count';
$content            = isset( $normalized['content'] ) ? (string) $normalized['content'] : '';
$post_id            = is_object( $block ) && isset( $block->context['postId'] )
	? (int) $block->context['postId']
	: (int) get_queried_object_id();
$storage_mode       = '{{dataStorageMode}}';
$persistence_policy = '{{persistencePolicy}}';

{{phpPrefix}}_record_rendered_block_instance(
	(int) $post_id,
	'{{namespace}}/{{slugKebabCase}}',
	$resource_key
);

$notice_message     = 'authenticated' === $persistence_policy
	? __( 'Sign in to persist this counter.', '{{textDomain}}' )
	: __( 'Public writes are temporarily unavailable.', '{{textDomain}}' );
$context            = array(
	'bootstrapReady'       => false,
	'buttonLabel'          => $button_label,
	'canWrite'             => false,
	'client'               => array(
		'writeExpiry' => 0,
		'writeNonce'  => '',
		'writeToken'  => '',
	),
	'count'                => 0,
	'error'                => '',
	'isBootstrapping'      => false,
	'isLoading'            => false,
	'isSaving'             => false,
	'isVisible'            => ! empty( $normalized['isVisible'] ),
	'persistencePolicy'    => $persistence_policy,
	'postId'               => (int) $post_id,
	'resourceKey'          => $resource_key,
	'storage'              => $storage_mode,
);

$wrapper_attributes = get_block_wrapper_attributes(
	array(
		'data-wp-context'       => wp_json_encode( $context ),
		'data-wp-interactive'   => '{{slugKebabCase}}',
		'data-wp-init'          => 'callbacks.init',
		'data-wp-run--mounted' => 'callbacks.mounted',
	)
);
?>

<div <?php echo $wrapper_attributes; ?>>
	<div class="{{frontendCssClassName}}">
		<p class="{{frontendCssClassName}}__content" style="<?php echo esc_attr( 'text-align:' . $alignment ); ?>">
			<?php echo esc_html( $content ); ?>
		</p>
		<p
			class="{{frontendCssClassName}}__notice"
			data-wp-bind--hidden="!context.bootstrapReady || context.canWrite"
			hidden
		>
			<?php echo esc_html( $notice_message ); ?>
		</p>
		<p
			class="{{frontendCssClassName}}__error"
			role="status"
			aria-live="polite"
			aria-atomic="true"
			data-wp-bind--hidden="!context.error"
			data-wp-text="context.error"
			hidden
		></p>
		<?php if ( ! empty( $normalized['showCount'] ) ) : ?>
			<span
				class="{{frontendCssClassName}}__count"
				role="status"
				aria-live="polite"
				aria-atomic="true"
				data-wp-text="context.count"
			>
				0
			</span>
		<?php endif; ?>
		<button
			type="button"
			disabled
			data-wp-bind--disabled="!context.canWrite"
			data-wp-on--click="actions.increment"
		>
			<?php echo esc_html( $button_label ); ?>
		</button>
	</div>
</div>
`;

const COMPOUND_STYLE_TEMPLATE = `.{{cssClassName}} {
	border: 1px solid #dcdcde;
	border-radius: 12px;
	padding: 1.25rem;
	background: #fff;
}

.{{cssClassName}}__heading {
	margin: 0 0 0.5rem;
	font-size: 1.2rem;
}

.{{cssClassName}}__intro {
	margin: 0 0 1rem;
	color: #50575e;
}

.{{cssClassName}}__items {
	display: grid;
	gap: 0.75rem;
}

.{{cssClassName}}[data-show-dividers='true'] .{{compoundChildCssClassName}} {
	border-top: 1px solid #dcdcde;
	padding-top: 0.75rem;
}

.{{cssClassName}}[data-show-dividers='true'] .{{compoundChildCssClassName}}:first-child {
	border-top: 0;
	padding-top: 0;
}
`;

function renderArtifact(
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

function toPhpSingleQuotedString(value: string): string {
	return `'${value.replace(/\\/g, "\\\\").replace(/'/g, "\\'")}'`;
}

function buildBasicArtifacts(
	variables: ScaffoldTemplateVariables,
): BuiltInCodeArtifact[] {
	return [
		renderArtifact("src/editor.scss", BASIC_EDITOR_STYLE_TEMPLATE, variables),
		renderArtifact("src/style.scss", BASIC_STYLE_TEMPLATE, variables),
		renderArtifact("src/render.php", BASIC_RENDER_TEMPLATE, variables),
	];
}

function buildInteractivityArtifacts(
	variables: ScaffoldTemplateVariables,
): BuiltInCodeArtifact[] {
	return [
		renderArtifact(
			"src/editor.scss",
			INTERACTIVITY_EDITOR_STYLE_TEMPLATE,
			variables,
		),
		renderArtifact("src/style.scss", INTERACTIVITY_STYLE_TEMPLATE, variables),
	];
}

function buildPersistenceArtifacts(
	variables: ScaffoldTemplateVariables,
): BuiltInCodeArtifact[] {
	return [
		renderArtifact("src/style.scss", PERSISTENCE_STYLE_TEMPLATE, variables),
		renderArtifact("src/render.php", PERSISTENCE_RENDER_TEMPLATE, variables),
	];
}

function buildCompoundArtifacts(
	variables: ScaffoldTemplateVariables,
): BuiltInCodeArtifact[] {
	const artifacts = [
		renderArtifact(
			`src/blocks/${variables.slugKebabCase}/style.scss`,
			COMPOUND_STYLE_TEMPLATE,
			variables,
		),
	];

	if (variables.compoundPersistenceEnabled === "true") {
		const renderView = {
			...variables,
			titlePhpLiteral: toPhpSingleQuotedString(variables.title),
		};
		const renderSource = `<?php
/**
 * Dynamic render entry for the {{title}} compound parent block.
 *
 * @package {{pascalCase}}
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

$validator_path = __DIR__ . '/typia-validator.php';
if ( ! file_exists( $validator_path ) ) {
	return '';
}

$validator = require $validator_path;
if ( ! is_object( $validator ) || ! method_exists( $validator, 'apply_defaults' ) || ! method_exists( $validator, 'validate' ) ) {
	return '';
}

$normalized         = $validator->apply_defaults( is_array( $attributes ) ? $attributes : array() );
$validation         = $validator->validate( $normalized );
$resource_key       = isset( $normalized['resourceKey'] ) ? (string) $normalized['resourceKey'] : '';
$heading            = isset( $normalized['heading'] ) ? (string) $normalized['heading'] : {{titlePhpLiteral}};
$intro              = isset( $normalized['intro'] ) ? (string) $normalized['intro'] : '';
$button_label       = isset( $normalized['buttonLabel'] ) ? (string) $normalized['buttonLabel'] : 'Persist Count';
$show_count         = ! empty( $normalized['showCount'] );
$show_dividers      = ! empty( $normalized['showDividers'] );
$post_id            = is_object( $block ) && isset( $block->context['postId'] )
	? (int) $block->context['postId']
	: (int) get_queried_object_id();
$storage_mode       = '{{dataStorageMode}}';
$persistence_policy = '{{persistencePolicy}}';

{{phpPrefix}}_record_rendered_block_instance(
	(int) $post_id,
	'{{namespace}}/{{slugKebabCase}}',
	$resource_key
);

$notice_message    = 'authenticated' === $persistence_policy
	? __( 'Sign in to persist this counter.', '{{textDomain}}' )
	: __( 'Public writes are temporarily unavailable.', '{{textDomain}}' );

if ( empty( $validation['valid'] ) || '' === $resource_key ) {
	return '';
}

$context = array(
	'bootstrapReady'       => false,
	'buttonLabel'          => $button_label,
	'canWrite'             => false,
	'client'               => array(
		'writeExpiry' => 0,
		'writeNonce'  => '',
		'writeToken'  => '',
	),
	'count'                => 0,
	'error'                => '',
	'isBootstrapping'      => false,
	'isLoading'            => false,
	'isSaving'             => false,
	'persistencePolicy'    => $persistence_policy,
	'postId'               => (int) $post_id,
	'resourceKey'          => $resource_key,
	'showCount'            => $show_count,
	'storage'              => $storage_mode,
);

$allowed_inner_html = wp_kses_allowed_html( 'post' );

foreach ( $allowed_inner_html as &$allowed_attributes ) {
	if ( ! is_array( $allowed_attributes ) ) {
		continue;
	}

	$allowed_attributes['data-wp-bind--disabled'] = true;
	$allowed_attributes['data-wp-bind--hidden'] = true;
	$allowed_attributes['data-wp-bind--value'] = true;
	$allowed_attributes['data-wp-class'] = true;
	$allowed_attributes['data-wp-class--active'] = true;
	$allowed_attributes['data-wp-context'] = true;
	$allowed_attributes['data-wp-init'] = true;
	$allowed_attributes['data-wp-interactive'] = true;
	$allowed_attributes['data-wp-on--click'] = true;
	$allowed_attributes['data-wp-on--mouseenter'] = true;
	$allowed_attributes['data-wp-on--mouseleave'] = true;
	$allowed_attributes['data-wp-run--mounted'] = true;
	$allowed_attributes['data-wp-style--width'] = true;
	$allowed_attributes['data-wp-text'] = true;
}
unset( $allowed_attributes );

$sanitized_content = wp_kses( $content, $allowed_inner_html );

$wrapper_attributes = get_block_wrapper_attributes(
	array(
		'class'                => '{{cssClassName}}',
		'data-show-dividers'   => $show_dividers ? 'true' : 'false',
		'data-wp-context'      => wp_json_encode( $context ),
		'data-wp-init'         => 'callbacks.init',
		'data-wp-interactive'  => '{{slugKebabCase}}',
		'data-wp-run--mounted' => 'callbacks.mounted',
	)
);
?>

<div <?php echo $wrapper_attributes; ?>>
	<h3 class="{{cssClassName}}__heading"><?php echo esc_html( $heading ); ?></h3>
	<?php if ( '' !== $intro ) : ?>
		<p class="{{cssClassName}}__intro"><?php echo esc_html( $intro ); ?></p>
	<?php endif; ?>
	<p
		class="{{cssClassName}}__notice"
		data-wp-bind--hidden="!context.bootstrapReady || context.canWrite"
		hidden
	>
		<?php echo esc_html( $notice_message ); ?>
	</p>
	<p
		class="{{cssClassName}}__error"
		role="status"
		aria-live="polite"
		aria-atomic="true"
		data-wp-bind--hidden="!context.error"
		data-wp-text="context.error"
		hidden
	></p>
	<?php if ( $show_count ) : ?>
		<div class="{{cssClassName}}__counter">
			<span
				class="{{cssClassName}}__count"
				role="status"
				aria-live="polite"
				aria-atomic="true"
				data-wp-text="context.count"
			>0</span>
			<button
				type="button"
				disabled
				data-wp-bind--disabled="!context.canWrite"
				data-wp-on--click="actions.increment"
			>
				<?php echo esc_html( $button_label ); ?>
			</button>
		</div>
	<?php endif; ?>
	<div class="{{cssClassName}}__items">
		<?php echo $sanitized_content; ?>
	</div>
</div>
`;
		artifacts.push(
			renderArtifact(
				`src/blocks/${variables.slugKebabCase}/render.php`,
				renderSource,
				renderView,
			),
		);
	}

	return artifacts;
}

export function buildBuiltInNonTsArtifacts({
	templateId,
	variables,
}: {
	templateId: BuiltInTemplateId;
	variables: ScaffoldTemplateVariables;
}): BuiltInCodeArtifact[] {
	switch (templateId) {
		case "basic":
			return buildBasicArtifacts(variables);
		case "interactivity":
			return buildInteractivityArtifacts(variables);
		case "persistence":
			return buildPersistenceArtifacts(variables);
		case "compound":
			return buildCompoundArtifacts(variables);
		default: {
			const unhandledTemplateId: never = templateId;
			throw new Error(`Unhandled built-in template id: ${unhandledTemplateId}`);
		}
	}
}
