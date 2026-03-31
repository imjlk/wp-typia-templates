/* eslint-disable no-console */
import { BlockEditProps } from '@wordpress/blocks';
import {
	useBlockProps,
	InspectorControls,
	RichText,
} from '@wordpress/block-editor';
import {
	Notice,
	PanelBody,
	RangeControl,
	SelectControl,
	TextControl,
	ToggleControl,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useEffect } from '@wordpress/element';
import currentManifest from '../typia.manifest.json';
import {
	createEditorModel,
	type EditorFieldDescriptor,
	type ManifestDocument,
} from '@wp-typia/create/runtime/editor';
import { MyTypiaBlockAttributes } from './types';
import {
	createAttributeUpdater,
	createNestedAttributeUpdater,
	validators,
} from './validators';
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

function getBooleanDefault(
	field: EditorFieldDescriptor | undefined,
	fallback: boolean
): boolean {
	return typeof field?.defaultValue === 'boolean'
		? field.defaultValue
		: fallback;
}

function getNumberDefault(
	field: EditorFieldDescriptor | undefined,
	fallback: number
): number {
	return typeof field?.defaultValue === 'number'
		? field.defaultValue
		: fallback;
}

function getStringDefault(
	field: EditorFieldDescriptor | undefined,
	fallback: string
): string {
	return typeof field?.defaultValue === 'string'
		? field.defaultValue
		: fallback;
}

function toSelectOptions(
	field: EditorFieldDescriptor | undefined
): Array< { label: string; value: string } > {
	return ( field?.options ?? [] ).map( ( option ) => ( {
		label: option.label,
		value: String( option.value ),
	} ) );
}

function parseNumberInput( value: string ): number | null {
	if ( value.trim() === '' ) {
		return null;
	}

	const parsed = Number( value );
	return Number.isFinite( parsed ) ? parsed : null;
}

