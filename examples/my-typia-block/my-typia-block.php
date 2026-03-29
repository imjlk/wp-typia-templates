<?php
/**
 * Plugin Name:       My Typia Block
 * Description:       Kitchen-sink showcase block for wp-typia.
 * Version:           0.1.0
 * Requires at least: 6.7
 * Requires PHP:      7.4
 * Author:            imjlk
 * License:           GPL-2.0-or-later
 * License URI:       https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain:       my-typia-block
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Resolve the built block directory across current and legacy build layouts.
 */
function my_typia_block_get_build_dir() {
	$candidates = array(
		__DIR__ . '/build',
		__DIR__ . '/build/my-typia-block',
	);

	foreach ( $candidates as $candidate ) {
		if ( file_exists( $candidate . '/block.json' ) ) {
			return $candidate;
		}
	}

	return null;
}

/**
 * Returns the generated Typia validator when available.
 */
function my_typia_block_get_typia_validator() {
	$build_dir = my_typia_block_get_build_dir();

	if ( ! $build_dir ) {
		return null;
	}

	$validator_path = $build_dir . '/typia-validator.php';

	if ( ! file_exists( $validator_path ) ) {
		return null;
	}

	$validator = require $validator_path;

	return is_object( $validator ) ? $validator : null;
}

/**
 * Register the showcase block from the generated build directory.
 */
function my_typia_block_register_block() {
	$build_dir = my_typia_block_get_build_dir();

	if ( ! $build_dir ) {
		return;
	}

	register_block_type( $build_dir );
}
add_action( 'init', 'my_typia_block_register_block' );
