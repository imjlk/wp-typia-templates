<?php
declare(strict_types=1);

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Generated from advanced migration snapshots. Do not edit manually.
 */
return [
	'blockName' => 'create-block/my-typia-block',
	'currentManifest' => [
		'attributes' => [
			'id' => [
				'constraints' => [
					'exclusiveMaximum' => null,
					'exclusiveMinimum' => null,
					'format' => 'uuid',
					'maxLength' => null,
					'maxItems' => null,
					'maximum' => null,
					'minLength' => null,
					'minItems' => null,
					'minimum' => null,
					'multipleOf' => null,
					'pattern' => null,
					'typeTag' => null
				],
				'defaultValue' => null,
				'hasDefault' => false,
				'enum' => null,
				'kind' => 'string',
				'required' => false,
				'union' => null
			],
			'version' => [
				'constraints' => [
					'exclusiveMaximum' => null,
					'exclusiveMinimum' => null,
					'format' => null,
					'maxLength' => null,
					'maxItems' => null,
					'maximum' => null,
					'minLength' => null,
					'minItems' => null,
					'minimum' => null,
					'multipleOf' => null,
					'pattern' => null,
					'typeTag' => 'uint32'
				],
				'defaultValue' => 1,
				'hasDefault' => true,
				'enum' => null,
				'kind' => 'number',
				'required' => false,
				'union' => null
			],
			'className' => [
				'constraints' => [
					'exclusiveMaximum' => null,
					'exclusiveMinimum' => null,
					'format' => null,
					'maxLength' => 100,
					'maxItems' => null,
					'maximum' => null,
					'minLength' => null,
					'minItems' => null,
					'minimum' => null,
					'multipleOf' => null,
					'pattern' => null,
					'typeTag' => null
				],
				'defaultValue' => null,
				'hasDefault' => false,
				'enum' => null,
				'kind' => 'string',
				'required' => false,
				'union' => null
			],
			'content' => [
				'constraints' => [
					'exclusiveMaximum' => null,
					'exclusiveMinimum' => null,
					'format' => null,
					'maxLength' => 1000,
					'maxItems' => null,
					'maximum' => null,
					'minLength' => 0,
					'minItems' => null,
					'minimum' => null,
					'multipleOf' => null,
					'pattern' => null,
					'typeTag' => null
				],
				'defaultValue' => '',
				'hasDefault' => true,
				'enum' => null,
				'kind' => 'string',
				'required' => true,
				'union' => null
			],
			'alignment' => [
				'constraints' => [
					'exclusiveMaximum' => null,
					'exclusiveMinimum' => null,
					'format' => null,
					'maxLength' => null,
					'maxItems' => null,
					'maximum' => null,
					'minLength' => null,
					'minItems' => null,
					'minimum' => null,
					'multipleOf' => null,
					'pattern' => null,
					'typeTag' => null
				],
				'defaultValue' => 'left',
				'hasDefault' => true,
				'enum' => [
					'left',
					'center',
					'right',
					'justify'
				],
				'kind' => 'string',
				'required' => false,
				'union' => null
			],
			'isVisible' => [
				'constraints' => [
					'exclusiveMaximum' => null,
					'exclusiveMinimum' => null,
					'format' => null,
					'maxLength' => null,
					'maxItems' => null,
					'maximum' => null,
					'minLength' => null,
					'minItems' => null,
					'minimum' => null,
					'multipleOf' => null,
					'pattern' => null,
					'typeTag' => null
				],
				'defaultValue' => true,
				'hasDefault' => true,
				'enum' => null,
				'kind' => 'boolean',
				'required' => false,
				'union' => null
			],
			'fontSize' => [
				'constraints' => [
					'exclusiveMaximum' => null,
					'exclusiveMinimum' => null,
					'format' => null,
					'maxLength' => null,
					'maxItems' => null,
					'maximum' => null,
					'minLength' => null,
					'minItems' => null,
					'minimum' => null,
					'multipleOf' => null,
					'pattern' => null,
					'typeTag' => null
				],
				'defaultValue' => 'medium',
				'hasDefault' => true,
				'enum' => [
					'small',
					'medium',
					'large',
					'xlarge'
				],
				'kind' => 'string',
				'required' => false,
				'union' => null
			],
			'textColor' => [
				'constraints' => [
					'exclusiveMaximum' => null,
					'exclusiveMinimum' => null,
					'format' => null,
					'maxLength' => null,
					'maxItems' => null,
					'maximum' => null,
					'minLength' => null,
					'minItems' => null,
					'minimum' => null,
					'multipleOf' => null,
					'pattern' => null,
					'typeTag' => null
				],
				'defaultValue' => 'currentColor',
				'hasDefault' => true,
				'enum' => [
					'transparent',
					'currentColor',
					'inherit',
					'initial',
					'unset'
				],
				'kind' => 'string',
				'required' => false,
				'union' => null
			],
			'backgroundColor' => [
				'constraints' => [
					'exclusiveMaximum' => null,
					'exclusiveMinimum' => null,
					'format' => null,
					'maxLength' => null,
					'maxItems' => null,
					'maximum' => null,
					'minLength' => null,
					'minItems' => null,
					'minimum' => null,
					'multipleOf' => null,
					'pattern' => null,
					'typeTag' => null
				],
				'defaultValue' => 'transparent',
				'hasDefault' => true,
				'enum' => [
					'transparent',
					'currentColor',
					'inherit',
					'initial',
					'unset'
				],
				'kind' => 'string',
				'required' => false,
				'union' => null
			],
			'aspectRatio' => [
				'constraints' => [
					'exclusiveMaximum' => null,
					'exclusiveMinimum' => null,
					'format' => null,
					'maxLength' => null,
					'maxItems' => null,
					'maximum' => null,
					'minLength' => null,
					'minItems' => null,
					'minimum' => null,
					'multipleOf' => null,
					'pattern' => null,
					'typeTag' => null
				],
				'defaultValue' => '16/9',
				'hasDefault' => true,
				'enum' => [
					'auto',
					'1',
					'1/1',
					'4/3',
					'3/4',
					'3/2',
					'2/3',
					'16/9',
					'9/16',
					'21/9'
				],
				'kind' => 'string',
				'required' => false,
				'union' => null
			],
			'padding' => [
				'constraints' => [
					'exclusiveMaximum' => null,
					'exclusiveMinimum' => null,
					'format' => null,
					'maxLength' => null,
					'maxItems' => null,
					'maximum' => null,
					'minLength' => null,
					'minItems' => null,
					'minimum' => null,
					'multipleOf' => null,
					'pattern' => null,
					'typeTag' => null
				],
				'defaultValue' => null,
				'hasDefault' => false,
				'enum' => null,
				'kind' => 'object',
				'required' => false,
				'union' => null
			],
			'borderRadius' => [
				'constraints' => [
					'exclusiveMaximum' => null,
					'exclusiveMinimum' => null,
					'format' => null,
					'maxLength' => null,
					'maxItems' => null,
					'maximum' => null,
					'minLength' => null,
					'minItems' => null,
					'minimum' => 0,
					'multipleOf' => null,
					'pattern' => null,
					'typeTag' => null
				],
				'defaultValue' => 0,
				'hasDefault' => true,
				'enum' => null,
				'kind' => 'number',
				'required' => false,
				'union' => null
			],
			'animation' => [
				'constraints' => [
					'exclusiveMaximum' => null,
					'exclusiveMinimum' => null,
					'format' => null,
					'maxLength' => null,
					'maxItems' => null,
					'maximum' => null,
					'minLength' => null,
					'minItems' => null,
					'minimum' => null,
					'multipleOf' => null,
					'pattern' => null,
					'typeTag' => null
				],
				'defaultValue' => 'none',
				'hasDefault' => true,
				'enum' => [
					'none',
					'fadeIn',
					'bounce'
				],
				'kind' => 'string',
				'required' => false,
				'union' => null
			],
			'linkTarget' => [
				'constraints' => [
					'exclusiveMaximum' => null,
					'exclusiveMinimum' => null,
					'format' => null,
					'maxLength' => null,
					'maxItems' => null,
					'maximum' => null,
					'minLength' => null,
					'minItems' => null,
					'minimum' => null,
					'multipleOf' => null,
					'pattern' => null,
					'typeTag' => null
				],
				'defaultValue' => null,
				'hasDefault' => false,
				'enum' => null,
				'kind' => 'union',
				'required' => false,
				'union' => [
					'branches' => [
						'url' => [
							'typia' => [
								'constraints' => [
									'exclusiveMaximum' => null,
									'exclusiveMinimum' => null,
									'format' => null,
									'maxLength' => null,
									'maxItems' => null,
									'maximum' => null,
									'minLength' => null,
									'minItems' => null,
									'minimum' => null,
									'multipleOf' => null,
									'pattern' => null,
									'typeTag' => null
								],
								'defaultValue' => null,
								'hasDefault' => false
							],
							'ts' => [
								'items' => null,
								'kind' => 'object',
								'properties' => [
									'kind' => [
										'typia' => [
											'constraints' => [
												'exclusiveMaximum' => null,
												'exclusiveMinimum' => null,
												'format' => null,
												'maxLength' => null,
												'maxItems' => null,
												'maximum' => null,
												'minLength' => null,
												'minItems' => null,
												'minimum' => null,
												'multipleOf' => null,
												'pattern' => null,
												'typeTag' => null
											],
											'defaultValue' => null,
											'hasDefault' => false
										],
										'ts' => [
											'items' => null,
											'kind' => 'string',
											'properties' => null,
											'required' => true,
											'union' => null
										],
										'wp' => [
											'defaultValue' => null,
											'enum' => [
												'url'
											],
											'hasDefault' => false,
											'type' => 'string'
										]
									],
									'href' => [
										'typia' => [
											'constraints' => [
												'exclusiveMaximum' => null,
												'exclusiveMinimum' => null,
												'format' => 'uri',
												'maxLength' => null,
												'maxItems' => null,
												'maximum' => null,
												'minLength' => null,
												'minItems' => null,
												'minimum' => null,
												'multipleOf' => null,
												'pattern' => null,
												'typeTag' => null
											],
											'defaultValue' => null,
											'hasDefault' => false
										],
										'ts' => [
											'items' => null,
											'kind' => 'string',
											'properties' => null,
											'required' => true,
											'union' => null
										],
										'wp' => [
											'defaultValue' => null,
											'enum' => null,
											'hasDefault' => false,
											'type' => 'string'
										]
									]
								],
								'required' => true,
								'union' => null
							],
							'wp' => [
								'defaultValue' => null,
								'enum' => null,
								'hasDefault' => false,
								'type' => 'object'
							]
						],
						'post' => [
							'typia' => [
								'constraints' => [
									'exclusiveMaximum' => null,
									'exclusiveMinimum' => null,
									'format' => null,
									'maxLength' => null,
									'maxItems' => null,
									'maximum' => null,
									'minLength' => null,
									'minItems' => null,
									'minimum' => null,
									'multipleOf' => null,
									'pattern' => null,
									'typeTag' => null
								],
								'defaultValue' => null,
								'hasDefault' => false
							],
							'ts' => [
								'items' => null,
								'kind' => 'object',
								'properties' => [
									'kind' => [
										'typia' => [
											'constraints' => [
												'exclusiveMaximum' => null,
												'exclusiveMinimum' => null,
												'format' => null,
												'maxLength' => null,
												'maxItems' => null,
												'maximum' => null,
												'minLength' => null,
												'minItems' => null,
												'minimum' => null,
												'multipleOf' => null,
												'pattern' => null,
												'typeTag' => null
											],
											'defaultValue' => null,
											'hasDefault' => false
										],
										'ts' => [
											'items' => null,
											'kind' => 'string',
											'properties' => null,
											'required' => true,
											'union' => null
										],
										'wp' => [
											'defaultValue' => null,
											'enum' => [
												'post'
											],
											'hasDefault' => false,
											'type' => 'string'
										]
									],
									'postId' => [
										'typia' => [
											'constraints' => [
												'exclusiveMaximum' => null,
												'exclusiveMinimum' => null,
												'format' => null,
												'maxLength' => null,
												'maxItems' => null,
												'maximum' => null,
												'minLength' => null,
												'minItems' => null,
												'minimum' => null,
												'multipleOf' => null,
												'pattern' => null,
												'typeTag' => 'uint32'
											],
											'defaultValue' => null,
											'hasDefault' => false
										],
										'ts' => [
											'items' => null,
											'kind' => 'number',
											'properties' => null,
											'required' => true,
											'union' => null
										],
										'wp' => [
											'defaultValue' => null,
											'enum' => null,
											'hasDefault' => false,
											'type' => 'number'
										]
									]
								],
								'required' => true,
								'union' => null
							],
							'wp' => [
								'defaultValue' => null,
								'enum' => null,
								'hasDefault' => false,
								'type' => 'object'
							]
						]
					],
					'discriminator' => 'kind'
				]
			]
		],
		'manifestVersion' => 2,
		'sourceType' => 'MyTypiaBlockAttributes'
	],
	'currentMigrationVersion' => 'v1',
	'edges' => [],
	'legacyMigrationVersions' => [],
	'snapshotDir' => 'src/migrations/versions',
	'snapshots' => [
		'v1' => [
			'blockJson' => [
				'attributeNames' => [
					'id',
					'version',
					'className',
					'content',
					'alignment',
					'isVisible',
					'fontSize',
					'textColor',
					'backgroundColor',
					'aspectRatio',
					'padding',
					'borderRadius',
					'animation',
					'linkTarget'
				],
				'name' => 'create-block/my-typia-block'
			],
			'hasSaveSnapshot' => true,
			'manifest' => [
				'attributes' => [
					'id' => [
						'constraints' => [
							'exclusiveMaximum' => null,
							'exclusiveMinimum' => null,
							'format' => 'uuid',
							'maxLength' => null,
							'maxItems' => null,
							'maximum' => null,
							'minLength' => null,
							'minItems' => null,
							'minimum' => null,
							'multipleOf' => null,
							'pattern' => null,
							'typeTag' => null
						],
						'defaultValue' => null,
						'hasDefault' => false,
						'enum' => null,
						'kind' => 'string',
						'required' => false,
						'union' => null
					],
					'version' => [
						'constraints' => [
							'exclusiveMaximum' => null,
							'exclusiveMinimum' => null,
							'format' => null,
							'maxLength' => null,
							'maxItems' => null,
							'maximum' => null,
							'minLength' => null,
							'minItems' => null,
							'minimum' => null,
							'multipleOf' => null,
							'pattern' => null,
							'typeTag' => 'uint32'
						],
						'defaultValue' => 1,
						'hasDefault' => true,
						'enum' => null,
						'kind' => 'number',
						'required' => false,
						'union' => null
					],
					'className' => [
						'constraints' => [
							'exclusiveMaximum' => null,
							'exclusiveMinimum' => null,
							'format' => null,
							'maxLength' => 100,
							'maxItems' => null,
							'maximum' => null,
							'minLength' => null,
							'minItems' => null,
							'minimum' => null,
							'multipleOf' => null,
							'pattern' => null,
							'typeTag' => null
						],
						'defaultValue' => null,
						'hasDefault' => false,
						'enum' => null,
						'kind' => 'string',
						'required' => false,
						'union' => null
					],
					'content' => [
						'constraints' => [
							'exclusiveMaximum' => null,
							'exclusiveMinimum' => null,
							'format' => null,
							'maxLength' => 1000,
							'maxItems' => null,
							'maximum' => null,
							'minLength' => 0,
							'minItems' => null,
							'minimum' => null,
							'multipleOf' => null,
							'pattern' => null,
							'typeTag' => null
						],
						'defaultValue' => '',
						'hasDefault' => true,
						'enum' => null,
						'kind' => 'string',
						'required' => true,
						'union' => null
					],
					'alignment' => [
						'constraints' => [
							'exclusiveMaximum' => null,
							'exclusiveMinimum' => null,
							'format' => null,
							'maxLength' => null,
							'maxItems' => null,
							'maximum' => null,
							'minLength' => null,
							'minItems' => null,
							'minimum' => null,
							'multipleOf' => null,
							'pattern' => null,
							'typeTag' => null
						],
						'defaultValue' => 'left',
						'hasDefault' => true,
						'enum' => [
							'left',
							'center',
							'right',
							'justify'
						],
						'kind' => 'string',
						'required' => false,
						'union' => null
					],
					'isVisible' => [
						'constraints' => [
							'exclusiveMaximum' => null,
							'exclusiveMinimum' => null,
							'format' => null,
							'maxLength' => null,
							'maxItems' => null,
							'maximum' => null,
							'minLength' => null,
							'minItems' => null,
							'minimum' => null,
							'multipleOf' => null,
							'pattern' => null,
							'typeTag' => null
						],
						'defaultValue' => true,
						'hasDefault' => true,
						'enum' => null,
						'kind' => 'boolean',
						'required' => false,
						'union' => null
					],
					'fontSize' => [
						'constraints' => [
							'exclusiveMaximum' => null,
							'exclusiveMinimum' => null,
							'format' => null,
							'maxLength' => null,
							'maxItems' => null,
							'maximum' => null,
							'minLength' => null,
							'minItems' => null,
							'minimum' => null,
							'multipleOf' => null,
							'pattern' => null,
							'typeTag' => null
						],
						'defaultValue' => 'medium',
						'hasDefault' => true,
						'enum' => [
							'small',
							'medium',
							'large',
							'xlarge'
						],
						'kind' => 'string',
						'required' => false,
						'union' => null
					],
					'textColor' => [
						'constraints' => [
							'exclusiveMaximum' => null,
							'exclusiveMinimum' => null,
							'format' => null,
							'maxLength' => null,
							'maxItems' => null,
							'maximum' => null,
							'minLength' => null,
							'minItems' => null,
							'minimum' => null,
							'multipleOf' => null,
							'pattern' => null,
							'typeTag' => null
						],
						'defaultValue' => 'currentColor',
						'hasDefault' => true,
						'enum' => [
							'transparent',
							'currentColor',
							'inherit',
							'initial',
							'unset'
						],
						'kind' => 'string',
						'required' => false,
						'union' => null
					],
					'backgroundColor' => [
						'constraints' => [
							'exclusiveMaximum' => null,
							'exclusiveMinimum' => null,
							'format' => null,
							'maxLength' => null,
							'maxItems' => null,
							'maximum' => null,
							'minLength' => null,
							'minItems' => null,
							'minimum' => null,
							'multipleOf' => null,
							'pattern' => null,
							'typeTag' => null
						],
						'defaultValue' => 'transparent',
						'hasDefault' => true,
						'enum' => [
							'transparent',
							'currentColor',
							'inherit',
							'initial',
							'unset'
						],
						'kind' => 'string',
						'required' => false,
						'union' => null
					],
					'aspectRatio' => [
						'constraints' => [
							'exclusiveMaximum' => null,
							'exclusiveMinimum' => null,
							'format' => null,
							'maxLength' => null,
							'maxItems' => null,
							'maximum' => null,
							'minLength' => null,
							'minItems' => null,
							'minimum' => null,
							'multipleOf' => null,
							'pattern' => null,
							'typeTag' => null
						],
						'defaultValue' => '16/9',
						'hasDefault' => true,
						'enum' => [
							'auto',
							'1',
							'1/1',
							'4/3',
							'3/4',
							'3/2',
							'2/3',
							'16/9',
							'9/16',
							'21/9'
						],
						'kind' => 'string',
						'required' => false,
						'union' => null
					],
					'padding' => [
						'constraints' => [
							'exclusiveMaximum' => null,
							'exclusiveMinimum' => null,
							'format' => null,
							'maxLength' => null,
							'maxItems' => null,
							'maximum' => null,
							'minLength' => null,
							'minItems' => null,
							'minimum' => null,
							'multipleOf' => null,
							'pattern' => null,
							'typeTag' => null
						],
						'defaultValue' => null,
						'hasDefault' => false,
						'enum' => null,
						'kind' => 'object',
						'required' => false,
						'union' => null
					],
					'borderRadius' => [
						'constraints' => [
							'exclusiveMaximum' => null,
							'exclusiveMinimum' => null,
							'format' => null,
							'maxLength' => null,
							'maxItems' => null,
							'maximum' => null,
							'minLength' => null,
							'minItems' => null,
							'minimum' => 0,
							'multipleOf' => null,
							'pattern' => null,
							'typeTag' => null
						],
						'defaultValue' => 0,
						'hasDefault' => true,
						'enum' => null,
						'kind' => 'number',
						'required' => false,
						'union' => null
					],
					'animation' => [
						'constraints' => [
							'exclusiveMaximum' => null,
							'exclusiveMinimum' => null,
							'format' => null,
							'maxLength' => null,
							'maxItems' => null,
							'maximum' => null,
							'minLength' => null,
							'minItems' => null,
							'minimum' => null,
							'multipleOf' => null,
							'pattern' => null,
							'typeTag' => null
						],
						'defaultValue' => 'none',
						'hasDefault' => true,
						'enum' => [
							'none',
							'fadeIn',
							'bounce'
						],
						'kind' => 'string',
						'required' => false,
						'union' => null
					],
					'linkTarget' => [
						'constraints' => [
							'exclusiveMaximum' => null,
							'exclusiveMinimum' => null,
							'format' => null,
							'maxLength' => null,
							'maxItems' => null,
							'maximum' => null,
							'minLength' => null,
							'minItems' => null,
							'minimum' => null,
							'multipleOf' => null,
							'pattern' => null,
							'typeTag' => null
						],
						'defaultValue' => null,
						'hasDefault' => false,
						'enum' => null,
						'kind' => 'union',
						'required' => false,
						'union' => [
							'branches' => [
								'url' => [
									'typia' => [
										'constraints' => [
											'exclusiveMaximum' => null,
											'exclusiveMinimum' => null,
											'format' => null,
											'maxLength' => null,
											'maxItems' => null,
											'maximum' => null,
											'minLength' => null,
											'minItems' => null,
											'minimum' => null,
											'multipleOf' => null,
											'pattern' => null,
											'typeTag' => null
										],
										'defaultValue' => null,
										'hasDefault' => false
									],
									'ts' => [
										'items' => null,
										'kind' => 'object',
										'properties' => [
											'kind' => [
												'typia' => [
													'constraints' => [
														'exclusiveMaximum' => null,
														'exclusiveMinimum' => null,
														'format' => null,
														'maxLength' => null,
														'maxItems' => null,
														'maximum' => null,
														'minLength' => null,
														'minItems' => null,
														'minimum' => null,
														'multipleOf' => null,
														'pattern' => null,
														'typeTag' => null
													],
													'defaultValue' => null,
													'hasDefault' => false
												],
												'ts' => [
													'items' => null,
													'kind' => 'string',
													'properties' => null,
													'required' => true,
													'union' => null
												],
												'wp' => [
													'defaultValue' => null,
													'enum' => [
														'url'
													],
													'hasDefault' => false,
													'type' => 'string'
												]
											],
											'href' => [
												'typia' => [
													'constraints' => [
														'exclusiveMaximum' => null,
														'exclusiveMinimum' => null,
														'format' => 'uri',
														'maxLength' => null,
														'maxItems' => null,
														'maximum' => null,
														'minLength' => null,
														'minItems' => null,
														'minimum' => null,
														'multipleOf' => null,
														'pattern' => null,
														'typeTag' => null
													],
													'defaultValue' => null,
													'hasDefault' => false
												],
												'ts' => [
													'items' => null,
													'kind' => 'string',
													'properties' => null,
													'required' => true,
													'union' => null
												],
												'wp' => [
													'defaultValue' => null,
													'enum' => null,
													'hasDefault' => false,
													'type' => 'string'
												]
											]
										],
										'required' => true,
										'union' => null
									],
									'wp' => [
										'defaultValue' => null,
										'enum' => null,
										'hasDefault' => false,
										'type' => 'object'
									]
								],
								'post' => [
									'typia' => [
										'constraints' => [
											'exclusiveMaximum' => null,
											'exclusiveMinimum' => null,
											'format' => null,
											'maxLength' => null,
											'maxItems' => null,
											'maximum' => null,
											'minLength' => null,
											'minItems' => null,
											'minimum' => null,
											'multipleOf' => null,
											'pattern' => null,
											'typeTag' => null
										],
										'defaultValue' => null,
										'hasDefault' => false
									],
									'ts' => [
										'items' => null,
										'kind' => 'object',
										'properties' => [
											'kind' => [
												'typia' => [
													'constraints' => [
														'exclusiveMaximum' => null,
														'exclusiveMinimum' => null,
														'format' => null,
														'maxLength' => null,
														'maxItems' => null,
														'maximum' => null,
														'minLength' => null,
														'minItems' => null,
														'minimum' => null,
														'multipleOf' => null,
														'pattern' => null,
														'typeTag' => null
													],
													'defaultValue' => null,
													'hasDefault' => false
												],
												'ts' => [
													'items' => null,
													'kind' => 'string',
													'properties' => null,
													'required' => true,
													'union' => null
												],
												'wp' => [
													'defaultValue' => null,
													'enum' => [
														'post'
													],
													'hasDefault' => false,
													'type' => 'string'
												]
											],
											'postId' => [
												'typia' => [
													'constraints' => [
														'exclusiveMaximum' => null,
														'exclusiveMinimum' => null,
														'format' => null,
														'maxLength' => null,
														'maxItems' => null,
														'maximum' => null,
														'minLength' => null,
														'minItems' => null,
														'minimum' => null,
														'multipleOf' => null,
														'pattern' => null,
														'typeTag' => 'uint32'
													],
													'defaultValue' => null,
													'hasDefault' => false
												],
												'ts' => [
													'items' => null,
													'kind' => 'number',
													'properties' => null,
													'required' => true,
													'union' => null
												],
												'wp' => [
													'defaultValue' => null,
													'enum' => null,
													'hasDefault' => false,
													'type' => 'number'
												]
											]
										],
										'required' => true,
										'union' => null
									],
									'wp' => [
										'defaultValue' => null,
										'enum' => null,
										'hasDefault' => false,
										'type' => 'object'
									]
								]
							],
							'discriminator' => 'kind'
						]
					]
				],
				'manifestVersion' => 2,
				'sourceType' => 'MyTypiaBlockAttributes'
			]
		]
	],
	'supportedMigrationVersions' => [
		'v1'
	]
];
