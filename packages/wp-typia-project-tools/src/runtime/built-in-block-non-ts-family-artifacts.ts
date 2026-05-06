import type { BuiltInCodeArtifact } from "./built-in-block-code-artifacts.js";
import type { ScaffoldTemplateVariables } from "./scaffold.js";
import {
	buildAlternateRenderEntryArtifact,
	renderArtifact,
	toPhpSingleQuotedString,
} from "./built-in-block-non-ts-render-utils.js";
import {
	getScaffoldAlternateRenderTargets,
	isCompoundPersistenceEnabled,
} from "./scaffold-template-variable-groups.js";

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
 * Builds the basic family non-TypeScript scaffold artifacts.
 *
 * @param variables Scaffold template variables used to render the artifact set.
 * @returns The SCSS and PHP artifacts owned by the basic template family.
 */
export function buildBasicArtifacts(
	variables: ScaffoldTemplateVariables,
): BuiltInCodeArtifact[] {
	return [
		renderArtifact("src/editor.scss", BASIC_EDITOR_STYLE_TEMPLATE, variables),
		renderArtifact("src/style.scss", BASIC_STYLE_TEMPLATE, variables),
		renderArtifact("src/render.php", BASIC_RENDER_TEMPLATE, variables),
	];
}

/**
 * Builds the interactivity family non-TypeScript scaffold artifacts.
 *
 * @param variables Scaffold template variables used to render the artifact set.
 * @returns The SCSS artifacts owned by the interactivity template family.
 */
export function buildInteractivityArtifacts(
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
