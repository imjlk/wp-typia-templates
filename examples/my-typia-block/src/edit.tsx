/* eslint-disable no-console */
import { BlockEditProps } from '@wordpress/blocks';
import {
	useBlockProps,
	InspectorControls,
	RichText,
} from '@wordpress/block-editor';
import { PanelBody, ToggleControl, SelectControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { MyTypiaBlockAttributes } from './types';
import { validators } from './validators';
import { useTypiaValidation, useAttributeLogger, useDebounce } from './hooks';
import { ErrorBoundary } from './components/ErrorBoundary';
import { MigrationDashboard } from './admin/migration-dashboard';
import { classNames } from './utils';

type EditProps = BlockEditProps< MyTypiaBlockAttributes >;

export default function Edit( { attributes, setAttributes }: EditProps ) {
	const blockProps = useBlockProps();
	const { isValid, errors } = useTypiaValidation(
		attributes,
		validators.validate
	);
	const debouncedAttributes = useDebounce( attributes, 300 );

	// Log attribute changes in development
	useAttributeLogger( debouncedAttributes );

	const updateAttribute = < K extends keyof MyTypiaBlockAttributes >(
		key: K,
		value: MyTypiaBlockAttributes[ K ]
	) => {
		const newAttrs = { ...attributes, [ key ]: value };
		const validation = validators.validate( newAttrs );

		if ( validation.success ) {
			setAttributes( {
				[ key ]: value,
			} as Partial< MyTypiaBlockAttributes > );
		} else {
			console.error(
				`Validation failed for ${ String( key ) }:`,
				validation.errors
			);
		}
	};

	return (
		<ErrorBoundary>
			<InspectorControls>
				<PanelBody title={ __( 'Settings', 'my_typia_block' ) }>
					<ToggleControl
						label={ __( 'Visible', 'my_typia_block' ) }
						checked={ attributes.isVisible ?? true }
						onChange={ ( isVisible ) =>
							updateAttribute( 'isVisible', isVisible )
						}
					/>
					<SelectControl
						label={ __( 'Alignment', 'my_typia_block' ) }
						value={ attributes.alignment ?? 'left' }
						options={ [
							{
								label: __( 'Left', 'my_typia_block' ),
								value: 'left',
							},
							{
								label: __( 'Center', 'my_typia_block' ),
								value: 'center',
							},
							{
								label: __( 'Right', 'my_typia_block' ),
								value: 'right',
							},
							{
								label: __( 'Justify', 'my_typia_block' ),
								value: 'justify',
							},
						] }
						onChange={ ( alignment ) =>
							updateAttribute( 'alignment', alignment as any )
						}
					/>
					<SelectControl
						label={ __( 'Font Size', 'my_typia_block' ) }
						value={ attributes.fontSize ?? 'medium' }
						options={ [
							{
								label: __( 'Small', 'my_typia_block' ),
								value: 'small',
							},
							{
								label: __( 'Medium', 'my_typia_block' ),
								value: 'medium',
							},
							{
								label: __( 'Large', 'my_typia_block' ),
								value: 'large',
							},
							{
								label: __( 'Extra Large', 'my_typia_block' ),
								value: 'xlarge',
							},
						] }
						onChange={ ( fontSize ) =>
							updateAttribute( 'fontSize', fontSize as any )
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
								{ errors.map( ( error, index ) => (
									<li key={ index }>
										<code>{ error.path }</code>:{ ' ' }
										{ error.message }
									</li>
								) ) }
							</ul>
						</div>
					) }
				</PanelBody>
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
					'is-hidden': ! attributes.isVisible,
				} ) }
			>
				<div className="my-typia-block-editor">
					My Typia Block - Editor View
				</div>
				<RichText
					tagName="p"
					value={ attributes.content }
					onChange={ ( content ) =>
						updateAttribute( 'content', content )
					}
					placeholder={ __( 'Enter your text…', 'my_typia_block' ) }
					className={ classNames(
						'my-typia-block-content',
						`align-${ attributes.alignment }`
					) }
					style={ {
						textAlign: attributes.alignment ?? 'left',
					} }
				/>

				<div className="block-info">
					<small>
						{ __(
							'My Typia Block – showcase of Typia validation, migrations, and interactivity.',
							'my_typia_block'
						) }
					</small>
				</div>
			</div>
		</ErrorBoundary>
	);
}
