import type { BuiltInCodeArtifact } from "./built-in-block-code-artifacts.js";
import {
	buildAlternateRenderEntryArtifact,
	renderArtifact,
} from "./built-in-block-non-ts-render-utils.js";
import type { ScaffoldTemplateVariables } from "./scaffold.js";
import { getScaffoldAlternateRenderTargets } from "./scaffold-template-variable-groups.js";

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

const PERSISTENCE_RENDER_TARGETS_TEMPLATE = `<?php
/**
 * Alternate render target helpers for the {{title}} block.
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

		$normalized   = $validator->apply_defaults( is_array( $attributes ) ? $attributes : array() );
		$validation   = $validator->validate( $normalized );
		$resource_key = isset( $normalized['resourceKey'] ) ? (string) $normalized['resourceKey'] : '';

		if ( empty( $validation['valid'] ) || '' === $resource_key ) {
			return null;
		}

		$alignment          = isset( $normalized['alignment'] ) ? (string) $normalized['alignment'] : 'left';
		$button_label       = isset( $normalized['buttonLabel'] ) ? (string) $normalized['buttonLabel'] : 'Persist Count';
		$rendered_content   = isset( $normalized['content'] ) ? (string) $normalized['content'] : '';
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

		$notice_message = 'authenticated' === $persistence_policy
			? __( 'Sign in to persist this counter.', '{{textDomain}}' )
			: __( 'Public writes are temporarily unavailable.', '{{textDomain}}' );
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
			'isVisible'            => ! empty( $normalized['isVisible'] ),
			'persistencePolicy'    => $persistence_policy,
			'postId'               => (int) $post_id,
			'resourceKey'          => $resource_key,
			'storage'              => $storage_mode,
		);

		return array(
			'alignment'         => $alignment,
			'buttonLabel'       => $button_label,
			'content'           => $rendered_content,
			'frontendClassName' => '{{frontendCssClassName}}',
			'isVisible'         => ! empty( $normalized['isVisible'] ),
			'normalized'        => $normalized,
			'noticeMessage'     => $notice_message,
			'postId'            => (int) $post_id,
			'resourceKey'       => $resource_key,
			'showCount'         => ! empty( $normalized['showCount'] ),
			'title'             => {{titleJson}},
			'webContext'        => $web_context,
		);
	}
}

if ( ! function_exists( '{{phpPrefix}}_{{slugSnakeCase}}_render_target' ) ) {
	function {{phpPrefix}}_{{slugSnakeCase}}_render_target( string $target, $attributes, $content = '', $block = null ): string {
		$context = {{phpPrefix}}_{{slugSnakeCase}}_build_render_context( $attributes, $content, $block );
		if ( null === $context || empty( $context['isVisible'] ) ) {
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
					'<p style="text-align:' . esc_attr( $target_context['alignment'] ) . ';">' . esc_html( $target_context['content'] ) . '</p>',
				);
				if ( ! empty( $target_context['showCount'] ) ) {
					$parts[] = '<p><strong>' . esc_html__( 'Count', '{{textDomain}}' ) . ':</strong> ' . esc_html( (string) $target_context['webContext']['count'] ) . '</p>';
				}
				$parts[] = '<p>' . esc_html( $target_context['noticeMessage'] ) . '</p>';
				$parts[] = '</div>';
				$markup = implode( '', $parts );
				break;
			case 'mjml':
				$markup = '<mjml><mj-body><mj-section><mj-column><mj-text align="' . esc_attr( $target_context['alignment'] ) . '">' . esc_html( $target_context['content'] ) . '</mj-text>';
				if ( ! empty( $target_context['showCount'] ) ) {
					$markup .= '<mj-text>' . esc_html__( 'Count', '{{textDomain}}' ) . ': ' . esc_html( (string) $target_context['webContext']['count'] ) . '</mj-text>';
				}
				$markup .= '<mj-text>' . esc_html( $target_context['noticeMessage'] ) . '</mj-text></mj-column></mj-section></mj-body></mjml>';
				break;
			case 'plain-text':
				$markup = implode(
					"\\n",
					array_filter(
						array(
							$target_context['title'],
							$target_context['content'],
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
						'data-wp-context'      => wp_json_encode( $target_context['webContext'] ),
						'data-wp-interactive'  => '{{slugKebabCase}}',
						'data-wp-init'         => 'callbacks.init',
						'data-wp-run--mounted' => 'callbacks.mounted',
					)
				);
				ob_start();
				?>
<div <?php echo $wrapper_attributes; ?>>
	<div class="{{frontendCssClassName}}">
		<p class="{{frontendCssClassName}}__content" style="<?php echo esc_attr( 'text-align:' . $target_context['alignment'] ); ?>">
			<?php echo esc_html( $target_context['content'] ); ?>
		</p>
		<p
			class="{{frontendCssClassName}}__notice"
			data-wp-bind--hidden="!context.bootstrapReady || context.canWrite"
			hidden
		>
			<?php echo esc_html( $target_context['noticeMessage'] ); ?>
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
		<?php if ( ! empty( $target_context['showCount'] ) ) : ?>
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
			<?php echo esc_html( $target_context['buttonLabel'] ); ?>
		</button>
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

/**
 * Builds the persistence family non-TypeScript scaffold artifacts.
 *
 * @param variables Scaffold template variables used to render the artifact set.
 * @returns The persistence SCSS and PHP artifacts for the selected render targets.
 */
export function buildPersistenceArtifacts(
	variables: ScaffoldTemplateVariables,
): BuiltInCodeArtifact[] {
	const alternateRenderTargets = getScaffoldAlternateRenderTargets(variables);
	if (!alternateRenderTargets.enabled) {
		return [
			renderArtifact("src/style.scss", PERSISTENCE_STYLE_TEMPLATE, variables),
			renderArtifact("src/render.php", PERSISTENCE_RENDER_TEMPLATE, variables),
		];
	}

	const artifacts = [
		renderArtifact("src/style.scss", PERSISTENCE_STYLE_TEMPLATE, variables),
		renderArtifact(
			"src/render-targets.php",
			PERSISTENCE_RENDER_TARGETS_TEMPLATE,
			variables,
		),
		buildAlternateRenderEntryArtifact("src/render.php", "web", variables),
	];

	if (alternateRenderTargets.hasEmail) {
		artifacts.push(
			buildAlternateRenderEntryArtifact("src/render-email.php", "email", variables),
		);
	}
	if (alternateRenderTargets.hasMjml) {
		artifacts.push(
			buildAlternateRenderEntryArtifact("src/render-mjml.php", "mjml", variables),
		);
	}
	if (alternateRenderTargets.hasPlainText) {
		artifacts.push(
			buildAlternateRenderEntryArtifact(
				"src/render-text.php",
				"plain-text",
				variables,
			),
		);
	}

	return artifacts;
}