export default function Edit( { attributes, setAttributes }: EditProps ) {
	const blockProps = useBlockProps();
	const editorFields = createEditorModel(
		currentManifest as ManifestDocument,
		{
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
		}
	);
	const editorFieldMap = new Map< string, EditorFieldDescriptor >(
		editorFields.map( ( field ) => [ field.path, field ] )
	);
	const alignmentField = editorFieldMap.get( 'alignment' );
	const aspectRatioField = editorFieldMap.get( 'aspectRatio' );
	const backgroundColorField = editorFieldMap.get( 'backgroundColor' );
	const borderRadiusField = editorFieldMap.get( 'borderRadius' );
	const fontSizeField = editorFieldMap.get( 'fontSize' );
	const isVisibleField = editorFieldMap.get( 'isVisible' );
	const paddingBottomField = editorFieldMap.get( 'padding.bottom' );
	const paddingLeftField = editorFieldMap.get( 'padding.left' );
	const paddingRightField = editorFieldMap.get( 'padding.right' );
	const paddingTopField = editorFieldMap.get( 'padding.top' );
	const textColorField = editorFieldMap.get( 'textColor' );
	const manualFields = editorFields.filter( ( field ) => ! field.supported );
	const alignment = ( attributes.alignment ??
		getStringDefault( alignmentField, 'left' ) ) as AlignmentValue;
	const aspectRatio = ( attributes.aspectRatio ??
		getStringDefault( aspectRatioField, '16/9' ) ) as AspectRatioValue;
	const backgroundColor = ( attributes.backgroundColor ??
		getStringDefault(
			backgroundColorField,
			'transparent'
		) ) as BackgroundColorValue;
	const borderRadius =
		attributes.borderRadius ?? getNumberDefault( borderRadiusField, 0 );
	const fontSize = ( attributes.fontSize ??
		getStringDefault( fontSizeField, 'medium' ) ) as FontSizeValue;
	const isVisible =
		attributes.isVisible ?? getBooleanDefault( isVisibleField, true );
	const padding = {
		bottom:
			attributes.padding?.bottom ??
			getNumberDefault( paddingBottomField, 0 ),
		left:
			attributes.padding?.left ?? getNumberDefault( paddingLeftField, 0 ),
		right:
			attributes.padding?.right ??
			getNumberDefault( paddingRightField, 0 ),
		top: attributes.padding?.top ?? getNumberDefault( paddingTopField, 0 ),
	};
	const textColor = ( attributes.textColor ??
		getStringDefault( textColorField, 'currentColor' ) ) as TextColorValue;
	const { errorMessages, isValid } = useTypiaValidation(
		attributes,
		validators.validate
	);
	const debouncedAttributes = useDebounce( attributes, 300 );
	const updateAttribute = createAttributeUpdater(
		attributes,
		setAttributes,
		validators.validate
	);
	const updateNestedAttribute = createNestedAttributeUpdater(
		attributes,
		setAttributes,
		validators.validate
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
		updateNestedAttribute( `padding.${ side }`, nextValue );

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
				<PanelBody title={ __( 'Settings', 'my_typia_block' ) }>
					<ToggleControl
						label={
							isVisibleField?.label ??
							__( 'Visible', 'my_typia_block' )
						}
						checked={ isVisible }
						onChange={ ( nextVisible ) =>
							updateAttribute( 'isVisible', nextVisible )
						}
					/>
					<SelectControl
						label={
							alignmentField?.label ??
							__( 'Alignment', 'my_typia_block' )
						}
						value={ alignment }
						options={ toSelectOptions( alignmentField ) }
						onChange={ ( nextAlignment ) =>
							updateAttribute(
								'alignment',
								nextAlignment as AlignmentValue
							)
						}
					/>
					<SelectControl
						label={
							fontSizeField?.label ??
							__( 'Font Size', 'my_typia_block' )
						}
						value={ fontSize }
						options={ toSelectOptions( fontSizeField ) }
						onChange={ ( nextFontSize ) =>
							updateAttribute(
								'fontSize',
								nextFontSize as FontSizeValue
							)
						}
					/>
					<SelectControl
						label={
							textColorField?.label ??
							__( 'Text Color', 'my_typia_block' )
						}
						value={ textColor }
						options={ toSelectOptions( textColorField ) }
						onChange={ ( nextColor ) =>
							updateAttribute(
								'textColor',
								nextColor as TextColorValue
							)
						}
					/>
					<SelectControl
						label={
							backgroundColorField?.label ??
							__( 'Background Color', 'my_typia_block' )
						}
						value={ backgroundColor }
						options={ toSelectOptions( backgroundColorField ) }
						onChange={ ( nextColor ) =>
							updateAttribute(
								'backgroundColor',
								nextColor as BackgroundColorValue
							)
						}
					/>
					<SelectControl
						label={
							aspectRatioField?.label ??
							__( 'Aspect Ratio', 'my_typia_block' )
						}
						value={ aspectRatio }
						options={ toSelectOptions( aspectRatioField ) }
						onChange={ ( nextRatio ) =>
							updateAttribute(
								'aspectRatio',
								nextRatio as AspectRatioValue
							)
						}
					/>
					<TextControl
						label={
							borderRadiusField?.label ??
							__( 'Border Radius', 'my_typia_block' )
						}
						type="number"
						min={ borderRadiusField?.minimum ?? 0 }
						step={ borderRadiusField?.step ?? 1 }
						value={ String( borderRadius ) }
						onChange={ ( value ) => {
							const parsed = parseNumberInput( value );
							if ( parsed === null ) {
								return;
							}
							updateAttribute(
								'borderRadius',
								Math.max(
									parsed,
									borderRadiusField?.minimum ?? parsed
								)
							);
						} }
					/>
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
				</PanelBody>
				{ manualFields.length > 0 && (
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
								{ manualFields.map( ( field ) => (
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
							updateAttribute( 'content', content )
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
