/* eslint-disable no-console */
import { BlockEditProps } from '@wordpress/blocks';
import {
	useBlockProps,
	InspectorControls,
	RichText,
} from '@wordpress/block-editor';
import { Notice, PanelBody, RangeControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useEffect } from '@wordpress/element';
import currentManifest from '../typia.manifest.json';
import {
	InspectorFromManifest,
	type ManifestDocument,
	useEditorFields,
	useTypedAttributeUpdater,
} from '@wp-typia/create/runtime/inspector';
import { MyTypiaBlockAttributes } from './types';
import { sanitizeMyTypiaBlockAttributes, validators } from './validators';
import { useTypiaValidation, useAttributeLogger, useDebounce } from './hooks';
import { ErrorBoundary } from './components/ErrorBoundary';
import { MigrationDashboard } from './admin/migration-dashboard';
import { classNames } from './utils';

type EditProps = BlockEditProps< MyTypiaBlockAttributes >;
type AlignmentValue = NonNullable< MyTypiaBlockAttributes[ 'alignment' ] >;
type AspectRatioValue = NonNullable< MyTypiaBlockAttributes[ 'aspectRatio' ] >;
type BackgroundColorValue = NonNullable<
	MyTypiaBlockAttributes[ 'backgroundColor' ]
>;
type FontSizeValue = NonNullable< MyTypiaBlockAttributes[ 'fontSize' ] >;
type PaddingKey = keyof NonNullable< MyTypiaBlockAttributes[ 'padding' ] >;
type TextColorValue = NonNullable< MyTypiaBlockAttributes[ 'textColor' ] >;

const FONT_SIZE_STYLES = {
	large: '1.25rem',
	medium: '1rem',
	small: '0.875rem',
	xlarge: '1.75rem',
} as const satisfies Record< string, string >;

function getFontSizeStyle( fontSize: FontSizeValue ): string {
	switch ( fontSize ) {
		case 'small':
			return FONT_SIZE_STYLES.small;
		case 'large':
			return FONT_SIZE_STYLES.large;
		case 'xlarge':
			return FONT_SIZE_STYLES.xlarge;
		case 'medium':
		default:
			return FONT_SIZE_STYLES.medium;
	}
}

