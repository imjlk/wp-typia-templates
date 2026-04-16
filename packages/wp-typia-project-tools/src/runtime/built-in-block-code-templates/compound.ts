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

export const COMPOUND_CHILD_EDIT_TEMPLATE = `import type { BlockEditProps } from '@wp-typia/block-types/blocks/registration';
import { RichText, useBlockProps } from '@wordpress/block-editor';
import { Notice } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

import { useTypiaValidation } from './hooks';
import type { {{pascalCase}}ItemAttributes } from './types';
import {
\tcreateAttributeUpdater,
\tvalidate{{pascalCase}}ItemAttributes,
} from './validators';

type EditProps = BlockEditProps< {{pascalCase}}ItemAttributes >;

export default function Edit( {
\tattributes,
\tsetAttributes,
}: EditProps ) {
\tconst updateAttribute = createAttributeUpdater( attributes, setAttributes );
\tconst { errorMessages, isValid } = useTypiaValidation(
\t\tattributes,
\t\tvalidate{{pascalCase}}ItemAttributes
\t);

\treturn (
\t\t<div { ...useBlockProps( { className: '{{compoundChildCssClassName}}' } ) }>
\t\t\t<RichText
\t\t\t\ttagName="h4"
\t\t\t\tclassName="{{compoundChildCssClassName}}__title"
\t\t\t\tvalue={ attributes.title ?? '' }
\t\t\t\tonChange={ ( title ) => updateAttribute( 'title', title ) }
\t\t\t\tplaceholder={ __( {{compoundChildTitleJson}}, '{{textDomain}}' ) }
\t\t\t/>
\t\t\t<RichText
\t\t\t\ttagName="p"
\t\t\t\tclassName="{{compoundChildCssClassName}}__body"
\t\t\t\tvalue={ attributes.body ?? '' }
\t\t\t\tonChange={ ( body ) => updateAttribute( 'body', body ) }
\t\t\t\tplaceholder={ __( 'Add supporting details for this internal item.', '{{textDomain}}' ) }
\t\t\t/>
\t\t\t{ ! isValid && (
\t\t\t\t<Notice status="error" isDismissible={ false }>
\t\t\t\t\t<ul>
\t\t\t\t\t\t{ errorMessages.map( ( error, index ) => <li key={ index }>{ error }</li> ) }
\t\t\t\t\t</ul>
\t\t\t\t</Notice>
\t\t\t) }
\t\t</div>
\t);
}
`;

export const COMPOUND_CHILD_SAVE_TEMPLATE = `import { RichText, useBlockProps } from '@wordpress/block-editor';

import type { {{pascalCase}}ItemAttributes } from './types';

export default function Save( {
\tattributes,
}: {
\tattributes: {{pascalCase}}ItemAttributes;
} ) {
\treturn (
\t\t<div { ...useBlockProps.save( { className: '{{compoundChildCssClassName}}' } ) }>
\t\t\t<RichText.Content
\t\t\t\ttagName="h4"
\t\t\t\tclassName="{{compoundChildCssClassName}}__title"
\t\t\t\tvalue={ attributes.title }
\t\t\t/>
\t\t\t<RichText.Content
\t\t\t\ttagName="p"
\t\t\t\tclassName="{{compoundChildCssClassName}}__body"
\t\t\t\tvalue={ attributes.body }
\t\t\t/>
\t\t</div>
\t);
}
`;

export const COMPOUND_CHILD_INDEX_TEMPLATE = `import {
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
import '../{{slugKebabCase}}/style.scss';

import type { {{pascalCase}}ItemAttributes } from './types';

const registration = buildScaffoldBlockRegistration(
\tparseScaffoldBlockMetadata<BlockConfiguration< {{pascalCase}}ItemAttributes >>( metadata ),
\t{
\t\tedit: Edit,
\t\tsave: Save,
\t}
);

registerScaffoldBlockType(registration.name, registration.settings);
`;

