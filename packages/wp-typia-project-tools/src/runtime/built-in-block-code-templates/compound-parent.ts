export const COMPOUND_PARENT_EDIT_TEMPLATE = `import type { BlockEditProps } from '@wp-typia/block-types/blocks/registration';
import { __ } from '@wordpress/i18n';
import {
	InspectorControls,
	InnerBlocks,
	RichText,
	useBlockProps,
} from '@wordpress/block-editor';
import { Notice, PanelBody, ToggleControl } from '@wordpress/components';

import {
	ALLOWED_CHILD_BLOCKS,
	DEFAULT_CHILD_TEMPLATE,
} from './children';
import { useTypiaValidation } from './hooks';
import type { {{pascalCase}}Attributes } from './types';
import {
	createAttributeUpdater,
	validate{{pascalCase}}Attributes,
} from './validators';

type EditProps = BlockEditProps< {{pascalCase}}Attributes >;

export default function Edit( {
	attributes,
	setAttributes,
}: EditProps ) {
	const { errorMessages, isValid } = useTypiaValidation(
		attributes,
		validate{{pascalCase}}Attributes
	);
	const updateAttribute = createAttributeUpdater( attributes, setAttributes );
	const blockProps = useBlockProps( {
		className: '{{cssClassName}}',
	} );

	return (
		<>
			<InspectorControls>
				<PanelBody title={ __( 'Compound Settings', '{{textDomain}}' ) }>
					<ToggleControl
						label={ __( 'Show dividers between items', '{{textDomain}}' ) }
						checked={ attributes.showDividers ?? true }
						onChange={ ( value ) => updateAttribute( 'showDividers', value ) }
					/>
				</PanelBody>
				{ ! isValid && (
					<PanelBody title={ __( 'Validation Errors', '{{textDomain}}' ) } initialOpen>
						{ errorMessages.map( ( error, index ) => (
							<Notice key={ index } status="error" isDismissible={ false }>
								{ error }
							</Notice>
						) ) }
					</PanelBody>
				) }
			</InspectorControls>
			<div { ...blockProps }>
				<RichText
					tagName="h3"
					className="{{cssClassName}}__heading"
					value={ attributes.heading }
					onChange={ ( heading ) => updateAttribute( 'heading', heading ) }
					placeholder={ __( {{titleJson}}, '{{textDomain}}' ) }
				/>
				<RichText
					tagName="p"
					className="{{cssClassName}}__intro"
					value={ attributes.intro ?? '' }
					onChange={ ( intro ) => updateAttribute( 'intro', intro ) }
					placeholder={ __(
						'Add and reorder internal items inside this compound block.',
						'{{textDomain}}'
					) }
				/>
				{ ! isValid && (
					<Notice status="error" isDismissible={ false }>
						<ul>
							{ errorMessages.map( ( error, index ) => <li key={ index }>{ error }</li> ) }
						</ul>
					</Notice>
				) }
				<div className="{{cssClassName}}__items">
					<InnerBlocks
						allowedBlocks={ ALLOWED_CHILD_BLOCKS }
						renderAppender={ InnerBlocks.ButtonBlockAppender }
						template={ DEFAULT_CHILD_TEMPLATE }
						templateLock={ false }
					/>
				</div>
			</div>
		</>
	);
}
`;

export const COMPOUND_PARENT_SAVE_TEMPLATE = `import { InnerBlocks, RichText, useBlockProps } from '@wordpress/block-editor';

import type { {{pascalCase}}Attributes } from './types';

export default function Save( {
	attributes,
}: {
	attributes: {{pascalCase}}Attributes;
} ) {
	return (
		<div
			{ ...useBlockProps.save( {
				className: '{{cssClassName}}',
				'data-show-dividers': ( attributes.showDividers ?? true ) ? 'true' : 'false',
			} ) }
		>
			<RichText.Content
				tagName="h3"
				className="{{cssClassName}}__heading"
				value={ attributes.heading }
			/>
			<RichText.Content
				tagName="p"
				className="{{cssClassName}}__intro"
				value={ attributes.intro ?? '' }
			/>
			<div className="{{cssClassName}}__items">
				<InnerBlocks.Content />
			</div>
		</div>
	);
}
`;