export default function Edit( { attributes, setAttributes }: EditProps ) {
	const blockProps = useBlockProps();
	const editorFields = useEditorFields( currentManifest as ManifestDocument, {
		hidden: [ 'id', 'version' ],
		labels: {
			alignment: __( 'Alignment', 'my_typia_block' ),
			animation: __( 'Animation', 'my_typia_block' ),
			aspectRatio: __( 'Aspect Ratio', 'my_typia_block' ),
			backgroundColor: __( 'Background Color', 'my_typia_block' ),
			borderRadius: __( 'Border Radius', 'my_typia_block' ),
			className: __( 'CSS Class', 'my_typia_block' ),
			content: __( 'Content', 'my_typia_block' ),
			fontSize: __( 'Font Size', 'my_typia_block' ),
			isVisible: __( 'Visible', 'my_typia_block' ),
			linkTarget: __( 'Link Target', 'my_typia_block' ),
			'padding.bottom': __( 'Padding Bottom', 'my_typia_block' ),
			'padding.left': __( 'Padding Left', 'my_typia_block' ),
			'padding.right': __( 'Padding Right', 'my_typia_block' ),
			'padding.top': __( 'Padding Top', 'my_typia_block' ),
			textColor: __( 'Text Color', 'my_typia_block' ),
		},
		manual: [ 'animation', 'className', 'content', 'linkTarget' ],
		preferTextarea: [ 'content' ],
	} );
	const paddingBottomField = editorFields.getField( 'padding.bottom' );
	const paddingLeftField = editorFields.getField( 'padding.left' );
	const paddingRightField = editorFields.getField( 'padding.right' );
	const paddingTopField = editorFields.getField( 'padding.top' );
	const alignment = editorFields.getStringValue(
		attributes,
		'alignment',
		'left'
	) as AlignmentValue;
	const aspectRatio = editorFields.getStringValue(
		attributes,
		'aspectRatio',
		'16/9'
	) as AspectRatioValue;
	const backgroundColor = editorFields.getStringValue(
		attributes,
		'backgroundColor',
		'transparent'
	) as BackgroundColorValue;
	const borderRadius = editorFields.getNumberValue(
		attributes,
		'borderRadius',
		0
	);
	const fontSize = editorFields.getStringValue(
		attributes,
		'fontSize',
		'medium'
	) as FontSizeValue;
	const isVisible = editorFields.getBooleanValue(
		attributes,
		'isVisible',
		true
	);
	const padding = {
		bottom: editorFields.getNumberValue( attributes, 'padding.bottom', 0 ),
		left: editorFields.getNumberValue( attributes, 'padding.left', 0 ),
		right: editorFields.getNumberValue( attributes, 'padding.right', 0 ),
		top: editorFields.getNumberValue( attributes, 'padding.top', 0 ),
	};
	const textColor = editorFields.getStringValue(
		attributes,
		'textColor',
		'currentColor'
	) as TextColorValue;
	const { errorMessages, isValid } = useTypiaValidation(
		attributes,
		validators.validate
	);
	const debouncedAttributes = useDebounce( attributes, 300 );
	const validateEditorUpdate = ( nextAttributes: MyTypiaBlockAttributes ) => {
		try {
			return {
				data: sanitizeMyTypiaBlockAttributes( nextAttributes ),
				errors: [],
				isValid: true as const,
			};
		} catch ( error ) {
			if ( process.env.NODE_ENV !== 'production' ) {
				console.warn(
					'Sanitization failed, falling back to validation.',
					error
				);
			}

			return validators.validate( nextAttributes );
		}
	};
	const { updateField } = useTypedAttributeUpdater(
		attributes,
		setAttributes,
		validateEditorUpdate
	);

	useEffect( () => {
		if ( attributes.id ) {
			return;
		}

		if (
			typeof crypto !== 'undefined' &&
			typeof crypto.randomUUID === 'function'
		) {
			setAttributes( {
				id: crypto.randomUUID(),
			} );
		}
	}, [ attributes.id, setAttributes ] );

	// Log attribute changes in development
	useAttributeLogger( debouncedAttributes );

	const updatePadding = ( side: PaddingKey, nextValue: number ) =>
		updateField( `padding.${ side }`, nextValue );

	const previewStyle = {
		aspectRatio: aspectRatio === 'auto' ? undefined : aspectRatio,
		backgroundColor,
		borderRadius: `${ borderRadius }px`,
		color: textColor,
		fontSize: getFontSizeStyle( fontSize ),
		padding: `${ padding.top }px ${ padding.right }px ${ padding.bottom }px ${ padding.left }px`,
		textAlign: alignment,
	};

	return (
		<ErrorBoundary>
			<InspectorControls>
				<InspectorFromManifest
					attributes={ attributes }
					fieldLookup={ editorFields }
					onChange={ updateField }
					paths={ [
						'isVisible',
						'alignment',
						'fontSize',
						'textColor',
						'backgroundColor',
						'aspectRatio',
						'borderRadius',
					] }
					title={ __( 'Settings', 'my_typia_block' ) }
				>
					<RangeControl
						label={
							paddingTopField?.label ??
							__( 'Padding Top', 'my_typia_block' )
						}
						value={ padding.top }
						min={ paddingTopField?.minimum ?? 0 }
						max={ 64 }
						step={ paddingTopField?.step ?? 1 }
						onChange={ ( value ) =>
							updatePadding( 'top', value ?? padding.top )
						}
					/>
					<RangeControl
						label={
							paddingRightField?.label ??
							__( 'Padding Right', 'my_typia_block' )
						}
						value={ padding.right }
						min={ paddingRightField?.minimum ?? 0 }
						max={ 64 }
						step={ paddingRightField?.step ?? 1 }
						onChange={ ( value ) =>
							updatePadding( 'right', value ?? padding.right )
						}
					/>
					<RangeControl
						label={
							paddingBottomField?.label ??
							__( 'Padding Bottom', 'my_typia_block' )
						}
						value={ padding.bottom }
						min={ paddingBottomField?.minimum ?? 0 }
						max={ 64 }
						step={ paddingBottomField?.step ?? 1 }
						onChange={ ( value ) =>
							updatePadding( 'bottom', value ?? padding.bottom )
						}
					/>
					<RangeControl
						label={
							paddingLeftField?.label ??
							__( 'Padding Left', 'my_typia_block' )
						}
						value={ padding.left }
						min={ paddingLeftField?.minimum ?? 0 }
						max={ 64 }
						step={ paddingLeftField?.step ?? 1 }
						onChange={ ( value ) =>
							updatePadding( 'left', value ?? padding.left )
						}
					/>
					{ ! isValid && (
						<div className="components-notice is-error">
							<p>
								<strong>
									{ __(
										'Validation Errors:',
										'my_typia_block'
									) }
								</strong>
							</p>
							<ul style={ { margin: 0, paddingLeft: '1em' } }>
								{ errorMessages.map( ( error, index ) => (
									<li key={ index }>{ error }</li>
								) ) }
							</ul>
						</div>
					) }
				</InspectorFromManifest>
				{ editorFields.manualFields.length > 0 && (
					<PanelBody
						title={ __( 'Manual Typia Fields', 'my_typia_block' ) }
						initialOpen={ false }
					>
						<Notice status="info" isDismissible={ false }>
							<p>
								{ __(
									'These manifest fields stay manual in the reference app:',
									'my_typia_block'
								) }
							</p>
							<ul style={ { margin: 0, paddingLeft: '1em' } }>
								{ editorFields.manualFields.map( ( field ) => (
									<li key={ field.path }>
										<strong>{ field.label }</strong>
										{ field.reason
											? ` — ${ field.reason }`
											: '' }
									</li>
								) ) }
							</ul>
						</Notice>
					</PanelBody>
				) }
				<PanelBody
					title={ __( 'Migration Manager', 'my_typia_block' ) }
					initialOpen={ false }
				>
					<MigrationDashboard />
				</PanelBody>
			</InspectorControls>

			<div
				{ ...blockProps }
				className={ classNames( blockProps.className, {
					'has-validation-errors': ! isValid,
					'is-hidden': ! isVisible,
				} ) }
			>
				<div className="my-typia-block-editor">
					My Typia Block - Editor View
				</div>
				<div className="my-typia-block-preview" style={ previewStyle }>
					<RichText
						tagName="p"
						value={ attributes.content }
						onChange={ ( content ) =>
							updateField( 'content', content )
						}
						placeholder={ __(
							'Enter your text…',
							'my_typia_block'
						) }
						className={ classNames(
							'my-typia-block-content',
							`align-${ alignment }`
						) }
					/>
				</div>
				{ ! isValid && (
					<Notice status="error" isDismissible={ false }>
						<p>
							<strong>
								{ __( 'Validation Errors:', 'my_typia_block' ) }
							</strong>
						</p>
						<ul style={ { margin: 0, paddingLeft: '1em' } }>
							{ errorMessages.map( ( error, index ) => (
								<li key={ index }>{ error }</li>
							) ) }
						</ul>
					</Notice>
				) }

				<div className="block-info">
					<small>
						{ __(
							'My Typia Block – showcase of Typia validation, manifest-driven editor helpers, migrations, and interactivity.',
							'my_typia_block'
						) }
					</small>
				</div>
			</div>
		</ErrorBoundary>
	);
}
