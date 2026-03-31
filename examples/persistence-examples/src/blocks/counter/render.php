<?php
/**
 * Render callback for the Persistence Counter example block.
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
$button_label = isset( $normalized['buttonLabel'] ) ? (string) $normalized['buttonLabel'] : 'Persist Count';
$post_id      = is_object( $block ) && isset( $block->context['postId'] )
	? (int) $block->context['postId']
	: (int) get_queried_object_id();
$public_write = $post_id > 0
	? persistence_examples_create_counter_public_write_token( (int) $post_id, $resourceKey )
	: array(
		'expiresAt' => 0,
		'token'     => '',
	);
$context      = array(
	'buttonLabel' => $button_label,
	'canWrite'    => ! empty( $public_write['token'] ),
	'count'       => 0,
	'postId'      => (int) $post_id,
	'resourceKey' => $resourceKey,
	'storage'     => 'custom-table',
);

if ( ! empty( $public_write['token'] ) ) {
	$context['publicWriteToken'] = (string) $public_write['token'];
}

if ( ! empty( $public_write['expiresAt'] ) ) {
	$context['publicWriteExpiresAt'] = (int) $public_write['expiresAt'];
}

$wrapper_attributes = get_block_wrapper_attributes(
	array(
		'data-wp-context'       => wp_json_encode( $context ),
		'data-wp-interactive'   => 'persistenceExamplesCounter',
		'data-wp-init'          => 'callbacks.init',
		'data-wp-run--mounted' => 'callbacks.mounted',
	)
);
?>

<div <?php echo $wrapper_attributes; ?>>
	<div class="persistence-counter-frontend">
		<p class="persistence-counter-frontend__content"><?php echo esc_html( $content ); ?></p>
		<p class="persistence-counter-frontend__notice">
			<?php esc_html_e( 'Public writes use a signed short-lived token.', 'persistence-examples' ); ?>
		</p>
		<p
			class="persistence-counter-frontend__error"
			data-wp-bind--hidden="!state.error"
			data-wp-text="state.error"
			hidden
		></p>
		<?php if ( ! empty( $normalized['showCount'] ) ) : ?>
			<span class="persistence-counter-frontend__count" data-wp-text="state.count">0</span>
		<?php endif; ?>
		<button
			type="button"
			<?php echo ! empty( $context['canWrite'] ) ? '' : 'disabled'; ?>
			data-wp-bind--disabled="!context.canWrite"
			data-wp-on--click="actions.increment"
		>
			<?php echo esc_html( $button_label ); ?>
		</button>
	</div>
</div>
