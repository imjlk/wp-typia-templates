<?php
/**
 * Dynamic render entry for the My Typia Block block.
 *
 * Uses the generated Typia PHP validator to normalize and validate the
 * supported attribute subset before rendering.
 *
 * @package MyTypiaBlock
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

$normalized = $validator->apply_defaults( is_array( $attributes ) ? $attributes : array() );
$validation = $validator->validate( $normalized );

if ( empty( $validation['valid'] ) ) {
	if ( defined( 'WP_DEBUG' ) && WP_DEBUG ) {
		$messages = array_map( 'strval', $validation['errors'] ?? array() );
		echo sprintf(
			'<!-- %s -->',
			esc_html( 'create-block/my-typia-block render skipped: ' . implode( ' | ', $messages ) )
		);
	}

	return;
}

if ( empty( $normalized['isVisible'] ) ) {
	return;
}

$content = isset( $normalized['content'] ) ? (string) $normalized['content'] : '';
$alignment = isset( $normalized['alignment'] ) ? (string) $normalized['alignment'] : 'left';
$font_size = isset( $normalized['fontSize'] ) ? (string) $normalized['fontSize'] : 'medium';

if ( ! in_array( $alignment, array( 'left', 'center', 'right', 'justify' ), true ) ) {
	$alignment = 'left';
}

$wrapper_attributes = get_block_wrapper_attributes(
	array(
		'data-wp-context' => wp_json_encode(
			array(
				'alignment' => $alignment,
				'content'   => $content,
			)
		),
		'data-wp-interactive' => 'create-block/my-typia-block',
	)
);

?>

<div <?php echo $wrapper_attributes; ?>>
	<div class="my-typia-block-frontend">
		<?php esc_html_e( 'My Typia Block - Frontend View', 'my_typia_block' ); ?>
	</div>
	<p
		style="<?php echo esc_attr( 'text-align: ' . $alignment . ';' ); ?>"
		class="<?php echo esc_attr( 'font-size-' . $font_size ); ?>"
		data-wp-bind--hidden="!state.isVisible"
		data-wp-text="context.content"
	>
		<?php echo esc_html( $content ); ?>
	</p>

	<button
		data-wp-class--active="state.isActive"
		data-wp-on--click="actions.toggle"
		type="button"
	>
		<?php esc_html_e( 'Toggle', 'my_typia_block' ); ?>
	</button>
</div>
