<?php
/**
 * Render callback for the Persistence Like Button example block.
 *
 * @package PersistenceExamples
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

$content      = isset( $normalized['content'] ) ? (string) $normalized['content'] : '';
$like_label   = isset( $normalized['likeLabel'] ) ? (string) $normalized['likeLabel'] : 'Like this';
$unlike_label = isset( $normalized['unlikeLabel'] ) ? (string) $normalized['unlikeLabel'] : 'Unlike';
$post_id      = is_object( $block ) && isset( $block->context['postId'] )
	? (int) $block->context['postId']
	: (int) get_queried_object_id();
$context      = array(
	'likeLabel'           => $like_label,
	'postId'              => (int) $post_id,
	'resourceKey'         => $resource_key,
	'storage'             => 'custom-table',
	'unlikeLabel'         => $unlike_label,
);

$wrapper_attributes = get_block_wrapper_attributes(
	array(
		'data-wp-context'       => wp_json_encode( $context ),
		'data-wp-interactive'   => 'persistenceExamplesLikeButton',
		'data-wp-init'          => 'callbacks.init',
		'data-wp-run--mounted' => 'callbacks.mounted',
	)
);
?>

<div <?php echo $wrapper_attributes; ?>>
	<div class="persistence-like-button-frontend">
		<p class="persistence-like-button-frontend__content"><?php echo esc_html( $content ); ?></p>
		<p
			class="persistence-like-button-frontend__notice"
			data-wp-bind--hidden="!state.bootstrapReady || state.canWrite"
			hidden
		>
			<?php esc_html_e( 'Sign in to like this item.', 'persistence-examples' ); ?>
		</p>
		<p
			class="persistence-like-button-frontend__error"
			role="status"
			aria-live="polite"
			aria-atomic="true"
			data-wp-bind--hidden="!state.error"
			data-wp-text="state.error"
			hidden
		></p>
		<?php if ( ! empty( $normalized['showCount'] ) ) : ?>
			<span
				class="persistence-like-button-frontend__count"
				role="status"
				aria-live="polite"
				aria-atomic="true"
				data-wp-text="state.count"
			>0</span>
		<?php endif; ?>
		<button
			type="button"
			disabled
			data-wp-bind--disabled="!state.canWrite"
			data-wp-on--click="actions.toggle"
			data-wp-text="state.buttonLabel"
		>
			<?php echo esc_html( $like_label ); ?>
		</button>
	</div>
</div>
