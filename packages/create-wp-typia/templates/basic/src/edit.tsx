/**
 * Editor component for {{title}} Block
 */

import { BlockEditProps } from '@wordpress/blocks';
import { useBlockProps, InspectorControls } from '@wordpress/block-editor';
import { PanelBody, TextControl, ToggleControl, SelectControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { {{pascalCase}}Attributes } from './types';
import { validators, createAttributeUpdater } from './validators';
import { useValidation } from './hooks';

type EditProps = BlockEditProps<{{pascalCase}}Attributes>;

function Edit({ attributes, setAttributes }: EditProps) {
  const blockProps = useBlockProps();
  const { errors, isValid } = useValidation(attributes, validators.validate);
  const updateAttribute = createAttributeUpdater(
    attributes,
    setAttributes,
    validators.validate
  );

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
            label={__('정렬', '{{textDomain}}')}
            value={attributes.alignment || 'left'}
            options={[
              { label: __('왼쪽', '{{textDomain}}'), value: 'left' },
              { label: __('가운데', '{{textDomain}}'), value: 'center' },
              { label: __('오른쪽', '{{textDomain}}'), value: 'right' },
              { label: __('양쪽 맞춤', '{{textDomain}}'), value: 'justify' },
            ]}
            onChange={(value) => updateAttribute('alignment', value as any)}
          />

          <TextControl
            label={__('CSS 클래스', '{{textDomain}}')}
            value={attributes.className || ''}
            onChange={(value) => updateAttribute('className', value)}
            help={__('추가 CSS 클래스를 입력하세요.', '{{textDomain}}')}
          />

          <ToggleControl
            label={__('표시하기', '{{textDomain}}')}
            checked={attributes.isVisible !== false}
            onChange={(value) => updateAttribute('isVisible', value)}
          />
        </PanelBody>

        {!isValid && (
          <PanelBody title={__('유효성 검증 오류', '{{textDomain}}')} initialOpen>
            {errors.map((error, index) => (
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
      </div>
    </>
  );
}

export default Edit;
