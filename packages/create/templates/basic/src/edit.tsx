/**
 * Editor component for {{title}} Block
 */

import { BlockEditProps } from '@wordpress/blocks';
import {
  InspectorControls,
  RichText,
  useBlockProps,
} from '@wordpress/block-editor';
import { Notice, PanelBody, TextControl, ToggleControl, SelectControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import currentManifest from './typia.manifest.json';
import { createEditorModel, type ManifestDocument } from '@wp-typia/create/runtime/editor';
import { {{pascalCase}}Attributes } from './types';
import {
  validators,
  createAttributeUpdater,
  validate{{pascalCase}}Attributes,
} from './validators';
import { useTypiaValidation } from './hooks';

type EditProps = BlockEditProps<{{pascalCase}}Attributes>;
type AlignmentValue = NonNullable<{{pascalCase}}Attributes['alignment']>;

function Edit({ attributes, setAttributes }: EditProps) {
  const blockProps = useBlockProps();
  const editorFieldMap = new Map(
    createEditorModel(currentManifest as ManifestDocument, {
      hidden: ['id', 'version'],
      manual: ['content'],
      labels: {
        alignment: __('Alignment', '{{textDomain}}'),
        className: __('CSS Class', '{{textDomain}}'),
        content: __('Content', '{{textDomain}}'),
        isVisible: __('Visible', '{{textDomain}}'),
      },
    }).map((field) => [field.path, field]),
  );
  const alignmentField = editorFieldMap.get('alignment');
  const classNameField = editorFieldMap.get('className');
  const isVisibleField = editorFieldMap.get('isVisible');
  const { errorMessages, isValid } = useTypiaValidation(
    attributes,
    validate{{pascalCase}}Attributes
  );
  const updateAttribute = createAttributeUpdater(
    attributes,
    setAttributes,
    validators.validate
  );
  const alignmentValue = attributes.alignment || (typeof alignmentField?.defaultValue === 'string' ? alignmentField.defaultValue : 'left');
  const isVisible = attributes.isVisible ?? (typeof isVisibleField?.defaultValue === 'boolean' ? isVisibleField.defaultValue : true);
  const alignmentOptions = (alignmentField?.options || []).map((option) => ({
    label: ({
      center: __('Center', '{{textDomain}}'),
      justify: __('Justify', '{{textDomain}}'),
      left: __('Left', '{{textDomain}}'),
      right: __('Right', '{{textDomain}}'),
    })[String(option.value)] || option.label,
    value: String(option.value),
  }));

  return (
    <>
      <InspectorControls>
        <PanelBody title={__('Settings', '{{textDomain}}')}>
          <TextControl
            label={__('Content', '{{textDomain}}')}
            value={attributes.content || ''}
            onChange={(value) => updateAttribute('content', value)}
            help={__('Mirrors the main block content.', '{{textDomain}}')}
          />

          <SelectControl
            label={alignmentField?.label || __('Alignment', '{{textDomain}}')}
            value={alignmentValue}
            options={alignmentOptions}
            onChange={(value) => updateAttribute('alignment', value as AlignmentValue)}
          />

          <TextControl
            label={classNameField?.label || __('CSS Class', '{{textDomain}}')}
            value={attributes.className || ''}
            onChange={(value) => updateAttribute('className', value)}
            help={__('Add an optional CSS class name.', '{{textDomain}}')}
          />

          <ToggleControl
            label={isVisibleField?.label || __('Visible', '{{textDomain}}')}
            checked={isVisible}
            onChange={(value) => updateAttribute('isVisible', value)}
          />
        </PanelBody>

        {!isValid && (
          <PanelBody title={__('Validation Errors', '{{textDomain}}')} initialOpen>
            {errorMessages.map((error, index) => (
              <div key={index} style={{ color: '#cc1818', fontSize: '12px' }}>
                • {error}
              </div>
            ))}
          </PanelBody>
        )}
      </InspectorControls>

      <div {...blockProps}>
        <div className="wp-block-{{slug}}__content">
          <RichText
            tagName="p"
            value={attributes.content || ''}
            onChange={(value) => updateAttribute('content', value)}
            placeholder={__('Add your content...', '{{textDomain}}')}
          />
        </div>
        {!isValid && (
          <Notice status="error" isDismissible={false}>
            <p>
              <strong>{__('Validation Errors', '{{textDomain}}')}</strong>
            </p>
            <ul style={{ margin: 0, paddingLeft: '1em' }}>
              {errorMessages.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </Notice>
        )}
      </div>
    </>
  );
}

export default Edit;
