<?php
/**
 * Plugin Name:       My Typia Block
 * Description:       Example block scaffolded with Create Block tool.
 * Version:           0.1.0
 * Requires at least: 6.7
 * Requires PHP:      7.4
 * Author:            The WordPress Contributors
 * License:           GPL-2.0-or-later
 * License URI:       https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain:       my-typia-block
 *
 * @package CreateBlock
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly.
}

/**
 * Returns the generated Typia validator helper when server-side code needs it.
 *
 * Static blocks do not automatically validate on save, but this helper is
 * available for future render callbacks, REST endpoints, or migration tooling.
 *
 * @return object|null
 */
function create_block_my_typia_block_get_typia_validator() {
	$validator_path = __DIR__ . '/build/my-typia-block/typia-validator.php';

	if ( ! file_exists( $validator_path ) ) {
		return null;
	}

	$validator = require $validator_path;

	return is_object( $validator ) ? $validator : null;
}
/**
 * Registers the block using a `blocks-manifest.php` file, which improves the performance of block type registration.
 * Behind the scenes, it also registers all assets so they can be enqueued
 * through the block editor in the corresponding context.
 *
 * @see https://make.wordpress.org/core/2025/03/13/more-efficient-block-type-registration-in-6-8/
 * @see https://make.wordpress.org/core/2024/10/17/new-block-type-registration-apis-to-improve-performance-in-wordpress-6-7/
 */
function create_block_my_typia_block_block_init() {
	error_log( 'My Typia Block: Starting block registration...' );

	// 간단한 블록 등록 방식
	$block_json_file = __DIR__ . '/build/my-typia-block/block.json';

	if ( ! file_exists( $block_json_file ) ) {
		error_log( 'My Typia Block: block.json not found at: ' . $block_json_file );
		return;
	}

	// block.json 기반 블록 등록
	$result = register_block_type( __DIR__ . '/build/my-typia-block' );

	if ( $result ) {
		error_log( 'My Typia Block: Successfully registered!' );
		error_log( 'My Typia Block: Block name: ' . $result->name );
	} else {
		error_log( 'My Typia Block: Registration failed!' );
	}
}
add_action( 'init', 'create_block_my_typia_block_block_init' );