export const COMPOUND_CHILD_VALIDATORS_TEMPLATE = `import typia from 'typia';
import currentManifest from './manifest-defaults-document';
import type {
\t{{pascalCase}}ItemAttributes,
\t{{pascalCase}}ItemValidationResult,
} from './types';
import { createTemplateValidatorToolkit } from '../../validator-toolkit';

const scaffoldValidators = createTemplateValidatorToolkit< {{pascalCase}}ItemAttributes >( {
\tassert: typia.createAssert< {{pascalCase}}ItemAttributes >(),
\tclone: typia.misc.createClone< {{pascalCase}}ItemAttributes >() as (
\t\tvalue: {{pascalCase}}ItemAttributes,
\t) => {{pascalCase}}ItemAttributes,
\tis: typia.createIs< {{pascalCase}}ItemAttributes >(),
\tmanifest: currentManifest,
\tprune: typia.misc.createPrune< {{pascalCase}}ItemAttributes >(),
\trandom: typia.createRandom< {{pascalCase}}ItemAttributes >() as (
\t\t...args: unknown[]
\t) => {{pascalCase}}ItemAttributes,
\tvalidate: typia.createValidate< {{pascalCase}}ItemAttributes >(),
} );

export const validate{{pascalCase}}ItemAttributes =
\tscaffoldValidators.validateAttributes as (
\t\tattributes: unknown
\t) => {{pascalCase}}ItemValidationResult;

export const validators = scaffoldValidators.validators;

export const sanitize{{pascalCase}}ItemAttributes =
\tscaffoldValidators.sanitizeAttributes as (
\t\tattributes: Partial< {{pascalCase}}ItemAttributes >
\t) => {{pascalCase}}ItemAttributes;

export const createAttributeUpdater = scaffoldValidators.createAttributeUpdater;
`;

