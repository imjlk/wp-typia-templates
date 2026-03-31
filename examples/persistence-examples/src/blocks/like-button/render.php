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

$normalized  = $validator->apply_defaults( is_array( $attributes ) ? $attributes : array() );
$validation  = $validator->validate( $normalized );
$resourceKey = isset( $normalized['resourceKey'] ) ? (string) $normalized['resourceKey'] : '';

if ( empty( $validation['valid'] ) || '' === $resourceKey ) {
	return '';
}

$content      = isset( $normalized['content'] ) ? (string) $normalized['content'] : '';
$like_label   = isset( $normalized['likeLabel'] ) ? (string) $normalized['likeLabel'] : 'Like this';
$unlike_label = isset( $normalized['unlikeLabel'] ) ? (string) $normalized['unlikeLabel'] : 'Unlike';
$post_id      = get_the_ID();
$can_write    = is_user_logged_in();
$liked        = $can_write ? persistence_examples_has_like( (int) $post_id, $resourceKey, get_current_user_id() ) : false;
$context      = array(
	'buttonLabel'         => $liked ? $unlike_label : $like_label,
	'canWrite'            => $can_write,
	'count'               => 0,
	'likeLabel'           => $like_label,
	'likedByCurrentUser'  => $liked,
	'postId'              => (int) $post_id,
	'resourceKey'         => $resourceKey,
	'storage'             => 'custom-table',
	'unlikeLabel'         => $unlike_label,
);

if ( $can_write ) {
	$context['restNonce'] = wp_create_nonce( 'wp_rest' );
}

$wrapper_attributes = get_block_wrapper_attributes(
	array(
		'data-wp-context'       => wp_json_encode( $context ),
		'data-wp-interactive'   => 'persistenceExamplesLikeButton',
		'data-wp-init'          => 'callbacks.init',
		'data-wp-run---mounted' => 'callbacks.mounted',
	)
);
?>

<div <?php echo $wrapper_attributes; ?>>
	<div class="persistence-like-button-frontend">
		<p class="persistence-like-button-frontend__content"><?php echo esc_html( $content ); ?></p>
		<?php if ( ! $can_write ) : ?>
			<p class="persistence-like-button-frontend__notice">
				<?php esc_html_e( 'Sign in to like this item.', 'persistence-examples' ); ?>
			</p>
		<?php endif; ?>
		<p
			class="persistence-like-button-frontend__error"
			data-wp-bind--hidden="!state.error"
			data-wp-text="state.error"
			hidden
		></p>
		<?php if ( ! empty( $normalized['showCount'] ) ) : ?>
			<span class="persistence-like-button-frontend__count" data-wp-text="state.count">0</span>
		<?php endif; ?>
		<button
			type="button"
			<?php echo $can_write ? '' : 'disabled'; ?>
			data-wp-bind--disabled="!context.canWrite"
			data-wp-on--click="actions.toggle"
			data-wp-text="state.buttonLabel"
		>
			<?php echo esc_html( $liked ? $unlike_label : $like_label ); ?>
		</button>
	</div>
</div>
