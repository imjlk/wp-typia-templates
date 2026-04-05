<?php
/**
 * Plugin Name:       Compound Patterns
 * Description:       A parent-and-child WordPress block scaffold with InnerBlocks, optional persistence wiring, and hidden implementation child blocks
 * Version:           0.1.0
 * Requires at least: 6.7
 * Tested up to:      6.9
 * Requires PHP:      7.4
 * Author:            imjlk
 * License:           GPL-2.0-or-later
 * License URI:       https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain:       compound_patterns
 * Domain Path:       /languages
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

function compound_patterns_load_textdomain() {
	load_plugin_textdomain(
		'compound_patterns',
		false,
		dirname( plugin_basename( __FILE__ ) ) . '/languages'
	);
}

function compound_patterns_get_build_root() {
	return __DIR__ . '/build/blocks';
}

function compound_patterns_register_blocks() {
	$build_root = compound_patterns_get_build_root();
	if ( ! is_dir( $build_root ) ) {
		return;
	}

	$block_dirs = glob( $build_root . '/*', GLOB_ONLYDIR );
	if ( ! is_array( $block_dirs ) ) {
		return;
	}

	foreach ( $block_dirs as $block_dir ) {
		if ( file_exists( $block_dir . '/block.json' ) ) {
			register_block_type( $block_dir );
		}
	}
}

add_action( 'init', 'compound_patterns_load_textdomain' );
add_action( 'init', 'compound_patterns_register_blocks' );
