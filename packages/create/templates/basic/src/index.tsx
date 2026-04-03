/**
 * WordPress {{title}} Block
 *
 * Typia-powered type-safe block
 */

import { registerBlockType } from '@wordpress/blocks';
import type { BlockConfiguration } from '@wordpress/blocks';
import { __ } from '@wordpress/i18n';
import { buildScaffoldBlockRegistration } from '@wp-typia/create/runtime/blocks';

// Import components
import Edit from './edit';
import Save from './save';
import metadata from './block.json';
import './style.scss';

// Import types
import { {{pascalCase}}Attributes } from './types';
import { validators } from './validators';

// Register the block
const registration = buildScaffoldBlockRegistration<
  BlockConfiguration<{{pascalCase}}Attributes>
>(metadata as Record<string, unknown>, {
  supports: {
    html: false,
    multiple: true,
    align: ['wide', 'full'],
  },
  example: {
    attributes: validators.random(),
  },
  edit: Edit,
  save: Save,
});

registerBlockType<{{pascalCase}}Attributes>(registration.name, registration.settings);