export const COMPOUND_PERSISTENCE_PARENT_EDIT_TEMPLATE = `import type { BlockEditProps } from '@wp-typia/block-types/blocks/registration';
import { __ } from '@wordpress/i18n';
import {
\tInspectorControls,
\tInnerBlocks,
\tRichText,
\tuseBlockProps,
} from '@wordpress/block-editor';
import {
\tNotice,
\tPanelBody,
\tTextControl,
\tToggleControl,
} from '@wordpress/components';

import {
\tALLOWED_CHILD_BLOCKS,
\tDEFAULT_CHILD_TEMPLATE,
} from './children';
import { useTypiaValidation } from './hooks';
import type { {{pascalCase}}Attributes } from './types';
import {
\tcreateAttributeUpdater,
\tvalidate{{pascalCase}}Attributes,
} from './validators';

type EditProps = BlockEditProps< {{pascalCase}}Attributes >;

export default function Edit( {
\tattributes,
\tsetAttributes,
}: EditProps ) {
\tconst { errorMessages, isValid } = useTypiaValidation(
\t\tattributes,
\t\tvalidate{{pascalCase}}Attributes
\t);
\tconst updateAttribute = createAttributeUpdater( attributes, setAttributes );
\tconst blockProps = useBlockProps( {
\t\tclassName: '{{cssClassName}}',
\t} );

\treturn (
\t\t<>
\t\t\t<InspectorControls>
\t\t\t\t<PanelBody title={ __( 'Compound Settings', '{{textDomain}}' ) }>
\t\t\t\t\t<ToggleControl
\t\t\t\t\t\tlabel={ __( 'Show dividers between items', '{{textDomain}}' ) }
\t\t\t\t\t\tchecked={ attributes.showDividers ?? true }
\t\t\t\t\t\tonChange={ ( value ) => updateAttribute( 'showDividers', value ) }
\t\t\t\t\t/>
\t\t\t\t\t<ToggleControl
\t\t\t\t\t\tlabel={ __( 'Show persisted count', '{{textDomain}}' ) }
\t\t\t\t\t\tchecked={ attributes.showCount ?? true }
\t\t\t\t\t\tonChange={ ( value ) => updateAttribute( 'showCount', value ) }
\t\t\t\t\t/>
\t\t\t\t\t<TextControl
\t\t\t\t\t\tlabel={ __( 'Button label', '{{textDomain}}' ) }
\t\t\t\t\t\tvalue={ attributes.buttonLabel ?? 'Persist Count' }
\t\t\t\t\t\tonChange={ ( buttonLabel ) => updateAttribute( 'buttonLabel', buttonLabel ) }
\t\t\t\t\t/>
\t\t\t\t\t<TextControl
\t\t\t\t\t\tlabel={ __( 'Resource key', '{{textDomain}}' ) }
\t\t\t\t\t\tvalue={ attributes.resourceKey ?? '' }
\t\t\t\t\t\tonChange={ ( resourceKey ) => updateAttribute( 'resourceKey', resourceKey ) }
\t\t\t\t\t\thelp={ __( 'Stable key used by the persisted counter endpoint.', '{{textDomain}}' ) }
\t\t\t\t\t/>
\t\t\t\t\t<Notice status="info" isDismissible={ false }>
\t\t\t\t\t\t{ __( 'Storage mode: {{dataStorageMode}}', '{{textDomain}}' ) }
\t\t\t\t\t</Notice>
\t\t\t\t\t<Notice status="info" isDismissible={ false }>
\t\t\t\t\t\t{ __( 'Persistence policy: {{persistencePolicy}}', '{{textDomain}}' ) }
\t\t\t\t\t</Notice>
\t\t\t\t</PanelBody>
\t\t\t\t{ ! isValid && (
\t\t\t\t\t<PanelBody title={ __( 'Validation Errors', '{{textDomain}}' ) } initialOpen>
\t\t\t\t\t\t{ errorMessages.map( ( error, index ) => (
\t\t\t\t\t\t\t<Notice key={ index } status="error" isDismissible={ false }>
\t\t\t\t\t\t\t\t{ error }
\t\t\t\t\t\t\t</Notice>
\t\t\t\t\t\t) ) }
\t\t\t\t\t</PanelBody>
\t\t\t\t) }
\t\t\t</InspectorControls>
\t\t\t<div { ...blockProps }>
\t\t\t\t<RichText
\t\t\t\t\ttagName="h3"
\t\t\t\t\tclassName="{{cssClassName}}__heading"
\t\t\t\t\tvalue={ attributes.heading }
\t\t\t\t\tonChange={ ( heading ) => updateAttribute( 'heading', heading ) }
\t\t\t\t\tplaceholder={ __( {{titleJson}}, '{{textDomain}}' ) }
\t\t\t\t/>
\t\t\t\t<RichText
\t\t\t\t\ttagName="p"
\t\t\t\t\tclassName="{{cssClassName}}__intro"
\t\t\t\t\tvalue={ attributes.intro ?? '' }
\t\t\t\t\tonChange={ ( intro ) => updateAttribute( 'intro', intro ) }
\t\t\t\t\tplaceholder={ __(
\t\t\t\t\t\t'Add and reorder internal items inside this compound block.',
\t\t\t\t\t\t'{{textDomain}}'
\t\t\t\t\t) }
\t\t\t\t/>
\t\t\t\t{ ! isValid && (
\t\t\t\t\t<Notice status="error" isDismissible={ false }>
\t\t\t\t\t\t<ul>
\t\t\t\t\t\t\t{ errorMessages.map( ( error, index ) => <li key={ index }>{ error }</li> ) }
\t\t\t\t\t\t</ul>
\t\t\t\t\t</Notice>
\t\t\t\t) }
\t\t\t\t<p className="{{cssClassName}}__meta">
\t\t\t\t\t{ __( 'Resource key:', '{{textDomain}}' ) } { attributes.resourceKey || '—' }
\t\t\t\t</p>
\t\t\t\t<div className="{{cssClassName}}__items">
\t\t\t\t\t<InnerBlocks
\t\t\t\t\t\tallowedBlocks={ ALLOWED_CHILD_BLOCKS }
\t\t\t\t\t\trenderAppender={ InnerBlocks.ButtonBlockAppender }
\t\t\t\t\t\ttemplate={ DEFAULT_CHILD_TEMPLATE }
\t\t\t\t\t\ttemplateLock={ false }
\t\t\t\t\t/>
\t\t\t\t</div>
\t\t\t</div>
\t\t</>
\t);
}
`;

