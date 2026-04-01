/**
 * Editor component for {{title}} Block
 */

import { BlockEditProps } from '@wordpress/blocks';
import { useBlockProps, InspectorControls } from '@wordpress/block-editor';
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
        alignment: __('정렬', '{{textDomain}}'),
        className: __('CSS 클래스', '{{textDomain}}'),
        content: __('콘텐츠', '{{textDomain}}'),
        isVisible: __('표시하기', '{{textDomain}}'),
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
      center: __('가운데', '{{textDomain}}'),
      justify: __('양쪽 맞춤', '{{textDomain}}'),
      left: __('왼쪽', '{{textDomain}}'),
      right: __('오른쪽', '{{textDomain}}'),
    })[String(option.value)] || option.label,
    value: String(option.value),
  }));

  return (
    <>
      <InspectorControls>
        <PanelBody title={__('설정', '{{textDomain}}')}>
          <TextControl
            label={__('콘텐츠', '{{textDomain}}')}
            value={attributes.content || ''}
            onChange={(value) => updateAttribute('content', value)}
            help={__('블록의 메인 콘텐츠입니다.', '{{textDomain}}')}
          />

          <SelectControl
            label={alignmentField?.label || __('정렬', '{{textDomain}}')}
            value={alignmentValue}
            options={alignmentOptions}
            onChange={(value) => updateAttribute('alignment', value as AlignmentValue)}
          />

          <TextControl
            label={classNameField?.label || __('CSS 클래스', '{{textDomain}}')}
            value={attributes.className || ''}
            onChange={(value) => updateAttribute('className', value)}
            help={__('추가 CSS 클래스를 입력하세요.', '{{textDomain}}')}
          />

          <ToggleControl
            label={isVisibleField?.label || __('표시하기', '{{textDomain}}')}
            checked={isVisible}
            onChange={(value) => updateAttribute('isVisible', value)}
          />
        </PanelBody>

        {!isValid && (
          <PanelBody title={__('유효성 검증 오류', '{{textDomain}}')} initialOpen>
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
          {attributes.content || (
            <span style={{ color: '#757575' }}>
              {__('콘텐츠를 입력하세요...', '{{textDomain}}')}
            </span>
          )}
        </div>
        {!isValid && (
          <Notice status="error" isDismissible={false}>
            <p>
              <strong>{__('유효성 검증 오류', '{{textDomain}}')}</strong>
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
