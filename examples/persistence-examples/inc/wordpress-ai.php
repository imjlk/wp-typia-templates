<?php
/**
 * WordPress AI Client and Abilities API proof-of-concept helpers.
 *
 * @package PersistenceExamples
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

function persistence_examples_load_block_json_artifact( $block_slug, $relative_path ) {
	$build_dir = persistence_examples_get_block_build_dir( $block_slug );
	if ( ! $build_dir ) {
		return null;
	}

	$path = $build_dir . '/' . ltrim( (string) $relative_path, '/' );
	if ( ! file_exists( $path ) ) {
		return null;
	}

	$decoded = json_decode( file_get_contents( $path ), true );
	return is_array( $decoded ) ? $decoded : null;
}

function persistence_examples_load_counter_ai_response_schema() {
	return persistence_examples_load_block_json_artifact(
		'counter',
		'wordpress-ai/counter-response.ai.schema.json'
	);
}

function persistence_examples_load_counter_abilities_projection() {
	return persistence_examples_load_block_json_artifact(
		'counter',
		'wordpress-ai/counter.abilities.json'
	);
}

function persistence_examples_authorize_counter_write_payload( $payload ) {
	if ( ! is_array( $payload ) ) {
		$payload = array();
	}

	$post_id      = isset( $payload['postId'] ) ? (int) $payload['postId'] : 0;
	$resource_key = isset( $payload['resourceKey'] ) ? (string) $payload['resourceKey'] : '';
	$request_id   = isset( $payload['publicWriteRequestId'] ) ? (string) $payload['publicWriteRequestId'] : '';
	$token        = isset( $payload['publicWriteToken'] ) ? (string) $payload['publicWriteToken'] : '';

	if ( $post_id <= 0 || '' === $resource_key ) {
		return new WP_Error(
			'rest_forbidden',
			'The counter write request is missing its target identifiers.',
			array( 'status' => 403 )
		);
	}

	if ( '' === $request_id ) {
		return new WP_Error(
			'rest_forbidden',
			'The public write request id is missing.',
			array( 'status' => 403 )
		);
	}

	$verification = persistence_examples_verify_counter_public_write_token( $token, $post_id, $resource_key );
	if ( is_wp_error( $verification ) ) {
		return $verification;
	}

	return persistence_examples_enforce_counter_rate_limit( $post_id, $resource_key );
}

function persistence_examples_generate_counter_ai_response( $post_id, $resource_key, $prompt = '' ) {
	if ( ! function_exists( 'wp_ai_client_prompt' ) ) {
		return new WP_Error(
			'ai_client_unavailable',
			'The WordPress AI Client is not available on this site.',
			array( 'status' => 501 )
		);
	}

	$schema = persistence_examples_load_counter_ai_response_schema();
	if ( ! is_array( $schema ) ) {
		return new WP_Error(
			'ai_client_schema_missing',
			'The projected AI-safe counter schema is missing.',
			array( 'status' => 500 )
		);
	}

	$current_state = persistence_examples_build_counter_response(
		(int) $post_id,
		(string) $resource_key,
		persistence_examples_get_counter( (int) $post_id, (string) $resource_key )
	);
	$prompt_text   = is_string( $prompt ) && '' !== $prompt
		? $prompt
		: sprintf(
			'Return the current persistence counter state as JSON that matches the provided schema. Current state: %s',
			wp_json_encode( $current_state )
		);
	$client_prompt = wp_ai_client_prompt( $prompt_text );

	if ( ! is_object( $client_prompt ) || ! method_exists( $client_prompt, 'as_json_response' ) ) {
		return new WP_Error(
			'ai_client_unavailable',
			'The current WordPress AI Client does not expose as_json_response().',
			array( 'status' => 501 )
		);
	}

	$structured_prompt = $client_prompt->as_json_response( $schema );
	if ( ! is_object( $structured_prompt ) || ! method_exists( $structured_prompt, 'generate_text' ) ) {
		return new WP_Error(
			'ai_client_unavailable',
			'The current WordPress AI Client does not expose generate_text() after as_json_response().',
			array( 'status' => 501 )
		);
	}

	return $structured_prompt->generate_text();
}

function persistence_examples_can_read_counter_ability() {
	return true;
}

function persistence_examples_can_execute_increment_counter_ability( $input = array() ) {
	return persistence_examples_authorize_counter_write_payload( is_array( $input ) ? $input : array() );
}

function persistence_examples_execute_get_counter_ability( $input = array() ) {
	$payload = persistence_examples_validate_and_sanitize_request(
		'counter',
		is_array( $input ) ? $input : array(),
		'counter-query',
		'input'
	);

	if ( is_wp_error( $payload ) ) {
		return $payload;
	}

	return persistence_examples_build_counter_response(
		(int) $payload['postId'],
		(string) $payload['resourceKey'],
		persistence_examples_get_counter(
			(int) $payload['postId'],
			(string) $payload['resourceKey']
		)
	);
}

function persistence_examples_execute_increment_counter_ability( $input = array() ) {
	$payload = persistence_examples_validate_and_sanitize_request(
		'counter',
		is_array( $input ) ? $input : array(),
		'increment-request',
		'input'
	);

	if ( is_wp_error( $payload ) ) {
		return $payload;
	}

	$request_consumed = persistence_examples_consume_counter_request_id(
		(int) $payload['postId'],
		(string) $payload['resourceKey'],
		isset( $payload['publicWriteRequestId'] ) ? (string) $payload['publicWriteRequestId'] : ''
	);

	if ( is_wp_error( $request_consumed ) ) {
		return $request_consumed;
	}

	$count = persistence_examples_increment_counter(
		(int) $payload['postId'],
		(string) $payload['resourceKey'],
		isset( $payload['delta'] ) ? (int) $payload['delta'] : 1
	);

	if ( is_wp_error( $count ) ) {
		persistence_examples_release_counter_request_id(
			(int) $payload['postId'],
			(string) $payload['resourceKey'],
			isset( $payload['publicWriteRequestId'] ) ? (string) $payload['publicWriteRequestId'] : ''
		);
		return $count;
	}

	return persistence_examples_build_counter_response(
		(int) $payload['postId'],
		(string) $payload['resourceKey'],
		$count
	);
}

function persistence_examples_register_counter_ability_category() {
	if ( ! function_exists( 'wp_register_ability_category' ) ) {
		return;
	}

	$projection = persistence_examples_load_counter_abilities_projection();
	$category   = is_array( $projection ) && isset( $projection['category'] ) && is_array( $projection['category'] )
		? $projection['category']
		: null;

	if ( ! is_array( $category ) || empty( $category['id'] ) || empty( $category['label'] ) ) {
		return;
	}

	wp_register_ability_category(
		(string) $category['id'],
		array(
			'label' => (string) $category['label'],
		)
	);
}

function persistence_examples_register_counter_abilities() {
	if ( ! function_exists( 'wp_register_ability' ) ) {
		return;
	}

	$projection = persistence_examples_load_counter_abilities_projection();
	$abilities  = is_array( $projection ) && isset( $projection['abilities'] ) && is_array( $projection['abilities'] )
		? $projection['abilities']
		: array();

	foreach ( $abilities as $ability ) {
		if ( ! is_array( $ability ) || empty( $ability['id'] ) ) {
			continue;
		}

		wp_register_ability(
			(string) $ability['id'],
			array(
				'category'            => (string) ( $ability['category'] ?? '' ),
				'description'         => (string) ( $ability['description'] ?? '' ),
				'execute_callback'    => (string) ( $ability['executeCallback'] ?? '' ),
				'input_schema'        => isset( $ability['inputSchema'] ) && is_array( $ability['inputSchema'] )
					? $ability['inputSchema']
					: null,
				'label'               => (string) ( $ability['label'] ?? '' ),
				'meta'                => isset( $ability['meta'] ) && is_array( $ability['meta'] )
					? $ability['meta']
					: array(),
				'output_schema'       => isset( $ability['outputSchema'] ) && is_array( $ability['outputSchema'] )
					? $ability['outputSchema']
					: array(),
				'permission_callback' => (string) ( $ability['permissionCallback'] ?? '' ),
			)
		);
	}
}

add_action( 'wp_abilities_api_categories_init', 'persistence_examples_register_counter_ability_category' );
add_action( 'wp_abilities_api_init', 'persistence_examples_register_counter_abilities' );
