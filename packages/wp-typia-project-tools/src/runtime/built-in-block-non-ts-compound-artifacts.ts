import type { BuiltInCodeArtifact } from "./built-in-block-code-artifacts.js";
import {
	buildAlternateRenderEntryArtifact,
	renderArtifact,
	toPhpSingleQuotedString,
} from "./built-in-block-non-ts-render-utils.js";
import type { ScaffoldTemplateVariables } from "./scaffold.js";
import {
	getScaffoldAlternateRenderTargets,
	isCompoundPersistenceEnabled,
} from "./scaffold-template-variable-groups.js";

const COMPOUND_PERSISTENCE_RENDER_TARGETS_TEMPLATE = `<?php
/**
 * Alternate render target helpers for the {{title}} compound parent block.
 *
 * @package {{pascalCase}}
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

if ( ! function_exists( '{{phpPrefix}}_{{slugSnakeCase}}_build_render_context' ) ) {
	function {{phpPrefix}}_{{slugSnakeCase}}_build_render_context( $attributes, $content, $block ) {
		$validator_path = __DIR__ . '/typia-validator.php';
		if ( ! file_exists( $validator_path ) ) {
			return null;
		}

		$validator = require $validator_path;
		if ( ! is_object( $validator ) || ! method_exists( $validator, 'apply_defaults' ) || ! method_exists( $validator, 'validate' ) ) {
			return null;
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

		$notice_message = 'authenticated' === $persistence_policy
			? __( 'Sign in to persist this counter.', '{{textDomain}}' )
			: __( 'Public writes are temporarily unavailable.', '{{textDomain}}' );

		if ( empty( $validation['valid'] ) || '' === $resource_key ) {
			return null;
		}

		{{phpPrefix}}_record_rendered_block_instance(
			(int) $post_id,
			'{{namespace}}/{{slugKebabCase}}',
			$resource_key
		);

		$web_context = array(
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

		return array(
			'buttonLabel'       => $button_label,
			'frontendClassName' => '{{cssClassName}}',
			'heading'           => $heading,
			'intro'             => $intro,
			'isVisible'         => true,
			'normalized'        => $normalized,
			'noticeMessage'     => $notice_message,
			'postId'            => (int) $post_id,
			'resourceKey'       => $resource_key,
			'sanitizedContent'  => wp_kses( $content, $allowed_inner_html ),
			'showCount'         => $show_count,
			'showDividers'      => $show_dividers,
			'title'             => {{titleJson}},
			'webContext'        => $web_context,
		);
	}
}

if ( ! function_exists( '{{phpPrefix}}_{{slugSnakeCase}}_render_target' ) ) {
	function {{phpPrefix}}_{{slugSnakeCase}}_render_target( string $target, $attributes, $content = '', $block = null ): string {
		$context = {{phpPrefix}}_{{slugSnakeCase}}_build_render_context( $attributes, $content, $block );
		if ( null === $context ) {
			return '';
		}

		$target_context = apply_filters(
			'{{phpPrefix}}_{{slugSnakeCase}}_render_target_context',
			$context,
			$target,
			$attributes,
			$block
		);

		$markup = '';
		switch ( $target ) {
			case 'email':
				$parts = array(
					'<div class="' . esc_attr( $target_context['frontendClassName'] ) . '-email">',
					'<h3>' . esc_html( $target_context['heading'] ) . '</h3>',
				);
				if ( '' !== $target_context['intro'] ) {
					$parts[] = '<p>' . esc_html( $target_context['intro'] ) . '</p>';
				}
				if ( ! empty( $target_context['showCount'] ) ) {
					$parts[] = '<p><strong>' . esc_html__( 'Count', '{{textDomain}}' ) . ':</strong> ' . esc_html( (string) $target_context['webContext']['count'] ) . '</p>';
				}
				$parts[] = wp_kses_post( $target_context['sanitizedContent'] );
				$parts[] = '<p>' . esc_html( $target_context['noticeMessage'] ) . '</p>';
				$parts[] = '</div>';
				$markup = implode( '', $parts );
				break;
			case 'mjml':
				$markup = '<mjml><mj-body><mj-section><mj-column><mj-text font-weight="700">' . esc_html( $target_context['heading'] ) . '</mj-text>';
				if ( '' !== $target_context['intro'] ) {
					$markup .= '<mj-text>' . esc_html( $target_context['intro'] ) . '</mj-text>';
				}
				if ( ! empty( $target_context['showCount'] ) ) {
					$markup .= '<mj-text>' . esc_html__( 'Count', '{{textDomain}}' ) . ': ' . esc_html( (string) $target_context['webContext']['count'] ) . '</mj-text>';
				}
				$markup .= '<mj-text>' . esc_html( wp_strip_all_tags( $target_context['sanitizedContent'] ) ) . '</mj-text>';
				$markup .= '<mj-text>' . esc_html( $target_context['noticeMessage'] ) . '</mj-text></mj-column></mj-section></mj-body></mjml>';
				break;
			case 'plain-text':
				$markup = implode(
					"\\n",
					array_filter(
						array(
							$target_context['heading'],
							$target_context['intro'],
							wp_strip_all_tags( $target_context['sanitizedContent'] ),
							! empty( $target_context['showCount'] )
								? sprintf( '%s: %s', __( 'Count', '{{textDomain}}' ), (string) $target_context['webContext']['count'] )
								: null,
							$target_context['noticeMessage'],
						),
						static fn( $value ) => is_string( $value ) && '' !== $value
					)
				);
				break;
			case 'web':
			default:
				$wrapper_attributes = get_block_wrapper_attributes(
					array(
						'class'                => '{{cssClassName}}',
						'data-show-dividers'   => $target_context['showDividers'] ? 'true' : 'false',
						'data-wp-context'      => wp_json_encode( $target_context['webContext'] ),
						'data-wp-init'         => 'callbacks.init',
						'data-wp-interactive'  => '{{slugKebabCase}}',
						'data-wp-run--mounted' => 'callbacks.mounted',
					)
				);
				ob_start();
				?>
<div <?php echo $wrapper_attributes; ?>>
	<h3 class="{{cssClassName}}__heading"><?php echo esc_html( $target_context['heading'] ); ?></h3>
	<?php if ( '' !== $target_context['intro'] ) : ?>
		<p class="{{cssClassName}}__intro"><?php echo esc_html( $target_context['intro'] ); ?></p>
	<?php endif; ?>
	<p
		class="{{cssClassName}}__notice"
		data-wp-bind--hidden="!context.bootstrapReady || context.canWrite"
		hidden
	>
		<?php echo esc_html( $target_context['noticeMessage'] ); ?>
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
	<?php if ( ! empty( $target_context['showCount'] ) ) : ?>
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
				<?php echo esc_html( $target_context['buttonLabel'] ); ?>
			</button>
		</div>
	<?php endif; ?>
	<div class="{{cssClassName}}__items">
		<?php echo wp_kses_post( $target_context['sanitizedContent'] ); ?>
	</div>
</div>
				<?php
				$markup = (string) ob_get_clean();
				break;
		}

		return apply_filters(
			'{{phpPrefix}}_{{slugSnakeCase}}_render_target_markup',
			$markup,
			$target,
			$target_context
		);
	}
}
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

/**
 * Builds the compound family non-TypeScript scaffold artifacts.
 *
 * @param variables Scaffold template variables used to render the artifact set.
 * @returns The compound SCSS and PHP artifacts, including persistence variants when enabled.
 */
export function buildCompoundArtifacts(
	variables: ScaffoldTemplateVariables,
): BuiltInCodeArtifact[] {
	const alternateRenderTargets = getScaffoldAlternateRenderTargets(variables);
	const artifacts = [
		renderArtifact(
			`src/blocks/${variables.slugKebabCase}/style.scss`,
			COMPOUND_STYLE_TEMPLATE,
			variables,
		),
	];

	if (isCompoundPersistenceEnabled(variables)) {
		const renderView = {
			...variables,
			titlePhpLiteral: toPhpSingleQuotedString(variables.title),
		};
		if (alternateRenderTargets.enabled) {
			artifacts.push(
				renderArtifact(
					`src/blocks/${variables.slugKebabCase}/render-targets.php`,
					COMPOUND_PERSISTENCE_RENDER_TARGETS_TEMPLATE,
					renderView,
				),
				buildAlternateRenderEntryArtifact(
					`src/blocks/${variables.slugKebabCase}/render.php`,
					"web",
					variables,
				),
			);
			if (alternateRenderTargets.hasEmail) {
				artifacts.push(
					buildAlternateRenderEntryArtifact(
						`src/blocks/${variables.slugKebabCase}/render-email.php`,
						"email",
						variables,
					),
				);
			}
			if (alternateRenderTargets.hasMjml) {
				artifacts.push(
					buildAlternateRenderEntryArtifact(
						`src/blocks/${variables.slugKebabCase}/render-mjml.php`,
						"mjml",
						variables,
					),
				);
			}
			if (alternateRenderTargets.hasPlainText) {
				artifacts.push(
					buildAlternateRenderEntryArtifact(
						`src/blocks/${variables.slugKebabCase}/render-text.php`,
						"plain-text",
						variables,
					),
				);
			}
			return artifacts;
		}
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

$notice_message    = 'authenticated' === $persistence_policy
	? __( 'Sign in to persist this counter.', '{{textDomain}}' )
	: __( 'Public writes are temporarily unavailable.', '{{textDomain}}' );

if ( empty( $validation['valid'] ) || '' === $resource_key ) {
	return '';
}

{{phpPrefix}}_record_rendered_block_instance(
	(int) $post_id,
	'{{namespace}}/{{slugKebabCase}}',
	$resource_key
);

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