export const COMPOUND_PERSISTENCE_PARENT_SAVE_TEMPLATE = `export default function Save() {
\treturn null;
}
`;

export const COMPOUND_PERSISTENCE_PARENT_VALIDATORS_TEMPLATE = `import typia from 'typia';
import currentManifest from './manifest-defaults-document';
import type {
\t{{pascalCase}}Attributes,
\t{{pascalCase}}ValidationResult,
} from './types';
import { generateResourceKey } from '@wp-typia/block-runtime/identifiers';
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
\tfinalize: ( normalized ) => ( {
\t\t...normalized,
\t\tresourceKey:
\t\t\tnormalized.resourceKey && normalized.resourceKey.length > 0
\t\t\t\t? normalized.resourceKey
\t\t\t\t: generateResourceKey( '{{slugKebabCase}}' ),
\t} ),
\tvalidate: typia.createValidate< {{pascalCase}}Attributes >(),
} );

export const validators = scaffoldValidators.validators;

export const validate{{pascalCase}}Attributes =
\tscaffoldValidators.validateAttributes as (
\t\tattributes: unknown
\t) => {{pascalCase}}ValidationResult;

export const sanitize{{pascalCase}}Attributes =
\tscaffoldValidators.sanitizeAttributes as (
\t\tattributes: Partial< {{pascalCase}}Attributes >
\t) => {{pascalCase}}Attributes;

export const createAttributeUpdater = scaffoldValidators.createAttributeUpdater;
`;

