import { __ } from '@wordpress/i18n';
import {
	InspectorControls,
	RichText,
	useBlockProps,
} from '@wordpress/block-editor';
import {
	Notice,
	PanelBody,
	TextControl,
	ToggleControl,
} from '@wordpress/components';
import currentManifest from './typia.manifest.json';
import {
	createEditorModel,
	type ManifestDocument,
} from '@wp-typia/create/runtime/editor';
import { useTypiaValidation } from '../../shared/hooks';
import type { PersistenceLikeButtonAttributes } from './types';
import { createAttributeUpdater, validators } from './validators';

export default function Edit( {
	attributes,
	setAttributes,
}: {
	attributes: PersistenceLikeButtonAttributes;
	setAttributes: (
		attrs: Partial< PersistenceLikeButtonAttributes >
	) => void;
} ) {
	const editorFieldMap = new Map(
		createEditorModel( currentManifest as ManifestDocument, {
			manual: [ 'content', 'resourceKey' ],
			labels: {
				likeLabel: __( 'Like Label', 'persistence-examples' ),
				resourceKey: __( 'Resource Key', 'persistence-examples' ),
				showCount: __( 'Show Count', 'persistence-examples' ),
				unlikeLabel: __( 'Unlike Label', 'persistence-examples' ),
			},
		} ).map( ( field ) => [ field.path, field ] )
	);
	const showCountField = editorFieldMap.get( 'showCount' );
	const likeLabelField = editorFieldMap.get( 'likeLabel' );
	const unlikeLabelField = editorFieldMap.get( 'unlikeLabel' );
	const { errorMessages, isValid } = useTypiaValidation(
		attributes,
		validators.validate
	);
	const updateAttribute = createAttributeUpdater( attributes, setAttributes );
	const showCount =
		attributes.showCount ??
		( typeof showCountField?.defaultValue === 'boolean'
			? showCountField.defaultValue
			: true );
	const likeLabel =
		attributes.likeLabel ??
		( typeof likeLabelField?.defaultValue === 'string'
			? likeLabelField.defaultValue
			: 'Like this' );
	const unlikeLabel =
		attributes.unlikeLabel ??
		( typeof unlikeLabelField?.defaultValue === 'string'
			? unlikeLabelField.defaultValue
			: 'Unlike' );

	return (
		<>
			<InspectorControls>
				<PanelBody
					title={ __(
						'Persistence Like Button Settings',
						'persistence-examples'
					) }
				>
					<ToggleControl
						label={
							showCountField?.label ||
							__( 'Show Count', 'persistence-examples' )
						}
						checked={ showCount }
						onChange={ ( value ) =>
							updateAttribute( 'showCount', value )
						}
					/>
					<TextControl
						label={
							likeLabelField?.label ||
							__( 'Like Label', 'persistence-examples' )
						}
						value={ likeLabel }
						onChange={ ( value ) =>
							updateAttribute( 'likeLabel', value )
						}
					/>
					<TextControl
						label={
							unlikeLabelField?.label ||
							__( 'Unlike Label', 'persistence-examples' )
						}
						value={ unlikeLabel }
						onChange={ ( value ) =>
							updateAttribute( 'unlikeLabel', value )
						}
					/>
					<TextControl
						label={ __( 'Resource Key', 'persistence-examples' ) }
						value={ attributes.resourceKey ?? '' }
						onChange={ ( value ) =>
							updateAttribute( 'resourceKey', value )
						}
						help={ __(
							'Stable key used by the like-button endpoint.',
							'persistence-examples'
						) }
					/>
					<Notice status="info" isDismissible={ false }>
						{ __(
							'Policy: authenticated (logged-in user + REST nonce)',
							'persistence-examples'
						) }
					</Notice>
					<Notice status="info" isDismissible={ false }>
						{ __(
							'Storage: custom-table user likes',
							'persistence-examples'
						) }
					</Notice>
				</PanelBody>
			</InspectorControls>
			<div { ...useBlockProps() }>
				<RichText
					tagName="p"
					className="wp-block-create-block-persistence-like-button__content"
					value={ attributes.content }
					onChange={ ( value ) =>
						updateAttribute( 'content', value )
					}
					placeholder={ __(
						'Persistence like button example',
						'persistence-examples'
					) }
				/>
				<p>
					{ __( 'Resource key:', 'persistence-examples' ) }{ ' ' }
					{ attributes.resourceKey || '—' }
				</p>
				{ ! isValid && (
					<Notice status="error" isDismissible={ false }>
						<ul>
							{ errorMessages.map( ( error, index ) => (
								<li key={ index }>{ error }</li>
							) ) }
						</ul>
					</Notice>
				) }
			</div>
		</>
	);
}
