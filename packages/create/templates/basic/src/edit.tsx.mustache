/**
 * Editor component for {{title}} Block
 */

import { BlockEditProps } from '@wordpress/blocks';
import {
  InspectorControls,
  RichText,
  useBlockProps,
} from '@wordpress/block-editor';
import { Notice, PanelBody, TextControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import currentManifest from './typia.manifest.json';
import {
  InspectorFromManifest,
  type ManifestDocument,
  useEditorFields,
  useTypedAttributeUpdater,
} from '@wp-typia/create/runtime/inspector';
import { {{pascalCase}}Attributes } from './types';
import {
  sanitize{{pascalCase}}Attributes,
  validate{{pascalCase}}Attributes,
} from './validators';
import { useTypiaValidation } from './hooks';

type EditProps = BlockEditProps<{{pascalCase}}Attributes>;

function Edit({ attributes, setAttributes }: EditProps) {
  const blockProps = useBlockProps();
  const editorFields = useEditorFields(currentManifest as ManifestDocument, {
    hidden: ['id', 'version'],
    manual: ['content'],
    labels: {
      alignment: __('Alignment', '{{textDomain}}'),
      className: __('CSS Class', '{{textDomain}}'),
      content: __('Content', '{{textDomain}}'),
      isVisible: __('Visible', '{{textDomain}}'),
    },
  });
  const classNameField = editorFields.getField('className');
  const { errorMessages, isValid } = useTypiaValidation(
    attributes,
    validate{{pascalCase}}Attributes
  );
  const validateEditorUpdate = (nextAttributes: {{pascalCase}}Attributes) => {
    try {
      return {
        data: sanitize{{pascalCase}}Attributes(nextAttributes),
        errors: [],
        isValid: true as const,
      };
    } catch {
      return validate{{pascalCase}}Attributes(nextAttributes);
    }
  };
  const { updateField } = useTypedAttributeUpdater(
    attributes,
    setAttributes,
    validateEditorUpdate
  );

  return (
    <>
      <InspectorControls>
        <InspectorFromManifest
          attributes={attributes}
          fieldLookup={editorFields}
          onChange={updateField}
          paths={['alignment', 'isVisible']}
          title={__('Settings', '{{textDomain}}')}
        >
          <TextControl
            label={__('Content', '{{textDomain}}')}
            value={attributes.content || ''}
            onChange={(value) => updateField('content', value)}
            help={__('Mirrors the main block content.', '{{textDomain}}')}
          />

          <TextControl
            label={classNameField?.label || __('CSS Class', '{{textDomain}}')}
            value={attributes.className || ''}
            onChange={(value) => updateField('className', value)}
            help={__('Add an optional CSS class name.', '{{textDomain}}')}
          />
        </InspectorFromManifest>

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
            onChange={(value) => updateField('content', value)}
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