export const COMPOUND_PERSISTENCE_PARENT_INTERACTIVITY_TEMPLATE = `import { getContext, store } from '@wordpress/interactivity';
import { generatePublicWriteRequestId } from '@wp-typia/block-runtime/identifiers';

import { fetchBootstrap, fetchState, writeState } from './api';
import type {
\t{{pascalCase}}ClientState,
\t{{pascalCase}}Context,
\t{{pascalCase}}State,
} from './types';

function hasExpiredPublicWriteToken(
\texpiresAt?: number
): boolean {
\treturn (
\t\ttypeof expiresAt === 'number' &&
\t\texpiresAt > 0 &&
\t\tDate.now() >= expiresAt * 1000
\t);
}

function getWriteBlockedMessage(
\tcontext: {{pascalCase}}Context
): string {
\treturn context.persistencePolicy === 'authenticated'
\t\t? 'Sign in to persist this counter.'
\t\t: 'Public writes are temporarily unavailable.';
}

const BOOTSTRAP_MAX_ATTEMPTS = 3;
const BOOTSTRAP_RETRY_DELAYS_MS = [ 250, 500 ];

async function waitForBootstrapRetry( delayMs: number ): Promise< void > {
\tawait new Promise( ( resolve ) => {
\t\tsetTimeout( resolve, delayMs );
\t} );
}

function getClientState(
\tcontext: {{pascalCase}}Context
): {{pascalCase}}ClientState {
\tif ( context.client ) {
\t\treturn context.client;
\t}

\tcontext.client = {
\t\tbootstrapError: '',
\t\twriteExpiry: 0,
\t\twriteNonce: '',
\t\twriteToken: '',
\t};

\treturn context.client;
}

function clearBootstrapError(
\tcontext: {{pascalCase}}Context,
\tclientState: {{pascalCase}}ClientState
): void {
\tif ( context.error === clientState.bootstrapError ) {
\t\tcontext.error = '';
\t}
\tclientState.bootstrapError = '';
}

function setBootstrapError(
\tcontext: {{pascalCase}}Context,
\tclientState: {{pascalCase}}ClientState,
\tmessage: string
): void {
\tclientState.bootstrapError = message;
\tcontext.error = message;
}

const { actions, state } = store( '{{slugKebabCase}}', {
\tstate: {
\t\tisHydrated: false,
\t} as {{pascalCase}}State,

\tactions: {
\t\tasync loadState() {
\t\t\tconst context = getContext< {{pascalCase}}Context >();
\t\t\tif ( context.postId <= 0 || ! context.resourceKey ) {
\t\t\t\treturn;
\t\t\t}

\t\t\tcontext.isLoading = true;
\t\t\tcontext.error = '';

\t\t\ttry {
\t\t\t\tconst result = await fetchState( {
\t\t\t\t\tpostId: context.postId,
\t\t\t\t\tresourceKey: context.resourceKey,
\t\t\t\t}, {
\t\t\t\t\ttransportTarget: 'frontend',
\t\t\t\t} );
\t\t\t\tif ( ! result.isValid || ! result.data ) {
\t\t\t\t\tcontext.error = result.errors[ 0 ]?.expected ?? 'Unable to load counter';
\t\t\t\t\treturn;
\t\t\t\t}
\t\t\t\tcontext.count = result.data.count;
\t\t\t} catch ( error ) {
\t\t\t\tcontext.error =
\t\t\t\t\terror instanceof Error ? error.message : 'Unknown loading error';
\t\t\t} finally {
\t\t\t\tcontext.isLoading = false;
\t\t\t}
\t\t},
\t\tasync loadBootstrap() {
\t\t\tconst context = getContext< {{pascalCase}}Context >();
\t\t\tconst clientState = getClientState( context );
\t\t\tif ( context.postId <= 0 || ! context.resourceKey ) {
\t\t\t\tcontext.bootstrapReady = true;
\t\t\t\tcontext.canWrite = false;
\t\t\t\tclientState.bootstrapError = '';
\t\t\t\tclientState.writeExpiry = 0;
\t\t\t\tclientState.writeNonce = '';
\t\t\t\tclientState.writeToken = '';
\t\t\t\treturn;
\t\t\t}

\t\t\tcontext.isBootstrapping = true;

\t\t\tlet bootstrapSucceeded = false;
\t\t\tlet lastBootstrapError =
\t\t\t\t'Unable to initialize write access';
\t\t\tconst includePublicWriteCredentials = {{isPublicPersistencePolicy}};
\t\t\tconst includeRestNonce = {{isAuthenticatedPersistencePolicy}};

\t\t\tfor ( let attempt = 1; attempt <= BOOTSTRAP_MAX_ATTEMPTS; attempt += 1 ) {
\t\t\t\ttry {
\t\t\t\t\tconst result = await fetchBootstrap( {
\t\t\t\t\t\tpostId: context.postId,
\t\t\t\t\t\tresourceKey: context.resourceKey,
\t\t\t\t\t}, {
\t\t\t\t\t\ttransportTarget: 'frontend',
\t\t\t\t\t} );
\t\t\t\t\tif ( ! result.isValid || ! result.data ) {
\t\t\t\t\t\tlastBootstrapError =
\t\t\t\t\t\t\tresult.errors[ 0 ]?.expected ??
\t\t\t\t\t\t\t'Unable to initialize write access';
\t\t\t\t\t\tif ( attempt < BOOTSTRAP_MAX_ATTEMPTS ) {
\t\t\t\t\t\t\tawait waitForBootstrapRetry(
\t\t\t\t\t\t\t\tBOOTSTRAP_RETRY_DELAYS_MS[ attempt - 1 ] ?? 750
\t\t\t\t\t\t\t);
\t\t\t\t\t\t\tcontinue;
\t\t\t\t\t\t}
\t\t\t\t\t\tbreak;
\t\t\t\t\t}

\t\t\t\t\tclientState.writeExpiry =
\t\t\t\t\t\tincludePublicWriteCredentials &&
\t\t\t\t\t\t'publicWriteExpiresAt' in result.data &&
\t\t\t\t\t\ttypeof result.data.publicWriteExpiresAt === 'number' &&
\t\t\t\t\t\tresult.data.publicWriteExpiresAt > 0
\t\t\t\t\t\t\t? result.data.publicWriteExpiresAt
\t\t\t\t\t\t\t: 0;
\t\t\t\t\tclientState.writeToken =
\t\t\t\t\t\tincludePublicWriteCredentials &&
\t\t\t\t\t\t'publicWriteToken' in result.data &&
\t\t\t\t\t\ttypeof result.data.publicWriteToken === 'string' &&
\t\t\t\t\t\tresult.data.publicWriteToken.length > 0
\t\t\t\t\t\t\t? result.data.publicWriteToken
\t\t\t\t\t\t\t: '';
\t\t\t\t\tclientState.writeNonce =
\t\t\t\t\t\tincludeRestNonce &&
\t\t\t\t\t\t'restNonce' in result.data &&
\t\t\t\t\t\ttypeof result.data.restNonce === 'string' &&
\t\t\t\t\t\tresult.data.restNonce.length > 0
\t\t\t\t\t\t\t? result.data.restNonce
\t\t\t\t\t\t\t: '';
\t\t\t\t\tcontext.bootstrapReady = true;
\t\t\t\t\tcontext.canWrite =
\t\t\t\t\t\tresult.data.canWrite === true &&
\t\t\t\t\t\t(
\t\t\t\t\t\t\tcontext.persistencePolicy === 'authenticated'
\t\t\t\t\t\t\t\t? clientState.writeNonce.length > 0
\t\t\t\t\t\t\t\t: clientState.writeToken.length > 0 &&
\t\t\t\t\t\t\t\t\t! hasExpiredPublicWriteToken( clientState.writeExpiry )
\t\t\t\t\t\t);
\t\t\t\t\tclearBootstrapError( context, clientState );
\t\t\t\t\tbootstrapSucceeded = true;
\t\t\t\t\tbreak;
\t\t\t\t} catch ( error ) {
\t\t\t\t\tlastBootstrapError =
\t\t\t\t\t\terror instanceof Error ? error.message : 'Unknown bootstrap error';
\t\t\t\t\tif ( attempt < BOOTSTRAP_MAX_ATTEMPTS ) {
\t\t\t\t\t\tawait waitForBootstrapRetry(
\t\t\t\t\t\t\tBOOTSTRAP_RETRY_DELAYS_MS[ attempt - 1 ] ?? 750
\t\t\t\t\t\t);
\t\t\t\t\t\tcontinue;
\t\t\t\t\t}
\t\t\t\t\tbreak;
\t\t\t\t}
\t\t\t}

\t\t\tif ( ! bootstrapSucceeded ) {
\t\t\t\tcontext.bootstrapReady = false;
\t\t\t\tcontext.canWrite = false;
\t\t\t\tclientState.writeExpiry = 0;
\t\t\t\tclientState.writeNonce = '';
\t\t\t\tclientState.writeToken = '';
\t\t\t\tsetBootstrapError( context, clientState, lastBootstrapError );
\t\t\t}
\t\t\tcontext.isBootstrapping = false;
\t\t},
\t\tasync increment() {
\t\t\tconst context = getContext< {{pascalCase}}Context >();
\t\t\tconst clientState = getClientState( context );
\t\t\tif ( context.postId <= 0 || ! context.resourceKey ) {
\t\t\t\treturn;
\t\t\t}
\t\t\tif ( ! context.bootstrapReady ) {
\t\t\t\tawait actions.loadBootstrap();
\t\t\t}
\t\t\tif ( ! context.bootstrapReady ) {
\t\t\t\tcontext.error = 'Write access is still initializing.';
\t\t\t\treturn;
\t\t\t}
\t\t\tif (
\t\t\t\tcontext.persistencePolicy === 'public' &&
\t\t\t\thasExpiredPublicWriteToken( clientState.writeExpiry )
\t\t\t) {
\t\t\t\tawait actions.loadBootstrap();
\t\t\t}
\t\t\tif (
\t\t\t\tcontext.persistencePolicy === 'public' &&
\t\t\t\thasExpiredPublicWriteToken( clientState.writeExpiry )
\t\t\t) {
\t\t\t\tcontext.canWrite = false;
\t\t\t\tcontext.error = getWriteBlockedMessage( context );
\t\t\t\treturn;
\t\t\t}
\t\t\tif ( ! context.canWrite ) {
\t\t\t\tcontext.error = getWriteBlockedMessage( context );
\t\t\t\treturn;
\t\t\t}

\t\t\tcontext.isSaving = true;
\t\t\tcontext.error = '';

\t\t\ttry {
\t\t\t\tconst result = await writeState( {
\t\t\t\t\tdelta: 1,
\t\t\t\t\tpostId: context.postId,
\t\t\t\t\tpublicWriteRequestId:
\t\t\t\t\t\tcontext.persistencePolicy === 'public'
\t\t\t\t\t\t\t? generatePublicWriteRequestId()
\t\t\t\t\t\t\t: undefined,
\t\t\t\t\tpublicWriteToken:
\t\t\t\t\t\tcontext.persistencePolicy === 'public' &&
\t\t\t\t\t\tclientState.writeToken.length > 0
\t\t\t\t\t\t\t? clientState.writeToken
\t\t\t\t\t\t\t: undefined,
\t\t\t\t\tresourceKey: context.resourceKey,
\t\t\t\t}, {
\t\t\t\t\trestNonce:
\t\t\t\t\t\tclientState.writeNonce.length > 0
\t\t\t\t\t\t\t? clientState.writeNonce
\t\t\t\t\t\t\t: undefined,
\t\t\t\t\ttransportTarget: 'frontend',
\t\t\t\t} );
\t\t\t\tif ( ! result.isValid || ! result.data ) {
\t\t\t\t\tcontext.error = result.errors[ 0 ]?.expected ?? 'Unable to update counter';
\t\t\t\t\treturn;
\t\t\t\t}
\t\t\t\tcontext.count = result.data.count;
\t\t\t\tcontext.storage = result.data.storage;
\t\t\t} catch ( error ) {
\t\t\t\tcontext.error =
\t\t\t\t\terror instanceof Error ? error.message : 'Unknown update error';
\t\t\t} finally {
\t\t\t\tcontext.isSaving = false;
\t\t\t}
\t\t},
\t},

\tcallbacks: {
\t\tinit() {
\t\t\tconst context = getContext< {{pascalCase}}Context >();
\t\t\tcontext.client = {
\t\t\t\tbootstrapError: '',
\t\t\t\twriteExpiry: 0,
\t\t\t\twriteNonce: '',
\t\t\t\twriteToken: '',
\t\t\t};
\t\t\tcontext.bootstrapReady = false;
\t\t\tcontext.canWrite = false;
\t\t\tcontext.count = 0;
\t\t\tcontext.error = '';
\t\t\tcontext.isBootstrapping = false;
\t\t\tcontext.isLoading = false;
\t\t\tcontext.isSaving = false;
\t\t},
\t\tmounted() {
\t\t\tstate.isHydrated = true;
\t\t\tif ( typeof document !== 'undefined' ) {
\t\t\t\tdocument.documentElement.dataset[ '{{slugCamelCase}}Hydrated' ] = 'true';
\t\t\t}
\t\t\tvoid Promise.allSettled( [
\t\t\t\tactions.loadState(),
\t\t\t\tactions.loadBootstrap(),
\t\t\t] );
\t\t},
\t},
} );
`;