export const COMPOUND_PARENT_INDEX_TEMPLATE = `import {
\tregisterScaffoldBlockType,
\ttype BlockConfiguration,
} from '@wp-typia/block-types/blocks/registration';
import {
\tbuildScaffoldBlockRegistration,
\tparseScaffoldBlockMetadata,
} from '@wp-typia/block-runtime/blocks';

import Edit from './edit';
import Save from './save';
import metadata from './block-metadata';
import './style.scss';

import type { {{pascalCase}}Attributes } from './types';

const registration = buildScaffoldBlockRegistration(
\tparseScaffoldBlockMetadata<BlockConfiguration< {{pascalCase}}Attributes >>( metadata ),
\t{
\t\tedit: Edit,
\t\tsave: Save,
\t}
);

registerScaffoldBlockType(registration.name, registration.settings);
`;

export const COMPOUND_LOCAL_HOOKS_TEMPLATE = `export {
	formatValidationError,
	formatValidationErrors,
	useTypiaValidation,
} from '../../hooks';

export type {
	TypiaValidationError,
	ValidationResult,
	ValidationState,
} from '../../hooks';
`;

export const COMPOUND_PARENT_VALIDATORS_TEMPLATE = `import typia from 'typia';
import currentManifest from './manifest-defaults-document';
import type {
\t{{pascalCase}}Attributes,
\t{{pascalCase}}ValidationResult,
} from './types';
import { createTemplateValidatorToolkit } from '../../validator-toolkit';

const scaffoldValidators = createTemplateValidatorToolkit< {{pascalCase}}Attributes >( {
\tassert: typia.createAssert< {{pascalCase}}Attributes >(),
\tclone: typia.misc.createClone< {{pascalCase}}Attributes >() as (
\t\tvalue: {{pascalCase}}Attributes,
\t) => {{pascalCase}}Attributes,
\tis: typia.createIs< {{pascalCase}}Attributes >(),
\tmanifest: currentManifest,
\tprune: typia.misc.createPrune< {{pascalCase}}Attributes >(),
\trandom: typia.createRandom< {{pascalCase}}Attributes >() as (
\t\t...args: unknown[]
\t) => {{pascalCase}}Attributes,
\tvalidate: typia.createValidate< {{pascalCase}}Attributes >(),
} );

export const validate{{pascalCase}}Attributes =
\tscaffoldValidators.validateAttributes as (
\t\tattributes: unknown
\t) => {{pascalCase}}ValidationResult;

export const validators = scaffoldValidators.validators;

export const sanitize{{pascalCase}}Attributes =
\tscaffoldValidators.sanitizeAttributes as (
\t\tattributes: Partial< {{pascalCase}}Attributes >
\t) => {{pascalCase}}Attributes;

export const createAttributeUpdater = scaffoldValidators.createAttributeUpdater;
`;

export const COMPOUND_CHILDREN_TEMPLATE = `import type { BlockTemplate } from '@wp-typia/block-types/blocks/registration';

export const DEFAULT_CHILD_BLOCK_NAME = '{{namespace}}/{{slugKebabCase}}-item';

export const ALLOWED_CHILD_BLOCKS = [
\tDEFAULT_CHILD_BLOCK_NAME,
\t// add-child: insert new allowed child block names here
];

export const DEFAULT_CHILD_TEMPLATE: BlockTemplate = [
\t[
\t\tDEFAULT_CHILD_BLOCK_NAME,
\t\t{
\t\t\tbody: 'Add supporting details for the first internal item.',
\t\t\ttitle: 'First Item',
\t\t},
\t],
\t[
\t\tDEFAULT_CHILD_BLOCK_NAME,
\t\t{
\t\t\tbody: 'Add supporting details for the second internal item.',
\t\t\ttitle: 'Second Item',
\t\t},
\t],
];
`;
